import type { MoodBlend, AvatarStateId } from '../engine/types';
import type { PersonalityProfile } from '../engine/personalities';
import type { CameraSignals, SystemSignals, VoiceSignals } from '../engine/types';

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export type PresenceMode =
  | 'awake'
  | 'drowsy'
  | 'sleeping'
  | 'waking'
  | 'welcome_home'
  | 'health_alert';

/** v4 user-presence states for eye contact & greeting */
export type PresenceUserStatus =
  | 'nobody'
  | 'appearing'
  | 'nearby'
  | 'left'
  | 'right'
  | 'moving'
  | 'departing';

export interface MoodVector {
  happy: number;
  calm: number;
  curious: number;
  thinking: number;
  sleepy: number;
  concerned: number;
  excited: number;
}

export interface PresenceProfile {
  trustLevel: number;
  interactionCount: number;
  preferredGreeting: string | null;
  voicePace: 'slow' | 'normal' | 'fast';
  conversationTone: 'calm' | 'normal' | 'energetic';
  usualSleepHour: number | null;
  usualWakeHour: number | null;
  favoriteFeatures: string[];
  lastSeenAt: number;
  memoryEnabled: boolean;
}

export interface PresenceSettings {
  cameraEnabled: boolean;
  presenceMemoryEnabled: boolean;
  initiativeEnabled: boolean;
  localProcessingOnly: boolean;
  alwaysListening: boolean;
  wakeWordEnabled: boolean;
  eyeTrackingEnabled: boolean;
  followUserEnabled: boolean;
  presenceDetectionEnabled: boolean;
  lipSyncEnabled: boolean;
  idleAnimationsEnabled: boolean;
  autonomousPersonality: boolean;
  silentMode: boolean;
}

export interface EnvironmentContext {
  temperature?: number | null;
  humidity?: number | null;
  lightLevel?: number | null;
  soundLevel?: number | null;
  weatherMood?: 'rain' | 'sunny' | 'cloudy' | 'unknown';
  agendaMinutesUntil?: number | null;
}

export interface MicroAnimChannels {
  animId: string;
  browLeftY: number;
  browRightY: number;
  eyeOpenLeft: number;
  eyeOpenRight: number;
  mouthCornerLeft: number;
  mouthCornerRight: number;
  pupilScale: number;
  floatY: number;
  glowIntensity: number;
  sighAmount: number;
  yawnAmount: number;
  lookX: number;
  lookY: number;
  asymmetricSmile: number;
}

export interface PresenceSnapshot {
  mode: PresenceMode;
  userStatus: PresenceUserStatus;
  dayPhase: DayPhase;
  energy: number;
  curiosity: number;
  attention: number;
  trustLevel: number;
  moodVector: MoodVector;
  moodModifiers: Partial<MoodBlend>;
  microAnim: MicroAnimChannels;
  motionSpeedMul: number;
  blinkIntervalMul: number;
  whisper: string | null;
  whisperPriority: number;
  voicePaceMul: number;
  healthConcern: boolean;
}

export interface PresenceInput {
  now: number;
  mood: MoodBlend;
  targetMood: MoodBlend;
  state: AvatarStateId;
  voice: VoiceSignals;
  camera: CameraSignals;
  system: SystemSignals;
  personality: PersonalityProfile;
  inactiveMs: number;
  profile: PresenceProfile;
  settings: PresenceSettings;
  environment: EnvironmentContext;
  idleAction: string | null;
}

export const DEFAULT_PRESENCE_PROFILE: PresenceProfile = {
  trustLevel: 12,
  interactionCount: 0,
  preferredGreeting: null,
  voicePace: 'normal',
  conversationTone: 'normal',
  usualSleepHour: null,
  usualWakeHour: null,
  favoriteFeatures: [],
  lastSeenAt: Date.now(),
  memoryEnabled: true,
};

import { DEFAULT_PRESENCE_V4 } from './presenceConfig';

export const DEFAULT_PRESENCE_SETTINGS: PresenceSettings = { ...DEFAULT_PRESENCE_V4 };

export const EMPTY_MICRO_ANIM: MicroAnimChannels = {
  animId: 'neutral',
  browLeftY: 0,
  browRightY: 0,
  eyeOpenLeft: 1,
  eyeOpenRight: 1,
  mouthCornerLeft: 0,
  mouthCornerRight: 0,
  pupilScale: 1,
  floatY: 0,
  glowIntensity: 0.12,
  sighAmount: 0,
  yawnAmount: 0,
  lookX: 0,
  lookY: 0,
  asymmetricSmile: 0,
};
