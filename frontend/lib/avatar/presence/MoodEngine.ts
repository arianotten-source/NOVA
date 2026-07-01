import type { MoodBlend } from '../engine/types';
import type { MoodVector } from './types';
import { normalizeBlend } from '../engine/MoodBlend';

export function moodBlendToVector(mood: MoodBlend): MoodVector {
  return {
    happy: mood.happy + mood.love * 0.4 + mood.excited * 0.2,
    calm: mood.neutral * 0.6 + mood.sleepy * 0.25 + mood.love * 0.15,
    curious: mood.curious + mood.surprised * 0.2,
    thinking: mood.curious * 0.35 + mood.neutral * 0.4 + mood.concerned * 0.15,
    sleepy: mood.sleepy,
    concerned: mood.concerned + mood.sad * 0.3,
    excited: mood.excited + mood.surprised * 0.25,
  };
}

export function vectorToMoodBlend(v: MoodVector): MoodBlend {
  const raw: MoodBlend = {
    happy: v.happy,
    curious: v.curious,
    sleepy: v.sleepy,
    sad: v.concerned * 0.2,
    concerned: v.concerned,
    excited: v.excited,
    love: v.happy * 0.15,
    neutral: v.calm,
    surprised: v.excited * 0.15,
  };
  return normalizeBlend(raw);
}

export function lerpMoodVector(a: MoodVector, b: MoodVector, t: number): MoodVector {
  const keys = Object.keys(a) as (keyof MoodVector)[];
  const out = { ...a };
  for (const k of keys) {
    out[k] = a[k] + (b[k] - a[k]) * t;
  }
  return out;
}

export function moodVectorLabel(v: MoodVector): string {
  const entries = Object.entries(v) as [keyof MoodVector, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  if (!top) return 'calm';
  const pct = Math.round(top[1] * 100);
  return `${capitalize(top[0])} ${pct}%`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
