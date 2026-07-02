import { ttsDebug } from '@/lib/voice/textToSpeech';
import type { RuntimeErrorEntry } from '@/lib/runtime/runtimeErrors';

export interface EngineTelemetry {
  avatar: { fps: number | null; state: string | null; expression: string | null; loaded: boolean };
  emotion: { loaded: boolean };
  presence: {
    mode: string | null;
    userStatus: string | null;
    energy: number | null;
    curiosity: number | null;
    attention: number | null;
    whisper: string | null;
    moodLabel: string | null;
  };
  thinking: { active: boolean; style: string | null };
  speech: { state: string | null; recognition: boolean; mic: boolean };
  tts: typeof ttsDebug;
  ai: { queue: number; offline: boolean };
  camera: {
    permission: string;
    faceDetected: boolean;
    personKnown: boolean;
    personName: string | null;
    faceScale: number | null;
    trackingFps: number | null;
  };
  mediaPipe: { ready: boolean | null };
  lipSync: { viseme: string | null };
  router: { path: string; screen: string };
  errors: RuntimeErrorEntry[];
  memoryMb: number | null;
  updatedAt: number;
}

export const engineTelemetry: EngineTelemetry = {
  avatar: { fps: null, state: null, expression: null, loaded: false },
  emotion: { loaded: false },
  presence: { mode: null, userStatus: null, energy: null, curiosity: null, attention: null, whisper: null, moodLabel: null },
  thinking: { active: false, style: null },
  speech: { state: null, recognition: false, mic: false },
  tts: ttsDebug,
  ai: { queue: 0, offline: false },
  camera: { permission: 'prompt', faceDetected: false, personKnown: false, personName: null, faceScale: null, trackingFps: null },
  mediaPipe: { ready: null },
  lipSync: { viseme: null },
  router: { path: '/', screen: 'AvatarHome' },
  errors: [],
  memoryMb: null,
  updatedAt: Date.now(),
};

export function patchTelemetry(partial: Partial<EngineTelemetry>) {
  Object.assign(engineTelemetry, partial, { updatedAt: Date.now() });
  if (partial.tts) Object.assign(engineTelemetry.tts, partial.tts);
}

export function readMemoryMb(): number | null {
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
  if (!perf.memory) return null;
  return Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
}
