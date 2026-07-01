import { readStorage, writeStorage } from '@/lib/storage';
import type { PresenceProfile } from './types';
import { DEFAULT_PRESENCE_PROFILE } from './types';

const STORAGE_KEY = 'presence_profile';

let cached: PresenceProfile | null = null;

export async function loadPresenceProfile(): Promise<PresenceProfile> {
  if (cached) return { ...cached };
  const profile = await readStorage<PresenceProfile>(STORAGE_KEY, DEFAULT_PRESENCE_PROFILE);
  cached = { ...DEFAULT_PRESENCE_PROFILE, ...profile };
  return { ...cached };
}

export async function savePresenceProfile(partial: Partial<PresenceProfile>): Promise<PresenceProfile> {
  const current = await loadPresenceProfile();
  const next = { ...current, ...partial };
  cached = next;
  await writeStorage(STORAGE_KEY, next);
  return next;
}

export function recordInteraction(profile: PresenceProfile): PresenceProfile {
  const trustGain = profile.conversationTone === 'calm' ? 0.4 : 0.6;
  return {
    ...profile,
    interactionCount: profile.interactionCount + 1,
    trustLevel: Math.min(100, profile.trustLevel + trustGain),
    lastSeenAt: Date.now(),
  };
}

export function adaptVoicePace(profile: PresenceProfile, userEnergy: number): PresenceProfile {
  if (userEnergy < 0.35) {
    return { ...profile, voicePace: 'slow', conversationTone: 'calm' };
  }
  if (userEnergy > 0.7) {
    return { ...profile, voicePace: 'normal', conversationTone: 'energetic' };
  }
  return profile;
}

export function trustMotionRelaxation(trust: number): number {
  return 1 + (trust / 100) * 0.25;
}

export function trustInitiativeChance(trust: number): number {
  return 0.15 + (trust / 100) * 0.35;
}
