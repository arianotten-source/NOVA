import type { AvatarExpressionId, AvatarTheme } from '@/types/avatar';

export type AvatarStateId =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'sad'
  | 'concerned'
  | 'excited'
  | 'sleeping'
  | 'curious'
  | 'surprised'
  | 'love';

export type MoodChannel =
  | 'happy'
  | 'curious'
  | 'sleepy'
  | 'sad'
  | 'concerned'
  | 'excited'
  | 'love'
  | 'neutral'
  | 'surprised';

export type MoodBlend = Record<MoodChannel, number>;

export type PersonalityId =
  | 'calm'
  | 'professional'
  | 'friendly'
  | 'funny'
  | 'energetic'
  | 'minimal';

export type ContextEventType =
  | 'new_chat'
  | 'task_completed'
  | 'alarm'
  | 'internet_offline'
  | 'sensor_warning'
  | 'agenda_reminder'
  | 'inactivity'
  | 'low_battery'
  | 'user_returned'
  | 'user_left';

export interface ContextEvent {
  type: ContextEventType;
  timestamp: number;
  priority?: number;
}

export interface VoiceSignals {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  speechEnergy: number;
  userTalking: boolean;
}

export interface CameraSignals {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  faceDetected: boolean;
  userLooking: boolean;
  faceX: number;
  faceY: number;
}

export interface SystemSignals {
  cpu: number;
  batteryLevel: number | null;
  batteryCharging: boolean;
  networkOnline: boolean;
  sensorAlerts: number;
  microphoneActive: boolean;
}

export interface EngineInput {
  autonomous: boolean;
  personality: PersonalityId;
  theme: AvatarTheme;
  voice: VoiceSignals;
  camera: CameraSignals;
  system: SystemSignals;
  manualExpressionId?: AvatarExpressionId | null;
  manualAnimationId?: string | null;
  lastActivityAt: number;
  now: number;
}

export interface RenderPose {
  expressionId: AvatarExpressionId;
  moodBlend: MoodBlend;
  eyeOffsetX: number;
  eyeOffsetY: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  headTilt: number;
  headNod: number;
  mouthOpen: number;
  blinkAmount: number;
  browRaise: number;
  eyeScale: number;
  smileAmount: number;
  glowPulse: number;
  transitionProgress: number;
  activeAnimation: string;
  isBlinking: boolean;
}

export interface AvatarEngineSnapshot {
  state: AvatarStateId;
  previousState: AvatarStateId;
  targetState: AvatarStateId;
  stateEnteredAt: number;
  statePriority: number;
  pose: RenderPose;
  moodBlend: MoodBlend;
  targetMood: MoodBlend;
  fps: number;
  lastContextEvent: ContextEvent | null;
  idleAction: string | null;
  autonomous: boolean;
}

export interface StateDefinition {
  id: AvatarStateId;
  priority: number;
  defaultDurationMs: number;
  targetMood: Partial<MoodBlend>;
  animation: string;
  transitionMs: number;
}
