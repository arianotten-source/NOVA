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

export type VisemeId = 'A' | 'E' | 'O' | 'M' | 'F' | 'L' | 'smile' | 'neutral';

export type VoicePipelineState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'THINKING'
  | 'SPEAKING'
  | 'WAITING';

export interface VoiceSignals {
  state: VoicePipelineState;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  speechEnergy: number;
  userTalking: boolean;
  viseme: VisemeId;
  emotion: string;
  wakeActivation: number;
  replyEmotion: string | null;
}

export interface CameraSignals {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  faceDetected: boolean;
  userLooking: boolean;
  faceX: number;
  faceY: number;
  personId: string | null;
  personName: string | null;
  personKnown: boolean;
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
  presenceProfile?: import('../presence/types').PresenceProfile;
  presenceSettings?: import('../presence/types').PresenceSettings;
  environment?: import('../presence/types').EnvironmentContext;
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
  microAnim?: MicroAnimChannels;
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
  presence?: import('../presence/types').PresenceSnapshot;
}

export interface StateDefinition {
  id: AvatarStateId;
  priority: number;
  defaultDurationMs: number;
  targetMood: Partial<MoodBlend>;
  animation: string;
  transitionMs: number;
}
