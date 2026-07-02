import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useClientOnly } from '@/hooks/useClientOnly';
import { sendAiMessage } from '@/services/aiService';
import { requestMicrophonePermission, queryMicrophonePermission, type PermissionResult } from '@/lib/voice/permissions';
import {
  acquireMicStream,
  micEchoCancellationActive,
  releaseMicStream,
  setMicTrackMuted,
} from '@/lib/voice/micStream';
import { speakText, stopSpeaking, warmUpTts, isTtsSupported } from '@/lib/voice/textToSpeech';
import { voiceActivityDetector } from '@/lib/voice/voiceActivityDetection';
import { voiceLog } from '@/lib/voice/voiceLogger';
import {
  setMicEnabled as setGlobalMicEnabled,
  setRecognitionActive as setGlobalRecognitionActive,
  setSpeaking as setGlobalSpeaking,
  voiceState,
} from '@/lib/voice/voiceState';
import { thinkingEngine, waitThinkingMinimum } from '@/lib/thinking/ThinkingEngine';
import type { ThinkingSnapshot } from '@/lib/thinking/ThinkingEngine';

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'generating' | 'speaking';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart?: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface VoicePipelineValue {
  phase: VoicePhase;
  interimText: string;
  finalText: string;
  micPermission: PermissionResult;
  micSupported: boolean;
  aiConnected: boolean;
  ttsReady: boolean;
  error: string | null;
  thinkingSnapshot: ThinkingSnapshot;
  micEnabled: boolean;
  recognitionActive: boolean;
  isSpeaking: boolean;
  echoCancellation: boolean;
  currentTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  cancelActive: () => void;
}

const VoicePipelineContext = createContext<VoicePipelineValue | null>(null);

const SILENCE_MS = 2200;
const POST_TTS_COOLDOWN_MS = 500;

