import type { MoodBlend, StateDefinition } from './types';

export const STATE_DEFINITIONS: StateDefinition[] = [
  {
    id: 'speaking',
    priority: 100,
    defaultDurationMs: 60000,
    targetMood: { happy: 0.4, excited: 0.2, neutral: 0.4 },
    animation: 'speaking',
    transitionMs: 350,
  },
  {
    id: 'listening',
    priority: 90,
    defaultDurationMs: 60000,
    targetMood: { curious: 0.5, neutral: 0.35, happy: 0.15 },
    animation: 'listening',
    transitionMs: 300,
  },
  {
    id: 'thinking',
    priority: 85,
    defaultDurationMs: 30000,
    targetMood: { curious: 0.55, neutral: 0.35, concerned: 0.1 },
    animation: 'thinking',
    transitionMs: 400,
  },
  {
    id: 'surprised',
    priority: 75,
    defaultDurationMs: 2500,
    targetMood: { surprised: 0.85, excited: 0.15 },
    animation: 'surprised',
    transitionMs: 200,
  },
  {
    id: 'excited',
    priority: 70,
    defaultDurationMs: 3500,
    targetMood: { excited: 0.75, happy: 0.25 },
    animation: 'happy_bounce',
    transitionMs: 300,
  },
  {
    id: 'happy',
    priority: 65,
    defaultDurationMs: 4000,
    targetMood: { happy: 0.8, love: 0.1, neutral: 0.1 },
    animation: 'smile',
    transitionMs: 350,
  },
  {
    id: 'love',
    priority: 60,
    defaultDurationMs: 4000,
    targetMood: { love: 0.85, happy: 0.15 },
    animation: 'smile',
    transitionMs: 400,
  },
  {
    id: 'concerned',
    priority: 55,
    defaultDurationMs: 5000,
    targetMood: { concerned: 0.7, sad: 0.15, neutral: 0.15 },
    animation: 'concerned',
    transitionMs: 400,
  },
  {
    id: 'sad',
    priority: 50,
    defaultDurationMs: 5000,
    targetMood: { sad: 0.75, concerned: 0.15, neutral: 0.1 },
    animation: 'sad',
    transitionMs: 500,
  },
  {
    id: 'sleeping',
    priority: 40,
    defaultDurationMs: 20000,
    targetMood: { sleepy: 0.9, neutral: 0.1 },
    animation: 'sleep',
    transitionMs: 800,
  },
  {
    id: 'curious',
    priority: 35,
    defaultDurationMs: 3000,
    targetMood: { curious: 0.75, happy: 0.15, neutral: 0.1 },
    animation: 'eye_look',
    transitionMs: 350,
  },
  {
    id: 'idle',
    priority: 10,
    defaultDurationMs: Infinity,
    targetMood: { happy: 0.35, neutral: 0.45, curious: 0.2 },
    animation: 'idle',
    transitionMs: 600,
  },
];

export function normalizeMood(partial: Partial<MoodBlend>): MoodBlend {
  const base: MoodBlend = {
    happy: 0,
    curious: 0,
    sleepy: 0,
    sad: 0,
    concerned: 0,
    excited: 0,
    love: 0,
    neutral: 0,
    surprised: 0,
  };
  Object.assign(base, partial);
  const sum = Object.values(base).reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...base, neutral: 1 };
  const out = { ...base };
  (Object.keys(out) as (keyof MoodBlend)[]).forEach((k) => {
    out[k] /= sum;
  });
  return out;
}

export function getStateDef(id: string): StateDefinition {
  return STATE_DEFINITIONS.find((s) => s.id === id) ?? STATE_DEFINITIONS.find((s) => s.id === 'idle')!;
}
