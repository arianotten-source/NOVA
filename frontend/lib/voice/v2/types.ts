import type { ThinkingSnapshot } from '@/lib/thinking/ThinkingEngine';

export enum VoiceState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  WAITING = 'WAITING',
}

export type VisemeId = 'A' | 'E' | 'O' | 'M' | 'F' | 'L' | 'smile' | 'neutral';

export interface VoiceSnapshot {
  state: VoiceState;
  interimText: string;
  finalText: string;
  currentTranscript: string;
  error: string | null;
  aiConnected: boolean;
  aiLatencyMs: number | null;
  aiQueueSize: number;
  micEnabled: boolean;
  recognitionActive: boolean;
  echoCancellation: boolean;
  wakeWordListening: boolean;
  wakeWordDetected: boolean;
  emotion: string;
  thinkingSnapshot: ThinkingSnapshot;
  displayText: string | null;
}

export const VOICE_V2 = {
  DEBOUNCE_MS: 400,
  SILENCE_MS: 800,
  POST_TTS_WAIT_MS: 700,
  DUPLICATE_THRESHOLD: 0.95,
} as const;
