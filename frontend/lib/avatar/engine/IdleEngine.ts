import type { PersonalityProfile } from './personalities';

export type IdleAction = 'blink' | 'look_around' | 'micro_smile' | 'head_tilt' | 'pupil_drift' | 'curious_glance' | 'yawn' | null;

export interface IdleOutput {
  action: IdleAction;
  eyeOffsetX: number;
  eyeOffsetY: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  headTilt: number;
  smileBoost: number;
  isBlinking: boolean;
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export class IdleEngine {
  private nextBlinkAt = 0;
  private nextLookAt = 0;
  private nextSmileAt = 0;
  private nextYawnAt = 0;
  private blinkUntil = 0;
  private lookUntil = 0;
  private smileUntil = 0;
  private lookX = 0;
  private lookY = 0;
  private pupilX = 0;
  private pupilY = 0;
  private headTilt = 0;
  private initialized = false;

  reset(now: number, personality: PersonalityProfile) {
    this.scheduleAll(now, personality);
    this.initialized = true;
  }

  private scheduleAll(now: number, personality: PersonalityProfile) {
    const m = personality.blinkIntervalMul;
    this.nextBlinkAt = now + randBetween(3000, 7000) * m;
    this.nextLookAt = now + randBetween(8000, 20000) / personality.idleSpeedMul;
    this.nextSmileAt = now + randBetween(10000, 30000) / personality.idleSpeedMul;
    this.nextYawnAt = now + randBetween(120000, 240000);
  }

  update(now: number, personality: PersonalityProfile, inactiveMs: number): IdleOutput {
    if (!this.initialized) this.reset(now, personality);

    let action: IdleAction = null;
    let isBlinking = false;
    let smileBoost = 0;

    if (now >= this.nextBlinkAt && now > this.blinkUntil) {
      this.blinkUntil = now + 180;
      this.nextBlinkAt = now + randBetween(3000, 7000) * personality.blinkIntervalMul;
      action = 'blink';
      isBlinking = true;
    }

    if (now < this.blinkUntil) {
      isBlinking = true;
      action = 'blink';
    }

    if (now >= this.nextLookAt && now > this.lookUntil) {
      this.lookX = randBetween(-8, 8) * personality.headMotionMul;
      this.lookY = randBetween(-4, 4) * personality.headMotionMul;
      this.lookUntil = now + randBetween(1200, 2800);
      this.nextLookAt = now + randBetween(8000, 20000) / personality.idleSpeedMul;
      action = 'look_around';
    }

    if (now < this.lookUntil) {
      const fade = 1 - (this.lookUntil - now) / 2800;
      this.pupilX = this.lookX * fade * 0.35;
      this.pupilY = this.lookY * fade * 0.35;
      this.headTilt = this.lookX * 0.15 * fade;
    } else {
      this.pupilX *= 0.92;
      this.pupilY *= 0.92;
      this.headTilt *= 0.9;
    }

    if (now >= this.nextSmileAt && now > this.smileUntil) {
      this.smileUntil = now + 1500;
      this.nextSmileAt = now + randBetween(10000, 30000) / personality.idleSpeedMul;
      action = 'micro_smile';
    }

    if (now < this.smileUntil) {
      smileBoost = 0.15 * personality.smileBias + 0.1;
    }

    if (inactiveMs > 20000 && inactiveMs < 60000 && Math.random() < 0.003) {
      action = 'curious_glance';
      this.lookX = randBetween(-10, 10);
      this.lookY = randBetween(-6, 2);
      this.pupilX = this.lookX * 0.5;
      this.pupilY = this.lookY * 0.5;
    }

    if (inactiveMs > 60000 && Math.random() < 0.002) {
      action = 'curious_glance';
    }

    if (inactiveMs > 180000 && now >= this.nextYawnAt) {
      action = 'yawn';
      this.nextYawnAt = now + randBetween(120000, 240000);
    }

    if (Math.random() < 0.002 * personality.idleSpeedMul) {
      action = 'curious_glance';
      this.pupilX = randBetween(-5, 5);
      this.pupilY = randBetween(-3, 0);
    }

    return {
      action,
      eyeOffsetX: this.lookX * 0.08,
      eyeOffsetY: this.lookY * 0.08,
      pupilOffsetX: this.pupilX,
      pupilOffsetY: this.pupilY,
      headTilt: this.headTilt,
      smileBoost,
      isBlinking,
    };
  }
}
