export type AvatarExpressionId =
  | 'blij'
  | 'heel_blij'
  | 'tevreden'
  | 'knipoog'
  | 'neutraal'
  | 'verrast'
  | 'nieuwsgierig'
  | 'verdrietig'
  | 'bezorgd'
  | 'enthousiast'
  | 'slaperig'
  | 'liefdevol';

export type AvatarAnimationId =
  | 'idle'
  | 'knipperen'
  | 'praten'
  | 'denken'
  | 'luisteren'
  | 'lachen'
  | 'slapen'
  | 'opstarten'
  | 'verbinden'
  | 'offline'
  | 'blij'
  | 'verdrietig';

export type AvatarTheme = 'classic' | 'minimal' | 'robot' | 'neo';
export type AvatarSpeed = 'slow' | 'normal' | 'fast';
export type AvatarLevel = 'low' | 'normal' | 'high' | 'strong';

export type AutoEmotionId =
  | 'begroeting'
  | 'denken'
  | 'luisteren'
  | 'praten'
  | 'blij_antwoord'
  | 'verrast_antwoord'
  | 'foutmelding'
  | 'offline'
  | 'slaapstand'
  | 'wachten'
  | 'verbinden'
  | 'internet_weg'
  | 'sensor_actief'
  | 'agenda_melding'
  | 'nieuwe_taak'
  | 'timer_afgelopen'
  | 'waarschuwing';

export interface AvatarExpression {
  id: AvatarExpressionId;
  emoji: string;
  name: string;
  description: string;
}

export interface AvatarAnimation {
  id: AvatarAnimationId;
  name: string;
  description: string;
}

export interface AvatarSettings {
  name: string;
  voice: string;
  personality: string;
  animationSpeed: AvatarSpeed;
  blinkFrequency: AvatarLevel;
  expressionIntensity: AvatarLevel;
  theme: AvatarTheme;
}

export type AutoEmotionMap = Record<AutoEmotionId, boolean>;

export interface AvatarHardwareStatus {
  oled: {
    connected: boolean;
    i2cAddress: string;
    driver: string;
    resolution: string;
    fps: number;
    firmware: string;
  };
  esp: {
    online: boolean;
    wifi: string;
    sensors: string;
  };
}

export interface AvatarStatus {
  activeExpressionId: AvatarExpressionId;
  activeAnimationId: AvatarAnimationId;
  oledOnline: boolean;
  expressionLabel: string;
  animationLabel: string;
  hardware: AvatarHardwareStatus;
  settings: AvatarSettings;
  autoEmotions: AutoEmotionMap;
  lastUpdated: string;
}

export interface AvatarPlayPayload {
  type: 'expression' | 'animation';
  id: string;
}
