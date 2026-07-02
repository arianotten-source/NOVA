import { sendAiMessage } from '@/services/aiService';
import { thinkingEngine, waitThinkingMinimum } from '@/lib/thinking/ThinkingEngine';
import type { ThinkingSnapshot } from '@/lib/thinking/ThinkingEngine';
import { emotionForCategory } from '@/lib/thinking/thinkingEmotions';
import { classifyQuestion } from '@/lib/thinking/questionClassifier';
import {
  acquireMicStream,
  micEchoCancellationActive,
  releaseMicStream,
  setMicTrackMuted,
} from '@/lib/voice/micStream';
import { speakText, stopSpeaking } from '@/lib/voice/textToSpeech';
import { voiceActivityDetector } from '@/lib/voice/voiceActivityDetection';
import { voiceLog } from '@/lib/voice/voiceLogger';
import { setSpeaking as setGlobalSpeaking, voiceState } from '@/lib/voice/voiceState';
import { requestMicrophonePermission } from '@/lib/voice/permissions';
import { conversationMemory } from './conversationMemory';
import { containsWakeWord, stripWakeWord } from './hotwordEngine';
import { lipSyncEngine } from './lipSync';
import { speechRecognitionManager } from './speechRecognitionManager';
import { isDuplicateTranscript, normalizeTranscript } from './transcriptUtils';
import { VoiceState, VOICE_V2, type VoiceSnapshot } from './types';

type SnapshotListener = (snap: VoiceSnapshot) => void;
type AvatarBridge = {
  setVoiceSignals: (partial: import('@/lib/avatar/engine/types').VoiceSignals) => void;
  setThinking: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
};

function emptyThinking(): ThinkingSnapshot {
  return thinkingEngine.getSnapshot();
}

export class VoiceEngineV2 {
  private state: VoiceState = VoiceState.IDLE;
  private listeners = new Set<SnapshotListener>();
  private avatarBridge: AvatarBridge | null = null;

  private interimText = '';
  private finalText = '';
  private accumulated = '';
  private lastProcessedTranscript = '';
  private error: string | null = null;
  private aiConnected = false;
  private aiLatencyMs: number | null = null;
  private aiInFlight = false;
  private wakeWordListening = false;
  private wakeWordDetected = false;
  private micEnabled = true;
  private echoCancellation = true;
  private emotion = 'neutral';
  private thinkingSnapshot = emptyThinking();

  private debounceTimer: number | null = null;
  private silenceTimer: number | null = null;
  private waitTimer: number | null = null;
  private lastSpeechAt = 0;
  private abortController: AbortController | null = null;
  private sessionGen = 0;
  private intentionalFinalize = false;
  private bypassHotword = false;

  init(): boolean {
    if (!speechRecognitionManager.init()) return false;

    speechRecognitionManager.setHandlers({
      onResult: (interim, finalPart) => this.handleSttResult(interim, finalPart),
      onEnd: (intentional) => this.handleSttEnd(intentional),
      onError: (msg) => {
        this.error = `Spraakherkenning: ${msg}`;
        this.emit();
      },
    });

    return true;
  }

  setAvatarBridge(bridge: AvatarBridge) {
    this.avatarBridge = bridge;
  }

  subscribe(fn: SnapshotListener): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  getSnapshot(): VoiceSnapshot {
    return {
      state: this.state,
      interimText: this.interimText,
      finalText: this.finalText,
      currentTranscript: this.interimText || this.finalText,
      error: this.error,
      aiConnected: this.aiConnected,
      aiLatencyMs: this.aiLatencyMs,
      aiQueueSize: this.aiInFlight ? 1 : 0,
      micEnabled: this.micEnabled,
      recognitionActive: speechRecognitionManager.isActive(),
      echoCancellation: this.echoCancellation,
      wakeWordListening: this.wakeWordListening,
      wakeWordDetected: this.wakeWordDetected,
      emotion: this.emotion,
      thinkingSnapshot: this.thinkingSnapshot,
    };
  }

