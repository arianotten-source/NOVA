import type {
  AvatarAnimationId,
  AvatarExpressionId,
  AvatarHardwareStatus,
  AvatarPlayPayload,
  AvatarSettings,
  AvatarStatus,
  AutoEmotionMap,
} from './avatarTypes';

const EXPRESSION_LABELS: Record<AvatarExpressionId, string> = {
  blij: 'Blij',
  heel_blij: 'Heel blij',
  tevreden: 'Tevreden',
  knipoog: 'Knipoog',
  neutraal: 'Neutraal',
  verrast: 'Verrast',
  nieuwsgierig: 'Nieuwsgierig',
  verdrietig: 'Verdrietig',
  bezorgd: 'Bezorgd',
  enthousiast: 'Enthousiast',
  slaperig: 'Slaperig',
  liefdevol: 'Liefdevol',
};

const ANIMATION_LABELS: Record<AvatarAnimationId, string> = {
  idle: 'Idle',
  knipperen: 'Knipperen',
  praten: 'Praten',
  denken: 'Denken',
  luisteren: 'Luisteren',
  lachen: 'Lachen',
  slapen: 'Slapen',
  opstarten: 'Opstarten',
  verbinden: 'Verbinden',
  offline: 'Offline',
  blij: 'Blij',
  verdrietig: 'Verdrietig',
};

const EXPRESSION_IDS = Object.keys(EXPRESSION_LABELS) as AvatarExpressionId[];
const ANIMATION_IDS = Object.keys(ANIMATION_LABELS) as AvatarAnimationId[];

const DEFAULT_HARDWARE: AvatarHardwareStatus = {
  oled: {
    connected: true,
    i2cAddress: '0x3C',
    driver: 'SSD1306',
    resolution: '128 x 64',
    fps: 30,
    firmware: 'v1.0',
  },
  esp: {
    online: true,
    wifi: 'Sterk',
    sensors: 'Online',
  },
};

const DEFAULT_SETTINGS: AvatarSettings = {
  name: 'N.O.V.A.',
  voice: 'Vrouw',
  personality: 'Friendly',
  personalityId: 'friendly',
  animationSpeed: 'normal',
  blinkFrequency: 'normal',
  expressionIntensity: 'normal',
  theme: 'classic',
  autonomousAvatar: true,
};

const DEFAULT_AUTO_EMOTIONS: AutoEmotionMap = {
  begroeting: true,
  denken: true,
  luisteren: true,
  praten: true,
  blij_antwoord: true,
  verrast_antwoord: true,
  foutmelding: true,
  offline: true,
  slaapstand: true,
  wachten: true,
  verbinden: true,
  internet_weg: true,
  sensor_actief: true,
  agenda_melding: true,
  nieuwe_taak: true,
  timer_afgelopen: true,
  waarschuwing: true,
};

class AvatarService {
  private activeExpressionId: AvatarExpressionId = 'blij';
  private activeAnimationId: AvatarAnimationId = 'idle';
  private oledOnline = true;
  private oledCleared = false;
  private settings: AvatarSettings = { ...DEFAULT_SETTINGS };
  private autoEmotions: AutoEmotionMap = { ...DEFAULT_AUTO_EMOTIONS };

  getStatus(): AvatarStatus {
    return {
      activeExpressionId: this.activeExpressionId,
      activeAnimationId: this.activeAnimationId,
      oledOnline: this.oledOnline && !this.oledCleared,
      expressionLabel: EXPRESSION_LABELS[this.activeExpressionId],
      animationLabel: ANIMATION_LABELS[this.activeAnimationId],
      hardware: DEFAULT_HARDWARE,
      settings: { ...this.settings },
      autoEmotions: { ...this.autoEmotions },
      lastUpdated: new Date().toISOString(),
    };
  }

  getExpressions() {
    return EXPRESSION_IDS.map((id) => ({
      id,
      name: EXPRESSION_LABELS[id],
    }));
  }

  play(payload: AvatarPlayPayload) {
    if (payload.type === 'expression' && EXPRESSION_IDS.includes(payload.id as AvatarExpressionId)) {
      this.activeExpressionId = payload.id as AvatarExpressionId;
      this.oledCleared = false;
    }
    if (payload.type === 'animation' && ANIMATION_IDS.includes(payload.id as AvatarAnimationId)) {
      this.activeAnimationId = payload.id as AvatarAnimationId;
    }
    return this.getStatus();
  }

  setAnimation(id: AvatarAnimationId) {
    return this.play({ type: 'animation', id });
  }

  reset() {
    this.activeExpressionId = 'blij';
    this.activeAnimationId = 'idle';
    this.oledCleared = false;
    this.oledOnline = true;
    return this.getStatus();
  }

  clearOled() {
    this.oledCleared = true;
    return this.getStatus();
  }

  testConnection() {
    this.oledOnline = true;
    this.oledCleared = false;
    return { success: true, latencyMs: 12, message: 'OLED verbinding OK (mock)' };
  }

  updateSettings(partial: Partial<AvatarSettings>) {
    this.settings = { ...this.settings, ...partial };
    return this.getStatus();
  }

  updateAutoEmotions(partial: Partial<AutoEmotionMap>) {
    this.autoEmotions = { ...this.autoEmotions, ...partial };
    return this.getStatus();
  }
}

let instance: AvatarService | null = null;

export function getAvatarService(): AvatarService {
  if (!instance) instance = new AvatarService();
  return instance;
}

export type {
  AvatarExpressionId,
  AvatarAnimationId,
  AvatarSettings,
  AvatarStatus,
  AvatarPlayPayload,
  AutoEmotionMap,
};
