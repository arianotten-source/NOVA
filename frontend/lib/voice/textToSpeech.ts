import { voiceLog } from './voiceLogger';
import { setSpeaking } from './voiceState';

export interface TtsDebugState {
  supported: boolean;
  voicesLoaded: boolean;
  voiceCount: number;
  selectedVoice: string | null;
  lastText: string | null;
  lastError: string | null;
  speaking: boolean;
  queueLength: number;
  lastStartedAt: number | null;
  lastEndedAt: number | null;
}

export const ttsDebug: TtsDebugState = {
  supported: false,
  voicesLoaded: false,
  voiceCount: 0,
  selectedVoice: null,
  lastText: null,
  lastError: null,
  speaking: false,
  queueLength: 0,
  lastStartedAt: null,
  lastEndedAt: null,
};

let voicesCache: SpeechSynthesisVoice[] = [];
let voicesListenerAttached = false;

type SpeakJob = {
  text: string;
  handlers?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
    rate?: number;
    pitch?: number;
  };
  resolve: () => void;
};

const speakQueue: SpeakJob[] = [];
let draining = false;

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function refreshVoices() {
  if (!isTtsSupported()) return;
  voicesCache = speechSynthesis.getVoices();
  ttsDebug.voiceCount = voicesCache.length;
  ttsDebug.voicesLoaded = voicesCache.length > 0;
}

function attachVoicesListener() {
  if (!isTtsSupported() || voicesListenerAttached) return;
  voicesListenerAttached = true;
  refreshVoices();
  speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function ensureResumed() {
  if (!isTtsSupported()) return;
  try {
    if (speechSynthesis.paused) speechSynthesis.resume();
  } catch {
    /* ignore */
  }
}

function pickVoice(lang = 'nl-NL'): SpeechSynthesisVoice | null {
  const voices = voicesCache.length ? voicesCache : speechSynthesis.getVoices();
  const nl = lang.startsWith('nl') ? lang.slice(0, 2) : 'nl';
  const picked =
    voices.find((v) => v.lang === 'nl-NL') ??
    voices.find((v) => v.lang.startsWith(nl)) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices.find((v) => v.default) ??
    voices[0] ??
    null;
  ttsDebug.selectedVoice = picked?.name ?? null;
  return picked;
}

export function isTtsSupported(): boolean {
  const ok = typeof window !== 'undefined' && 'speechSynthesis' in window;
  ttsDebug.supported = ok;
  return ok;
}

export function warmUpTts(): void {
  if (!isTtsSupported()) return;
  attachVoicesListener();
  refreshVoices();
  ensureResumed();
  // Chrome loads voices lazily — nudge synthesis
  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  speakQueue.length = 0;
  ttsDebug.queueLength = 0;
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  setSpeaking(false);
  ttsDebug.speaking = false;
}

async function drainSpeakQueue() {
  if (draining || speakQueue.length === 0) return;
  draining = true;

  while (speakQueue.length > 0) {
    const job = speakQueue.shift()!;
    ttsDebug.queueLength = speakQueue.length;
    await playUtterance(job);
  }

  draining = false;
}

async function playUtterance(job: SpeakJob): Promise<void> {
  const { text, handlers, resolve } = job;

  if (!isTtsSupported() || !text.trim()) {
    setSpeaking(false);
    ttsDebug.speaking = false;
    handlers?.onEnd?.();
    resolve();
    return;
  }

  attachVoicesListener();
  refreshVoices();
  ensureResumed();

  // Chrome bug: cancel() immediately before speak() drops the utterance
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    try {
      speechSynthesis.cancel();
      await delay(60);
    } catch {
      /* ignore */
    }
  }

  ttsDebug.lastText = text;
  ttsDebug.lastError = null;

  await new Promise<void>((done) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-NL';
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = handlers?.rate ?? 1;
    utterance.pitch = handlers?.pitch ?? 1;

    let ended = false;
    const finish = (error?: string) => {
      if (ended) return;
      ended = true;
      setSpeaking(false);
      ttsDebug.speaking = false;
      ttsDebug.lastEndedAt = Date.now();
      if (error) {
        ttsDebug.lastError = error;
        voiceLog.emit('Fout', `TTS: ${error}`);
        handlers?.onError?.(error);
      } else {
        voiceLog.emit('TTS voltooid');
      }
      handlers?.onEnd?.();
      resolve();
      done();
    };

    utterance.onstart = () => {
      setSpeaking(true);
      ttsDebug.speaking = true;
      ttsDebug.lastStartedAt = Date.now();
      voiceLog.emit('TTS gestart', voice?.name ?? 'default');
      handlers?.onStart?.();
    };

    utterance.onend = () => finish();
    utterance.onerror = (ev) => {
      const msg = (ev as SpeechSynthesisErrorEvent).error ?? 'onerror';
      finish(msg);
    };

    try {
      speechSynthesis.speak(utterance);
      ensureResumed();
      // Chrome sometimes needs a second resume after speak()
      window.setTimeout(() => {
        ensureResumed();
        if (!ended && !speechSynthesis.speaking && !speechSynthesis.pending) {
          finish('not-started');
        }
      }, 800);
    } catch (err) {
      finish(String(err));
      return;
    }

    // Android Chrome sometimes skips onend
    window.setTimeout(() => finish(), Math.min(60000, text.length * 120 + 3000));
  });
}

export function speakText(
  text: string,
  handlers?: SpeakJob['handlers']
): Promise<void> {
  return new Promise((resolve) => {
    speakQueue.push({ text, handlers, resolve });
    ttsDebug.queueLength = speakQueue.length;
    void drainSpeakQueue();
  });
}
