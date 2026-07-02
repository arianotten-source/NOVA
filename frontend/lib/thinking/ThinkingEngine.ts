import type { MoodBlend } from '@/lib/avatar/engine/types';
import { classifyQuestion, type QuestionAnalysis } from './questionClassifier';
import {
  emotionForCategory,
  moodForEmotion,
  ttsModifiersForEmotion,
  type ResponseEmotion,
} from './thinkingEmotions';
import { maybePlayThinkingAmbience, stopThinkingAmbience } from './thinkingAmbience';

export type ThinkingStyleId = 'A' | 'B' | 'C' | 'D' | 'E';
export type ThinkingPhase = 'idle' | 'thinking' | 'generating' | 'preparing_speech';

export interface ThinkingPoseChannels {
  eyeOffsetX: number;
  eyeOffsetY: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  browRaise: number;
  smileAmount: number;
  glowPulse: number;
  furrow: number;
}

export interface ThinkingSnapshot {
  active: boolean;
  phase: ThinkingPhase;
  style: ThinkingStyleId;
  questionType: string;
  emotion: ResponseEmotion;
  aiLatencyMs: number | null;
  minThinkMs: number;
  elapsedMs: number;
  preface: string | null;
}

const PREFACES = [
  'Hmm...',
  'Interessante vraag.',
  'Eens kijken.',
  'Momentje.',
  'Daar denk ik even over na.',
];

