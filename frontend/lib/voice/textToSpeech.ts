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
  audioUnlocked: boolean;
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
  audioUnlocked: false,
};

let voicesCache: SpeechSynthesisVoice[] = [];
let voicesListenerAttached = false;
let audioUnlocked = false;

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
  speechSynthesis.addEventListener('voiceschanged', () => {
    refreshVoices();
  });
}

function ensureResumed() {
  if (!isTtsSupported()) return;
  try {
    if (speechSynthesis.paused) speechSynthesis.resume();
  } catch {
    /* ignore */
  }
}

function waitForVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    attachVoicesListener();
    refreshVoices();
    if (voicesCache.length) {
      voiceLog.emit('TTS gestart', `Voice gevonden: ${voicesCache.length} stemmen`);
      resolve(voicesCache);
      return;
    }
    const deadline = window.setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', onChange);
      refreshVoices();
      resolve(voicesCache);
    }, timeoutMs);
    const onChange = () => {
      refreshVoices();
      if (voicesCache.length) {
        window.clearTimeout(deadline);
        speechSynthesis.removeEventListener('voiceschanged', onChange);
        resolve(voicesCache);
      }
    };
    speechSynthesis.addEventListener('voiceschanged', onChange);
  });
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

/** Call on first user gesture — required on Chrome/Android for reliable TTS */
export function unlockTtsAudio(): void {
  if (!isTtsSupported() || audioUnlocked) return;
  try {
    ensureResumed();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0.01;
    u.rate = 1;
    speechSynthesis.speak(u);
    audioUnlocked = true;
    ttsDebug.audioUnlocked = true;
    voiceLog.emit('TTS gestart', 'Audio ontgrendeld');
  } catch {
    /* ignore */
  }
}

export function warmUpTts(): void {
  if (!isTtsSupported()) return;
  attachVoicesListener();
  void waitForVoices(1500);
  ensureResumed();
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

  ensureResumed();
  await waitForVoices(2000);

  if (speechSynthesis.speaking || speechSynthesis.pending) {
    try {
      speechSynthesis.cancel();
      await delay(80);
    } catch {
      /* ignore */
    }
  }

  ttsDebug.lastText = text;
  ttsDebug.lastError = null;

  await new Promise<void>((done) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-NL';
    utterance.volume = 1;
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      voiceLog.emit('TTS gestart', `Voice geselecteerd: ${voice.name} (${voice.lang})`);
    }
    utterance.rate = handlers?.rate ?? 1;
    utterance.pitch = handlers?.pitch ?? 1;

    let ended = false;
    let started = false;

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
        voiceLog.emit('TTS voltooid', 'Speech geëindigd');
      }
      handlers?.onEnd?.();
      resolve();
      done();
    };

    utterance.onstart = () => {
      started = true;
      setSpeaking(true);
      ttsDebug.speaking = true;
      ttsDebug.lastStartedAt = Date.now();
      const voiceLabel = voice ? `${voice.name} (${voice.lang})` : 'default';
      voiceLog.emit('TTS gestart', `Speech gestart · ${voiceLabel}`);
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
    } catch (err) {
      finish(String(err));
      return;
    }

    // Only abort if onstart never fired after generous delay
    window.setTimeout(() => {
      if (!started && !ended) {
        ensureResumed();
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
          finish('not-started');
        }
      }
    }, 3000);

    // Safety net for Android skipping onend
    window.setTimeout(() => {
      if (!ended) finish();
    }, Math.min(90000, text.length * 140 + 4000));
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