  getState(): VoiceState {
    return this.state;
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private async transition(next: VoiceState): Promise<boolean> {
    if (this.state === next) return true;

    // Enforce mutual exclusion rules
    if (next === VoiceState.LISTENING && this.state === VoiceState.SPEAKING) return false;
    if (next === VoiceState.SPEAKING && speechRecognitionManager.isActive()) {
      this.haltRecognition();
    }
    if (next === VoiceState.LISTENING) {
      stopSpeaking();
      setGlobalSpeaking(false);
    }

    this.state = next;
    this.syncAvatar();
    this.emit();
    return true;
  }

  private syncAvatar() {
    if (!this.avatarBridge) return;
    const viseme = lipSyncEngine.getViseme();
    const signals = {
      state: this.state as import('@/lib/avatar/engine/types').VoicePipelineState,
      isListening: this.state === VoiceState.LISTENING,
      isThinking: this.state === VoiceState.THINKING || this.state === VoiceState.PROCESSING,
      isSpeaking: this.state === VoiceState.SPEAKING,
      speechEnergy:
        this.state === VoiceState.SPEAKING
          ? 0.8
          : this.state === VoiceState.LISTENING
            ? 0.45 + voiceActivityDetector.getLevel() * 0.4
            : 0.2,
      userTalking:
        this.state === VoiceState.LISTENING && voiceActivityDetector.isUserSpeaking(),
      viseme,
      emotion: this.emotion,
    };

    this.avatarBridge.setVoiceSignals(signals);

    if (this.state === VoiceState.THINKING || this.state === VoiceState.PROCESSING) {
      this.avatarBridge.setThinking(true);
    } else if (this.state === VoiceState.SPEAKING) {
      this.avatarBridge.setSpeaking(true);
    } else {
      this.avatarBridge.setThinking(false);
      this.avatarBridge.setSpeaking(false);
    }
  }

  private clearTimers() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.silenceTimer) {
      window.clearInterval(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.waitTimer) {
      window.clearTimeout(this.waitTimer);
      this.waitTimer = null;
    }
  }

  private haltRecognition() {
    this.clearTimers();
    speechRecognitionManager.abort();
    voiceActivityDetector.stop();
    this.wakeWordListening = false;
  }

  private muteMic() {
    this.micEnabled = false;
    voiceState.micEnabled = false;
    setMicTrackMuted(true);
    this.haltRecognition();
  }

  private async unmuteMic() {
    this.micEnabled = true;
    voiceState.micEnabled = true;
    setMicTrackMuted(false);
    this.echoCancellation = micEchoCancellationActive();
  }

  /** Start hotword listen while IDLE */
  async startHotwordListen(): Promise<void> {
    if (this.state !== VoiceState.IDLE) return;
    if (voiceState.isSpeaking) return;

    const perm = await requestMicrophonePermission();
    if (perm !== 'granted') return;

    try {
      const stream = await acquireMicStream();
      voiceActivityDetector.start(stream);
    } catch {
      return;
    }

    this.wakeWordListening = true;
    speechRecognitionManager.start('hotword');
    this.emit();
  }

  /** User pressed mic — bypass hotword */
  async startListening(bypassHotword = true): Promise<void> {
    if (voiceState.isSpeaking) return;
    if (!this.micEnabled && this.state === VoiceState.WAITING) return;

    if (
      this.state === VoiceState.THINKING ||
      this.state === VoiceState.PROCESSING ||
      this.state === VoiceState.SPEAKING
    ) {
      this.cancel();
    }

    if (this.state === VoiceState.LISTENING) return;

    this.bypassHotword = bypassHotword;
    this.error = null;
    this.accumulated = '';
    this.interimText = '';
    this.intentionalFinalize = false;

    const perm = await requestMicrophonePermission();
    if (perm !== 'granted') {
      this.error = 'Microfoontoegang is nodig om te luisteren.';
      this.emit();
      return;
    }

    if (voiceState.isSpeaking) return;

    try {
      const stream = await acquireMicStream();
      this.echoCancellation = micEchoCancellationActive();
      await this.unmuteMic();
      voiceActivityDetector.start(stream);
    } catch {
      this.error = 'Kon microfoonstream niet openen.';
      this.emit();
      return;
    }

    await this.transition(VoiceState.LISTENING);
    this.haltRecognition();
    speechRecognitionManager.start('command');
    this.lastSpeechAt = Date.now();
    voiceLog.emit('Microfoon gestart');

    this.silenceTimer = window.setInterval(() => {
      if (this.state !== VoiceState.LISTENING) return;
      if (voiceState.isSpeaking) return;
      const silent = Date.now() - this.lastSpeechAt > VOICE_V2.SILENCE_MS;
      if (silent && this.accumulated.trim()) {
        this.scheduleFinalize();
      } else if (silent && !this.accumulated.trim() && Date.now() - this.lastSpeechAt > VOICE_V2.SILENCE_MS + 1500) {
        this.scheduleFinalize();
      }
    }, 100);

    this.emit();
  }