const STYLE_IDS: ThinkingStyleId[] = ['A', 'B', 'C', 'D', 'E'];
const usedPrefaces = new Set<string>();

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function pickStyle(exclude?: ThinkingStyleId): ThinkingStyleId {
  const pool = exclude ? STYLE_IDS.filter((s) => s !== exclude) : STYLE_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickPreface(): string | null {
  if (Math.random() > 0.2) return null;
  const available = PREFACES.filter((p) => !usedPrefaces.has(p));
  const pool = available.length ? available : PREFACES;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  usedPrefaces.add(pick);
  if (usedPrefaces.size >= PREFACES.length) usedPrefaces.clear();
  return pick;
}

function computeMinThinkMs(analysis: QuestionAnalysis): number {
  const base = 300 + analysis.complexity * 900 + Math.min(analysis.wordCount, 14) * 35;
  return Math.round(Math.max(300, Math.min(1800, base)));
}

function styleChannels(style: ThinkingStyleId, t: number, complex: boolean): ThinkingPoseChannels {
  const e = ease(Math.sin(t * Math.PI * 0.5));
  const drift = Math.sin(t * Math.PI * 2) * 0.15;

  switch (style) {
    case 'A':
      return {
        eyeOffsetX: drift,
        eyeOffsetY: -5 * e,
        pupilOffsetX: drift * 2,
        pupilOffsetY: -1.5 * e,
        browRaise: 0.08 * e,
        smileAmount: 0.12 * e,
        glowPulse: 0.28 + 0.12 * e,
        furrow: 0,
      };
    case 'B':
      return {
        eyeOffsetX: -4 * e,
        eyeOffsetY: -1 * e,
        pupilOffsetX: -3 * e + drift,
        pupilOffsetY: drift,
        browRaise: 0.05,
        smileAmount: 0.04,
        glowPulse: 0.25,
        furrow: complex ? 0.12 * e : 0,
      };
    case 'C':
      return {
        eyeOffsetX: 4 * e,
        eyeOffsetY: -2 * e,
        pupilOffsetX: 3 * e,
        pupilOffsetY: -0.5 * e,
        browRaise: 0.22 * e,
        smileAmount: 0.05,
        glowPulse: 0.3,
        furrow: 0,
      };
    case 'D': {
      return {
        eyeOffsetX: t > 0.5 ? -drift : 0,
        eyeOffsetY: t > 0.5 ? 1 * e : -2 * e,
        pupilOffsetX: t > 0.55 ? -2 * e : 0,
        pupilOffsetY: 0,
        browRaise: 0.1,
        smileAmount: 0.08 * (t > 0.55 ? e : 0),
        glowPulse: 0.26,
        furrow: 0,
      };
    }
    case 'E':
    default:
      return {
        eyeOffsetX: Math.sin(t * Math.PI) * 2,
        eyeOffsetY: -3 * e + Math.sin(t * Math.PI * 0.8) * 1.5,
        pupilOffsetX: Math.sin(t * Math.PI * 1.2) * 2.5,
        pupilOffsetY: Math.cos(t * Math.PI) * 1.2,
        browRaise: 0.06,
        smileAmount: 0.06,
        glowPulse: 0.22 + Math.sin(t * Math.PI) * 0.08,
        furrow: complex ? 0.15 * e : 0,
      };
  }
}

export class ThinkingEngine {
  private active = false;
  private phase: ThinkingPhase = 'idle';
  private startedAt = 0;
  private styleStartedAt = 0;
  private style: ThinkingStyleId = 'A';
  private analysis: QuestionAnalysis | null = null;
  private emotion: ResponseEmotion = 'rustig';
  private targetMood: MoodBlend | null = null;
  private minThinkMs = 600;
  private aiLatencyMs: number | null = null;
  private preface: string | null = null;
  private styleDurationMs = 2200;

  begin(text: string, ambienceEnabled = true): void {
    this.analysis = classifyQuestion(text);
    this.emotion = emotionForCategory(this.analysis.category);
    this.targetMood = moodForEmotion(this.emotion);
    this.minThinkMs = computeMinThinkMs(this.analysis);
    this.preface = pickPreface();
    this.active = true;
    this.phase = 'thinking';
    this.startedAt = performance.now();
    this.rotateStyle();
    this.aiLatencyMs = null;
    maybePlayThinkingAmbience(ambienceEnabled);
  }

  cancel(): void {
    this.active = false;
    this.phase = 'idle';
    this.analysis = null;
    this.preface = null;
    stopThinkingAmbience();
  }

  setGenerating(): void {
    if (!this.active) return;
    this.phase = 'generating';
  }

  setAiComplete(latencyMs: number): void {
    this.aiLatencyMs = latencyMs;
  }

  async prepareSpeech(): Promise<void> {
    if (!this.active) return;
    this.phase = 'preparing_speech';
    stopThinkingAmbience();
    await new Promise((r) => setTimeout(r, 380));
  }

  complete(): void {
    this.active = false;
    this.phase = 'idle';
    this.analysis = null;
    this.preface = null;
    stopThinkingAmbience();
  }

  rotateStyle(): void {
    this.style = pickStyle(this.style);
    this.styleStartedAt = performance.now();
    this.styleDurationMs = 1800 + Math.random() * 1400;
  }

  tick(now: number): ThinkingPoseChannels | null {
    if (!this.active) return null;

    const styleElapsed = now - this.styleStartedAt;
    const t = Math.min(1, styleElapsed / this.styleDurationMs);
    if (t >= 1) this.rotateStyle();

    const channels = styleChannels(this.style, Math.min(1, styleElapsed / this.styleDurationMs), Boolean(this.analysis?.isComplex));

    if (this.phase === 'preparing_speech') {
      return {
        ...channels,
        eyeOffsetX: channels.eyeOffsetX * 0.2,
        eyeOffsetY: channels.eyeOffsetY * 0.15,
        smileAmount: 0.18,
        glowPulse: 0.32,
      };
    }

    return channels;
  }

  getTargetMood(): MoodBlend | null {
    return this.targetMood;
  }

  getTtsModifiers() {
    return ttsModifiersForEmotion(this.emotion);
  }

  getPreface(): string | null {
    return this.preface;
  }

  getMinThinkMs(): number {
    return this.minThinkMs;
  }

  getSnapshot(now = performance.now()): ThinkingSnapshot {
    return {
      active: this.active,
      phase: this.phase,
      style: this.style,
      questionType: this.analysis?.category ?? '—',
      emotion: this.emotion,
      aiLatencyMs: this.aiLatencyMs,
      minThinkMs: this.minThinkMs,
      elapsedMs: this.active ? Math.round(now - this.startedAt) : 0,
      preface: this.preface,
    };
  }

  isActive() {
    return this.active;
  }

  getPhase() {
    return this.phase;
  }
}

export const thinkingEngine = new ThinkingEngine();

export async function waitThinkingMinimum(startedAt: number, minMs: number, signal?: AbortSignal): Promise<void> {
  const elapsed = () => performance.now() - startedAt;
  while (elapsed() < minMs) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    await new Promise((r) => setTimeout(r, 40));
  }
}
