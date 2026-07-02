import { ttsDebug } from '@/lib/voice/textToSpeech';

export interface EngineTelemetry {
  avatar: { fps: number | null; state: string | null; expression: string | null };
  presence: { energy: number | null; whisper: string | null };
  emotion: string | null;
  thinking: { active: boolean; style: string | null };
  speech: { state: string | null; recognition: boolean; mic: boolean };
  tts: typeof ttsDebug;
  camera: {
    permission: string;
    faceDetected: boolean;
    personKnown: boolean;
    personName: string | null;
  };
  mediaPipe: { ready: boolean | null };
  lipSync: { viseme: string | null };
  router: { path: string };
  memoryMb: number | null;
  updatedAt: number;
}

export const engineTelemetry: EngineTelemetry = {
  avatar: { fps: null, state: null, expression: null },
  presence: { energy: null, whisper: null },
  emotion: null,
  thinking: { active: false, style: null },
  speech: { state: null, recognition: false, mic: false },
  tts: ttsDebug,
  camera: { permission: 'prompt', faceDetected: false, personKnown: false, personName: null },
  mediaPipe: { ready: null },
  lipSync: { viseme: null },
  router: { path: '/' },
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
