import type { PersonalityId } from './types';

export interface PersonalityProfile {
  id: PersonalityId;
  label: string;
  blinkIntervalMul: number;
  idleSpeedMul: number;
  reactionSpeedMul: number;
  mouthMotionMul: number;
  smileBias: number;
  headMotionMul: number;
}

export const PERSONALITIES: Record<PersonalityId, PersonalityProfile> = {
  calm: {
    id: 'calm',
    label: 'Calm',
    blinkIntervalMul: 1.3,
    idleSpeedMul: 0.75,
    reactionSpeedMul: 0.8,
    mouthMotionMul: 0.7,
    smileBias: 0.05,
    headMotionMul: 0.6,
  },
  professional: {
    id: 'professional',
    label: 'Professional',
    blinkIntervalMul: 1.1,
    idleSpeedMul: 0.9,
    reactionSpeedMul: 1,
    mouthMotionMul: 0.85,
    smileBias: 0,
    headMotionMul: 0.5,
  },
  friendly: {
    id: 'friendly',
    label: 'Friendly',
    blinkIntervalMul: 1,
    idleSpeedMul: 1,
    reactionSpeedMul: 1.1,
    mouthMotionMul: 1,
    smileBias: 0.15,
    headMotionMul: 1,
  },
  funny: {
    id: 'funny',
    label: 'Funny',
    blinkIntervalMul: 0.9,
    idleSpeedMul: 1.2,
    reactionSpeedMul: 1.3,
    mouthMotionMul: 1.25,
    smileBias: 0.25,
    headMotionMul: 1.3,
  },
  energetic: {
    id: 'energetic',
    label: 'Energetic',
    blinkIntervalMul: 0.85,
    idleSpeedMul: 1.35,
    reactionSpeedMul: 1.4,
    mouthMotionMul: 1.2,
    smileBias: 0.2,
    headMotionMul: 1.4,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    blinkIntervalMul: 1.5,
    idleSpeedMul: 0.6,
    reactionSpeedMul: 0.7,
    mouthMotionMul: 0.5,
    smileBias: -0.05,
    headMotionMul: 0.3,
  },
};

export function resolvePersonality(raw: string): PersonalityProfile {
  const key = raw.toLowerCase() as PersonalityId;
  if (key in PERSONALITIES) return PERSONALITIES[key];
  if (raw === 'Vriendelijk') return PERSONALITIES.friendly;
  if (raw === 'Professioneel') return PERSONALITIES.professional;
  if (raw === 'Speels') return PERSONALITIES.funny;
  if (raw === 'Rustig') return PERSONALITIES.calm;
  return PERSONALITIES.friendly;
}
