import type { PresenceSettings } from './types';

/** Presence Intelligence v4 — all features on by default */
export const DEFAULT_PRESENCE_V4: PresenceSettings = {
  cameraEnabled: true,
  presenceMemoryEnabled: true,
  initiativeEnabled: true,
  localProcessingOnly: true,
  alwaysListening: true,
  wakeWordEnabled: true,
  eyeTrackingEnabled: true,
  followUserEnabled: true,
  presenceDetectionEnabled: true,
  lipSyncEnabled: true,
  idleAnimationsEnabled: true,
  autonomousPersonality: true,
  silentMode: true,
};

export function mergePresenceSettings(partial?: Partial<PresenceSettings>): PresenceSettings {
  return { ...DEFAULT_PRESENCE_V4, ...partial };
}
