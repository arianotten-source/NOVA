import type { MoodBlend } from './types';

export function emptyMood(): MoodBlend {
  return {
    happy: 0.2,
    curious: 0.15,
    sleepy: 0.05,
    sad: 0,
    concerned: 0,
    excited: 0.05,
    love: 0.05,
    neutral: 0.5,
    surprised: 0,
  };
}

export function lerpMood(current: MoodBlend, target: MoodBlend, t: number): MoodBlend {
  const out = { ...current };
  const keys = Object.keys(current) as (keyof MoodBlend)[];
  for (const k of keys) {
    out[k] = current[k] + (target[k] - current[k]) * t;
  }
  return normalizeBlend(out);
}

export function normalizeBlend(mood: MoodBlend): MoodBlend {
  const sum = Object.values(mood).reduce((a, b) => a + b, 0);
  if (sum <= 0.0001) return emptyMood();
  const out = { ...mood };
  (Object.keys(out) as (keyof MoodBlend)[]).forEach((k) => {
    out[k] /= sum;
  });
  return out;
}

export function addNoise(mood: MoodBlend, amount = 0.03): MoodBlend {
  const out = { ...mood };
  const keys = Object.keys(out) as (keyof MoodBlend)[];
  for (const k of keys) {
    out[k] = Math.max(0, out[k] + (Math.random() - 0.5) * amount);
  }
  return normalizeBlend(out);
}

export function moodToLabel(mood: MoodBlend): string {
  const sorted = (Object.entries(mood) as [keyof MoodBlend, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? 'neutral';
}
