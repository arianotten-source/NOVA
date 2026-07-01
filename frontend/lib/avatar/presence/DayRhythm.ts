import type { DayPhase } from './types';
import type { MoodBlend } from '../engine/types';

export function getDayPhase(hour: number): DayPhase {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function dayPhaseMoodModifiers(phase: DayPhase): Partial<MoodBlend> {
  switch (phase) {
    case 'morning':
      return { happy: 0.35, curious: 0.3, excited: 0.2, neutral: 0.15 };
    case 'afternoon':
      return { neutral: 0.4, curious: 0.25, happy: 0.2, excited: 0.15 };
    case 'evening':
      return { neutral: 0.35, happy: 0.25, love: 0.15, sleepy: 0.15, curious: 0.1 };
    case 'night':
      return { sleepy: 0.45, neutral: 0.35, curious: 0.1, happy: 0.1 };
  }
}

export function dayPhaseEnergy(phase: DayPhase): number {
  switch (phase) {
    case 'morning':
      return 0.85;
    case 'afternoon':
      return 0.7;
    case 'evening':
      return 0.5;
    case 'night':
      return 0.28;
  }
}

export function dayPhaseMotionMul(phase: DayPhase): number {
  switch (phase) {
    case 'morning':
      return 1.1;
    case 'afternoon':
      return 1;
    case 'evening':
      return 0.82;
    case 'night':
      return 0.55;
  }
}

export function dayPhaseBlinkMul(phase: DayPhase): number {
  switch (phase) {
    case 'morning':
      return 0.9;
    case 'afternoon':
      return 1;
    case 'evening':
      return 1.15;
    case 'night':
      return 1.6;
  }
}

const MORNING_GREETINGS = [
  'Goedemorgen.',
  'Heb je lekker geslapen?',
  'Ik ben klaar voor vandaag.',
];

const NIGHT_GREETINGS = ['Je bent nog laat wakker.', 'Rustige nacht.', 'Ik ben hier als je me nodig hebt.'];

export function dayPhaseGreeting(phase: DayPhase, preferred: string | null): string | null {
  if (preferred) return preferred;
  if (phase === 'morning') return MORNING_GREETINGS[Math.floor(Math.random() * MORNING_GREETINGS.length)];
  if (phase === 'night') return NIGHT_GREETINGS[Math.floor(Math.random() * NIGHT_GREETINGS.length)];
  return null;
}
