import type { AvatarStateId } from './types';

export interface EyeOutput {
  eyeOffsetX: number;
  eyeOffsetY: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  headTilt: number;
  isBlinking: boolean;
  eyeScaleBoost: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Central eye animation — always active, offsets decay back to neutral.
 * Fixes stuck-eye bug by forcing lerp-to-zero each frame.
 */
export class EyeEngine {
  private lookX = 0;
  private lookY = 0;
  private pupilX = 0;
  private pupilY = 0;
  private targetLookX = 0;
  private targetLookY = 0;
  private blinkUntil = 0;
  private nextBlinkAt = 0;
  private wakeUntil = 0;
  private wakeBoost = 0;
  private lastState: AvatarStateId = 'idle';
  private saccadeUntil = 0;

  triggerWake(now: number) {
    this.wakeUntil = now + 700;
    this.wakeBoost = 1;
    this.targetLookY = -8;
    this.targetLookX = 0;
  }

  reset(now: number) {
    this.lookX = 0;
    this.lookY = 0;
    this.pupilX = 0;
    this.pupilY = 0;
    this.targetLookX = 0;
    this.targetLookY = 0;
    this.scheduleBlink(now, 'idle');
  }

  private scheduleBlink(now: number, state: AvatarStateId) {
    const fast = state === 'speaking' || state === 'listening';
    this.nextBlinkAt = now + rand(fast ? 2200 : 2800, fast ? 5200 : 6800);
  }

  update(now: number, state: AvatarStateId): EyeOutput {
    if (state !== this.lastState) {
      this.targetLookX *= 0.5;
      this.targetLookY *= 0.5;
      this.lastState = state;
      this.scheduleBlink(now, state);
    }

    if (state !== 'sleeping') {
      if (!this.nextBlinkAt) this.scheduleBlink(now, state);
      if (now >= this.nextBlinkAt && now > this.blinkUntil) {
        this.blinkUntil = now + rand(110, 190);
        this.scheduleBlink(now, state);
      }
    }

    if (state === 'idle' && now > this.saccadeUntil && Math.random() < 0.004) {
      this.targetLookX = rand(-10, 10);
      this.targetLookY = rand(-5, 4);
      this.saccadeUntil = now + rand(800, 2200);
    }

    if (now > this.saccadeUntil) {
      this.targetLookX *= 0.96;
      this.targetLookY *= 0.96;
    }

    if (now < this.wakeUntil) {
      this.wakeBoost = Math.min(1, (this.wakeUntil - now) / 700);
    } else {
      this.wakeBoost *= 0.92;
    }

    const lerp = state === 'thinking' ? 0.06 : 0.1;
    this.lookX += (this.targetLookX - this.lookX) * lerp;
    this.lookY += (this.targetLookY - this.lookY) * lerp;
    this.pupilX += (this.targetLookX * 0.45 - this.pupilX) * 0.12;
    this.pupilY += (this.targetLookY * 0.45 - this.pupilY) * 0.12;

    if (Math.abs(this.lookX) < 0.04) this.lookX = 0;
    if (Math.abs(this.lookY) < 0.04) this.lookY = 0;
    if (Math.abs(this.pupilX) < 0.04) this.pupilX = 0;
    if (Math.abs(this.pupilY) < 0.04) this.pupilY = 0;

    const wakeY = -this.wakeBoost * 5;

    return {
      eyeOffsetX: this.lookX,
      eyeOffsetY: this.lookY + wakeY,
      pupilOffsetX: this.pupilX,
      pupilOffsetY: this.pupilY,
      headTilt: this.lookX * 0.12,
      isBlinking: now < this.blinkUntil,
      eyeScaleBoost: this.wakeBoost * 0.14,
    };
  }
}