  stopListening(): void {
    if (this.state === VoiceState.LISTENING) {
      this.scheduleFinalize();
    }
  }

  toggleListening(): Promise<void> {
    if (this.state === VoiceState.LISTENING) {
      this.stopListening();
      return Promise.resolve();
    }
    return this.startListening(true);
  }

  cancel(): void {
    this.sessionGen++;
    this.abortController?.abort();
    this.abortController = null;
    thinkingEngine.cancel();
    stopSpeaking();
    setGlobalSpeaking(false);
    lipSyncEngine.reset();
    this.haltRecognition();
    this.aiInFlight = false;
    this.state = VoiceState.IDLE;
    this.avatarBridge?.setThinking(false);
    this.avatarBridge?.setSpeaking(false);
    this.syncAvatar();
    this.scheduleWaitToIdle(true);
    voiceLog.emit('Interruptie');
    this.emit();
  }

  private handleSttResult(interim: string, finalPart: string) {
    if (voiceState.isSpeaking) return;
    if (this.state !== VoiceState.LISTENING && speechRecognitionManager.getMode() !== 'hotword') return;

    const mode = speechRecognitionManager.getMode();

    if (mode === 'hotword') {
      const probe = (finalPart || interim).trim();
      if (containsWakeWord(probe)) {
        this.wakeWordDetected = true;
        this.wakeWordListening = false;
        speechRecognitionManager.stop();
        const remainder = stripWakeWord(probe);
        this.bypassHotword = true;
        void this.startListening(true);
        if (remainder) {
          this.accumulated = remainder;
          this.interimText = remainder;
          this.lastSpeechAt = Date.now();
        }
      }
      return;
    }

    if (this.state === VoiceState.PROCESSING || this.state === VoiceState.THINKING) return;
    if (!voiceActivityDetector.isUserSpeaking()) return;

    if (interim || finalPart) {
      this.lastSpeechAt = Date.now();
      voiceLog.emit('Spraak ontvangen', interim || finalPart);
    }

    if (finalPart) this.accumulated += finalPart;
    this.interimText = this.accumulated + interim;

    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.interimText = this.accumulated + interim;
      this.emit();
    }, VOICE_V2.DEBOUNCE_MS);

    this.emit();
  }

  private handleSttEnd(intentional: boolean) {
    if (intentional) return;
    if (voiceState.isSpeaking) return;
    if (this.state === VoiceState.LISTENING && !this.intentionalFinalize) {
      this.scheduleFinalize();
    }
    if (this.state === VoiceState.IDLE && this.wakeWordListening) {
      void this.startHotwordListen();
    }
  }

  private scheduleFinalize() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      void this.finalizeListening();
    }, VOICE_V2.DEBOUNCE_MS);
  }

  private async finalizeListening() {
    if (this.state !== VoiceState.LISTENING) return;
    if (voiceState.isSpeaking) return;

    this.intentionalFinalize = true;
    this.haltRecognition();

    const raw = (this.accumulated + this.interimText).trim() || this.accumulated.trim();
    this.interimText = '';
    voiceLog.emit('STT gestopt');

    if (!raw) {
      this.intentionalFinalize = false;
      await this.transition(VoiceState.IDLE);
      if (!this.bypassHotword) void this.startHotwordListen();
      return;
    }

    await this.processTranscript(raw);
    this.intentionalFinalize = false;
  }

  private async processTranscript(raw: string) {
    await this.transition(VoiceState.PROCESSING);
    this.muteMic();

    const normalized = normalizeTranscript(raw);
    if (isDuplicateTranscript(normalized, this.lastProcessedTranscript, VOICE_V2.DUPLICATE_THRESHOLD)) {
      voiceLog.emit('Fout', 'Duplicaat transcript genegeerd');
      await this.transition(VoiceState.IDLE);
      this.scheduleWaitToIdle();
      return;
    }

    this.lastProcessedTranscript = normalized;
    this.finalText = raw;
    this.accumulated = '';
    voiceLog.emit('Transcript voltooid', raw);
    voiceLog.emit('Vraag ontvangen', raw.slice(0, 60));

    const analysis = classifyQuestion(raw);
    this.emotion = emotionForCategory(analysis.category);

    await this.runThinkingAndSpeak(raw);
  }

  private async runThinkingAndSpeak(text: string) {
    if (this.aiInFlight) return;
    this.aiInFlight = true;

    const gen = ++this.sessionGen;
    const abort = new AbortController();
    this.abortController = abort;

    await this.transition(VoiceState.THINKING);
    thinkingEngine.begin(text);
    this.thinkingSnapshot = thinkingEngine.getSnapshot();
    voiceLog.emit('Thinking gestart');

    const thinkStarted = performance.now();
    const memoryContext = conversationMemory.buildContextPrompt();
    const memoryHint = conversationMemory.findRelevantMemory(text);
    const prompt = memoryHint ? `${memoryHint}\n${text}` : text;

    const aiPromise = sendAiMessage(prompt, {
      signal: abort.signal,
      memoryContext,
    });

    try {
      await waitThinkingMinimum(thinkStarted, thinkingEngine.getMinThinkMs(), abort.signal);
      if (gen !== this.sessionGen || abort.signal.aborted) return;

      const { reply, connected, latencyMs } = await aiPromise;
      if (gen !== this.sessionGen || abort.signal.aborted) return;

      thinkingEngine.setAiComplete(latencyMs);
      this.aiConnected = connected;
      this.aiLatencyMs = latencyMs;
      this.thinkingSnapshot = thinkingEngine.getSnapshot();
      voiceLog.emit('Thinking voltooid', `${latencyMs}ms`);

      const memoryReply = conversationMemory.findRelevantMemory(text);
      let fullReply = reply;
      if (memoryReply && !reply.toLowerCase().includes(memoryReply.slice(0, 20).toLowerCase())) {
        fullReply = `${memoryReply} ${reply}`;
      }

      const preface = thinkingEngine.getPreface();
      if (preface) fullReply = `${preface} ${fullReply}`;

      await thinkingEngine.prepareSpeech();
      if (gen !== this.sessionGen || abort.signal.aborted) return;

      this.muteMic();
      await this.transition(VoiceState.SPEAKING);
      lipSyncEngine.setText(fullReply);

      const tts = thinkingEngine.getTtsModifiers();

      await speakText(fullReply, {
        rate: tts.rate,
        pitch: tts.pitch,
        onStart: () => {
          this.muteMic();
          setGlobalSpeaking(true);
          thinkingEngine.complete();
          this.thinkingSnapshot = thinkingEngine.getSnapshot();
          this.avatarBridge?.setThinking(false);
          this.avatarBridge?.setSpeaking(true);
          this.syncAvatar();
        },
        onEnd: async () => {
          setGlobalSpeaking(false);
          lipSyncEngine.reset();
          conversationMemory.add(text, reply);
          this.aiInFlight = false;
          this.abortController = null;
          this.avatarBridge?.setSpeaking(false);
          await this.transition(VoiceState.WAITING);
          this.scheduleWaitToIdle();
        },
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError' || gen !== this.sessionGen) return;
      this.error = 'AI of spraakuitvoer mislukt';
      voiceLog.emit('Fout', String(err));
      thinkingEngine.cancel();
      this.aiInFlight = false;
      this.abortController = null;
      await this.transition(VoiceState.IDLE);
      this.scheduleWaitToIdle();
    }
  }

  private scheduleWaitToIdle(immediate = false) {
    if (this.waitTimer) window.clearTimeout(this.waitTimer);
    const delay = immediate ? 0 : VOICE_V2.POST_TTS_WAIT_MS;
    this.waitTimer = window.setTimeout(async () => {
      this.waitTimer = null;
      if (voiceState.isSpeaking) return;
      await this.unmuteMic();
      await this.transition(VoiceState.IDLE);
      if (!this.bypassHotword) void this.startHotwordListen();
    }, delay);
  }

  destroy() {
    this.clearTimers();
    this.haltRecognition();
    speechRecognitionManager.destroy();
    releaseMicStream();
    this.listeners.clear();
  }
}

export const voiceEngineV2 = new VoiceEngineV2();
