import type { CameraSignals } from '../engine/types';
import type { PresenceUserStatus } from './types';

export interface EyeContactOutput {
  eyeOffsetX: number;
  eyeOffsetY: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  eyeScaleBoost: number;
  eyeContactScore: number;
  gazeTarget: 'eyes' | 'mouth' | 'away_left' | 'away_right' | 'center';
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Unified eye-contact & gaze — smooth interpolation, natural human patterns.
 */
export class EyeContactEngine {
  private smoothX = 0;
  private smoothY = 0;
  private smoothScale = 0.5;
  private lingerX = 0;
  private lingerY = 0;
  private lingerUntil = 0;
  private gazeMode: EyeContactOutput['gazeTarget'] = 'eyes';
  private nextGazeSwitch = 0;

  tick(
    now: number,
    camera: CameraSignals,
    enabled: boolean,
    followUser: boolean,
    userStatus: PresenceUserStatus
  ): EyeContactOutput {
    if (!enabled || camera.permission !== 'granted') {
      this.decayToCenter();
      return this.output(0, 0, 0, 0, 0, 0.1, 'center');
    }

    const faceVisible = camera.faceDetected;

    if (faceVisible) {
      const targetX = followUser ? camera.faceX * 14 : 0;
      const targetY = followUser ? camera.faceY * 10 : 0;
      const targetScale = followUser ? 0.35 + camera.faceScale * 0.45 : 0.5;

      this.smoothX = lerp(this.smoothX, targetX, 0.08);
      this.smoothY = lerp(this.smoothY, targetY, 0.08);
      this.smoothScale = lerp(this.smoothScale, targetScale, 0.06);
      this.lingerX = this.smoothX;
      this.lingerY = this.smoothY;
      this.lingerUntil = now + 1000;
    } else if (now < this.lingerUntil) {
      const fade = (this.lingerUntil - now) / 1000;
      this.smoothX = lerp(this.smoothX, this.lingerX * fade, 0.04);
      this.smoothY = lerp(this.smoothY, this.lingerY * fade, 0.04);
      this.smoothScale = lerp(this.smoothScale, 0.5, 0.03);
    } else {
      this.decayToCenter();
    }

    if (now >= this.nextGazeSwitch) {
      this.pickGazeMode();
      this.nextGazeSwitch = now + 2200 + Math.random() * 4000;
    }

    let offX = this.smoothX;
    let offY = this.smoothY;

    switch (this.gazeMode) {
      case 'mouth':
        offY += 5;
        break;
      case 'away_left':
        offX -= 8;
        break;
      case 'away_right':
        offX += 8;
        break;
      default:
        break;
    }

    if (userStatus === 'left') offX -= 4;
    if (userStatus === 'right') offX += 4;
    if (userStatus === 'nearby') offY -= 1;

    const contact = faceVisible ? 0.7 + camera.faceScale * 0.25 : now < this.lingerUntil ? 0.4 : 0.1;

    return this.output(
      offX * 0.12,
      offY * 0.12,
      offX * 0.35,
      offY * 0.35,
      (this.smoothScale - 0.5) * 0.2,
      contact,
      this.gazeMode
    );
  }

  private pickGazeMode() {
    const r = Math.random();
    if (r < 0.8) this.gazeMode = 'eyes';
    else if (r < 0.9) this.gazeMode = 'mouth';
    else if (r < 0.95) this.gazeMode = 'away_left';
    else this.gazeMode = 'away_right';
  }

  private decayToCenter() {
    this.smoothX *= 0.94;
    this.smoothY *= 0.94;
    this.smoothScale = lerp(this.smoothScale, 0.5, 0.04);
    if (Math.abs(this.smoothX) < 0.05) this.smoothX = 0;
    if (Math.abs(this.smoothY) < 0.05) this.smoothY = 0;
  }

  private output(
    eyeOffsetX: number,
    eyeOffsetY: number,
    pupilOffsetX: number,
    pupilOffsetY: number,
    eyeScaleBoost: number,
    eyeContactScore: number,
    gazeTarget: EyeContactOutput['gazeTarget']
  ): EyeContactOutput {
    return { eyeOffsetX, eyeOffsetY, pupilOffsetX, pupilOffsetY, eyeScaleBoost, eyeContactScore, gazeTarget };
  }
}

export const eyeContactEngine = new EyeContactEngine();
