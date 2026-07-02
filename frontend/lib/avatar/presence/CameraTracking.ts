import type { CameraSignals } from '../engine/types';
import type { PresenceUserStatus } from './types';

const LINGER_MS = 1000;
const MOVE_THRESHOLD = 0.08;

export interface CameraTrackingState {
  userStatus: PresenceUserStatus;
  faceScale: number;
  trackingFps: number;
}

export class CameraTracking {
  private lastX = 0;
  private lastY = 0;
  private lastFaceAt = 0;
  private wasPresent = false;
  private frameCount = 0;
  private fpsAccum = 0;
  private fps = 0;
  private smoothScale = 0.5;

  tick(now: number, raw: CameraSignals): CameraTrackingState {
    const dt = 16;
    this.frameCount++;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsAccum);
      this.frameCount = 0;
      this.fpsAccum = 0;
    }

    const face = raw.faceDetected && raw.permission === 'granted';
    let userStatus: PresenceUserStatus = 'nobody';

    if (face) {
      const dx = raw.faceX - this.lastX;
      const dy = raw.faceY - this.lastY;
      const moving = Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD;

      if (!this.wasPresent) {
        userStatus = 'appearing';
      } else if (moving) {
        userStatus = 'moving';
      } else if (raw.faceX < -0.25) {
        userStatus = 'left';
      } else if (raw.faceX > 0.25) {
        userStatus = 'right';
      } else if (raw.faceScale > 0.65) {
        userStatus = 'nearby';
      } else {
        userStatus = 'nearby';
      }

      this.lastFaceAt = now;
      this.wasPresent = true;
      this.lastX = raw.faceX;
      this.lastY = raw.faceY;
      this.smoothScale += (raw.faceScale - this.smoothScale) * 0.1;
    } else {
      if (this.wasPresent && now - this.lastFaceAt < LINGER_MS) {
        userStatus = 'departing';
      } else {
        userStatus = 'nobody';
        this.wasPresent = false;
      }
    }

    return {
      userStatus,
      faceScale: this.smoothScale,
      trackingFps: this.fps,
    };
  }
}

export const cameraTracking = new CameraTracking();