export function VoicePipelineProvider({ children }: { children: React.ReactNode }) {
  const client = useClientOnly();
  const { setVoiceSignals, setThinking, setSpeaking } = useAvatar();

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [micPermission, setMicPermission] = useState<PermissionResult>('prompt');
  const [aiConnected, setAiConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingSnapshot, setThinkingSnapshot] = useState<ThinkingSnapshot>(thinkingEngine.getSnapshot());
  const [micEnabled, setMicEnabledState] = useState(true);
  const [recognitionActive, setRecognitionActiveState] = useState(false);
  const [isSpeaking, setIsSpeakingState] = useState(false);
  const [echoCancellation, setEchoCancellation] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const phaseRef = useRef<VoicePhase>('idle');
  const lastSpeechAt = useRef(0);
  const silenceTimer = useRef<number | null>(null);
  const accumulatedRef = useRef('');
  const processingRef = useRef(false);
  const isFinalizingRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const finalizeListeningRef = useRef<() => Promise<void>>(async () => {});
  const abortRef = useRef<AbortController | null>(null);
  const processGenRef = useRef(0);
  const micReEnableTimer = useRef<number | null>(null);

  const micSupported =
    client &&
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const ttsReady = client && isTtsSupported();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!client) return;
    warmUpTts();
    queryMicrophonePermission().then(setMicPermission);
    setGlobalMicEnabled(true);
  }, [client]);

  useEffect(() => {
    if (!client) return;
    const id = window.setInterval(() => {
      setIsSpeakingState(voiceState.isSpeaking);
      setRecognitionActiveState(voiceState.recognitionActive);
      setMicEnabledState(voiceState.micEnabled);
      setEchoCancellation(micEchoCancellationActive());
      if (thinkingEngine.isActive()) {
        setThinkingSnapshot(thinkingEngine.getSnapshot());
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [client]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      window.clearInterval(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const clearMicReEnableTimer = useCallback(() => {
    if (micReEnableTimer.current) {
      window.clearTimeout(micReEnableTimer.current);
      micReEnableTimer.current = null;
    }
  }, []);

  const stopRecognitionHard = useCallback(() => {
    intentionalStopRef.current = true;
    setGlobalRecognitionActive(false);
    setRecognitionActiveState(false);
    voiceActivityDetector.stop();
    clearSilenceTimer();
    try {
      recognitionRef.current?.abort?.();
    } catch {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    }
  }, [clearSilenceTimer]);

  const disableMicForOutput = useCallback(() => {
    setGlobalMicEnabled(false);
    setMicEnabledState(false);
    setMicTrackMuted(true);
    stopRecognitionHard();
  }, [stopRecognitionHard]);

  const scheduleMicReEnable = useCallback(() => {
    clearMicReEnableTimer();
    setGlobalMicEnabled(false);
    setMicEnabledState(false);
    micReEnableTimer.current = window.setTimeout(() => {
      if (!voiceState.isSpeaking) {
        setGlobalMicEnabled(true);
        setMicEnabledState(true);
        setMicTrackMuted(false);
        setEchoCancellation(micEchoCancellationActive());
      }
      micReEnableTimer.current = null;
    }, POST_TTS_COOLDOWN_MS);
  }, [clearMicReEnableTimer]);

  const cancelActive = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    thinkingEngine.cancel();
    stopSpeaking();
    setGlobalSpeaking(false);
    setIsSpeakingState(false);
    stopRecognitionHard();
    processingRef.current = false;
    setThinking(false);
    setSpeaking(false);
    setPhase('idle');
    phaseRef.current = 'idle';
    setVoiceSignals({
      isListening: false,
      isThinking: false,
      isSpeaking: false,
      speechEnergy: 0.2,
      userTalking: false,
    });
    setThinkingSnapshot(thinkingEngine.getSnapshot());
    scheduleMicReEnable();
    voiceLog.emit('Interruptie');
  }, [setVoiceSignals, setThinking, setSpeaking, stopRecognitionHard, scheduleMicReEnable]);

  const processWithAi = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      disableMicForOutput();

      const gen = ++processGenRef.current;
      const abort = new AbortController();
      abortRef.current = abort;

      processingRef.current = true;
      setFinalText(trimmed);
      setInterimText('');
      accumulatedRef.current = '';
      voiceLog.emit('Transcript voltooid', trimmed);
      voiceLog.emit('Vraag ontvangen', trimmed.slice(0, 60));

      thinkingEngine.begin(trimmed);
      setThinkingSnapshot(thinkingEngine.getSnapshot());
      voiceLog.emit('Thinking gestart');

      setPhase('thinking');
      phaseRef.current = 'thinking';
      setVoiceSignals({ isListening: false, isThinking: true, isSpeaking: false, userTalking: false });
      setThinking(true);

      const thinkStarted = performance.now();
      const aiPromise = sendAiMessage(trimmed, { signal: abort.signal });

      try {
        await waitThinkingMinimum(thinkStarted, thinkingEngine.getMinThinkMs(), abort.signal);

        if (gen !== processGenRef.current || abort.signal.aborted) return;

        thinkingEngine.setGenerating();
        setPhase('generating');
        phaseRef.current = 'generating';
        setThinkingSnapshot(thinkingEngine.getSnapshot());

        const { reply, connected, latencyMs } = await aiPromise;
        if (gen !== processGenRef.current || abort.signal.aborted) return;

        thinkingEngine.setAiComplete(latencyMs);
        setAiConnected(connected);
        voiceLog.emit('Thinking voltooid', `${latencyMs}ms`);

        await thinkingEngine.prepareSpeech();
        if (gen !== processGenRef.current || abort.signal.aborted) return;

        disableMicForOutput();

        setPhase('speaking');
        phaseRef.current = 'speaking';
        setVoiceSignals({
          isListening: false,
          isThinking: true,
          isSpeaking: false,
          speechEnergy: 0.3,
          userTalking: false,
        });

        const tts = thinkingEngine.getTtsModifiers();
        const preface = thinkingEngine.getPreface();
        const fullReply = preface ? `${preface} ${reply}` : reply;

        await speakText(fullReply, {
          rate: tts.rate,
          pitch: tts.pitch,
          onStart: () => {
            disableMicForOutput();
            setThinking(false);
            setSpeaking(true);
            setIsSpeakingState(true);
            thinkingEngine.complete();
            setVoiceSignals({ isSpeaking: true, speechEnergy: 0.8, isListening: false, isThinking: false });
          },
          onEnd: () => {
            setGlobalSpeaking(false);
            setIsSpeakingState(false);
            setSpeaking(false);
            setPhase('idle');
            phaseRef.current = 'idle';
            setVoiceSignals({
              isListening: false,
              isThinking: false,
              isSpeaking: false,
              speechEnergy: 0.2,
              userTalking: false,
            });
            processingRef.current = false;
            abortRef.current = null;
            setThinkingSnapshot(thinkingEngine.getSnapshot());
            scheduleMicReEnable();
          },
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError' || gen !== processGenRef.current) return;
        setError('AI of spraakuitvoer mislukt');
        voiceLog.emit('Fout', String(err));
        thinkingEngine.cancel();
        setThinking(false);
        setSpeaking(false);
        setGlobalSpeaking(false);
        setPhase('idle');
        phaseRef.current = 'idle';
        setVoiceSignals({
          isListening: false,
          isThinking: false,
          isSpeaking: false,
          speechEnergy: 0.2,
          userTalking: false,
        });
        processingRef.current = false;
        abortRef.current = null;
        setThinkingSnapshot(thinkingEngine.getSnapshot());
        scheduleMicReEnable();
      }
    },
    [setVoiceSignals, setThinking, setSpeaking, disableMicForOutput, scheduleMicReEnable]
  );

  const finalizeListening = useCallback(async () => {
    if (isFinalizingRef.current || phaseRef.current !== 'listening') return;
    if (voiceState.isSpeaking) return;

    isFinalizingRef.current = true;
    const text = accumulatedRef.current.trim();

    phaseRef.current = 'thinking';
    stopRecognitionHard();
    setInterimText('');
    voiceLog.emit('STT gestopt');

    if (text) {
      await processWithAi(text);
    } else {
      setPhase('idle');
      phaseRef.current = 'idle';
      setVoiceSignals({ isListening: false, userTalking: false, speechEnergy: 0.2, isThinking: false, isSpeaking: false });
      scheduleMicReEnable();
    }
    isFinalizingRef.current = false;
  }, [processWithAi, setVoiceSignals, stopRecognitionHard, scheduleMicReEnable]);

  finalizeListeningRef.current = finalizeListening;

  useEffect(() => {
    if (!micSupported) return;

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'nl-NL';

      recognition.onstart = () => {
        if (voiceState.isSpeaking || !voiceState.micEnabled) {
          intentionalStopRef.current = true;
          try {
            recognition.abort?.();
          } catch {
            recognition.stop();
          }
          return;
        }
        setGlobalRecognitionActive(true);
        setRecognitionActiveState(true);
        voiceLog.emit('STT gestart');
      };

      recognition.onresult = (event) => {
        if (voiceState.isSpeaking) return;
        if (!voiceState.micEnabled) return;
        if (phaseRef.current !== 'listening') return;
        if (!voiceActivityDetector.isUserSpeaking()) return;

        let interim = '';
        let finalPart = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalPart += chunk;
          else interim += chunk;
        }

        if (interim || finalPart) {
          lastSpeechAt.current = Date.now();
          voiceLog.emit('Spraak ontvangen', interim || finalPart);
        }

        if (finalPart) accumulatedRef.current += finalPart;
        setInterimText(accumulatedRef.current + interim);
      };

      recognition.onerror = (e) => {
        const msg = (e as Event & { error?: string }).error ?? 'onbekend';
        if (msg !== 'aborted' && msg !== 'no-speech') {
          setError(`Spraakherkenning: ${msg}`);
          voiceLog.emit('Fout', msg);
        }
      };

      recognition.onend = () => {
        setGlobalRecognitionActive(false);
        setRecognitionActiveState(false);

        if (intentionalStopRef.current) {
          intentionalStopRef.current = false;
          return;
        }

        if (voiceState.isSpeaking || !voiceState.micEnabled) return;
        if (phaseRef.current === 'listening') {
          void finalizeListeningRef.current();
        }
      };

      recognitionRef.current = recognition;
      return () => {
        intentionalStopRef.current = true;
        try {
          recognition.abort?.();
        } catch {
          /* ignore */
        }
        voiceActivityDetector.stop();
        releaseMicStream();
      };
    } catch (err) {
      console.error('[VoicePipeline] init', err);
      return undefined;
    }
  }, [micSupported]);

  const startListening = useCallback(async () => {
    if (!micSupported) return;
    if (voiceState.isSpeaking) return;
    if (!voiceState.micEnabled) return;

    if (phaseRef.current === 'thinking' || phaseRef.current === 'generating' || phaseRef.current === 'speaking') {
      cancelActive();
      return;
    }

    if (phaseRef.current === 'listening') return;

    clearMicReEnableTimer();
    stopSpeaking();
    setGlobalSpeaking(false);
    setError(null);
    accumulatedRef.current = '';
    setInterimText('');
    setFinalText('');

    const perm = await requestMicrophonePermission();
    setMicPermission(perm);
    if (perm !== 'granted') {
      setError('Microfoontoegang is nodig om te luisteren.');
      return;
    }

    if (voiceState.isSpeaking) return;

    try {
      const stream = await acquireMicStream();
      setEchoCancellation(micEchoCancellationActive());
      setMicTrackMuted(false);
      setGlobalMicEnabled(true);
      setMicEnabledState(true);
      voiceActivityDetector.start(stream);
    } catch {
      setError('Kon microfoonstream niet openen.');
      return;
    }

    if (!recognitionRef.current || voiceState.isSpeaking) return;

    try {
      intentionalStopRef.current = false;
      recognitionRef.current.start();
      setPhase('listening');
      phaseRef.current = 'listening';
      lastSpeechAt.current = Date.now();
      voiceLog.emit('Microfoon gestart');
      setVoiceSignals({
        isListening: true,
        isSpeaking: false,
        isThinking: false,
        userTalking: false,
        speechEnergy: 0.4,
      });

      clearSilenceTimer();
      silenceTimer.current = window.setInterval(() => {
        if (phaseRef.current !== 'listening') return;
        if (voiceState.isSpeaking) return;
        const silent = Date.now() - lastSpeechAt.current > SILENCE_MS;
        const hasText = Boolean(accumulatedRef.current.trim());
        if (silent && hasText) {
          void finalizeListening();
        } else if (silent && !hasText && Date.now() - lastSpeechAt.current > SILENCE_MS + 2000) {
          void finalizeListening();
        }
      }, 400);
    } catch (err) {
      setError('Kon microfoon niet starten');
      voiceLog.emit('Fout', String(err));
      setPhase('idle');
      phaseRef.current = 'idle';
    }
  }, [
    micSupported,
    finalizeListening,
    setVoiceSignals,
    clearSilenceTimer,
    cancelActive,
    clearMicReEnableTimer,
  ]);

  const stopListening = useCallback(() => {
    void finalizeListening();
  }, [finalizeListening]);

  const toggleListening = useCallback(async () => {
    if (phaseRef.current === 'listening') stopListening();
    else await startListening();
  }, [startListening, stopListening]);

  const currentTranscript = interimText || finalText;

  const value = useMemo(
    () => ({
      phase,
      interimText,
      finalText,
      micPermission,
      micSupported: Boolean(micSupported),
      aiConnected,
      ttsReady: Boolean(ttsReady),
      error,
      thinkingSnapshot,
      micEnabled,
      recognitionActive,
      isSpeaking,
      echoCancellation,
      currentTranscript,
      startListening,
      stopListening,
      toggleListening,
      cancelActive,
    }),
    [
      phase,
      interimText,
      finalText,
      micPermission,
      micSupported,
      aiConnected,
      ttsReady,
      error,
      thinkingSnapshot,
      micEnabled,
      recognitionActive,
      isSpeaking,
      echoCancellation,
      currentTranscript,
      startListening,
      stopListening,
      toggleListening,
      cancelActive,
    ]
  );

  return <VoicePipelineContext.Provider value={value}>{children}</VoicePipelineContext.Provider>;
}

export function useVoicePipeline() {
  const ctx = useContext(VoicePipelineContext);
  if (!ctx) throw new Error('useVoicePipeline must be used within VoicePipelineProvider');
  return ctx;
}

export function useVoicePipelineOptional() {
  return useContext(VoicePipelineContext);
}
