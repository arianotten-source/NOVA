import type { CameraSignals } from './types';
import { MediaPipeFaceTracker } from './MediaPipeFaceTracker';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export class CameraEngine {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private smoothX = 0;
  private smoothY = 0;
  private mediaPipe: MediaPipeFaceTracker | null = null;
  private useMediaPipe = false;
  private lastLandmarks: { x: number; y: number; z?: number }[] | null = null;
  private signals: CameraSignals = {
    available: false,
    permission: 'prompt',
    faceDetected: false,
    userLooking: false,
    faceX: 0,
    faceY: 0,
    personId: null,
    personName: null,
    personKnown: false,
  };
  private listeners = new Set<(s: CameraSignals) => void>();

  getSignals(): CameraSignals {
    return { ...this.signals };
  }

  getLastLandmarks() {
    return this.lastLandmarks;
  }

  setIdentityOverlay(personId: string | null, personName: string | null, known: boolean) {
    this.signals = {
      ...this.signals,
      personId,
      personName,
      personKnown: known,
    };
    this.emit();
  }

  subscribe(fn: (s: CameraSignals) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.getSignals();
    this.listeners.forEach((fn) => fn(snap));
  }

  async requestAccess(): Promise<CameraSignals> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.signals = { ...this.signals, permission: 'unsupported', available: false };
      this.emit();
      return this.getSignals();
    }

    if (this.stream) return this.getSignals();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute('playsinline', 'true');
      await this.video.play();

      this.signals = {
        available: true,
        permission: 'granted',
        faceDetected: false,
        userLooking: false,
        faceX: 0,
        faceY: 0,
        personId: null,
        personName: null,
        personKnown: false,
      };

      this.mediaPipe = new MediaPipeFaceTracker();
      this.useMediaPipe = await this.mediaPipe.init();
      if (!this.useMediaPipe) {
        console.warn('[CameraEngine] MediaPipe unavailable — brightness fallback');
      }

      this.startAnalysis();
      this.emit();
    } catch {
      this.signals = { ...this.signals, permission: 'denied', available: false };
      this.emit();
    }

    return this.getSignals();
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.mediaPipe?.close();
    this.mediaPipe = null;
    this.useMediaPipe = false;
    this.stream = null;
    this.video = null;
    this.smoothX = 0;
    this.smoothY = 0;
    this.lastLandmarks = null;
    this.signals = {
      available: false,
      permission: this.signals.permission,
      faceDetected: false,
      userLooking: false,
      faceX: 0,
      faceY: 0,
      personId: null,
      personName: null,
      personKnown: false,
    };
    this.emit();
  }

  private startAnalysis() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!this.video) return;

    const w = 80;
    const h = 60;
    canvas.width = w;
    canvas.height = h;

    const tick = () => {
      if (!this.video) return;

      try {
        if (this.useMediaPipe && this.mediaPipe?.isReady()) {
          const result = this.mediaPipe.detect(this.video, performance.now());
          if (result) {
            this.lastLandmarks = result.landmarks ?? null;
            if (result.faceDetected) {
              this.smoothX = lerp(this.smoothX, result.faceX, 0.07);
              this.smoothY = lerp(this.smoothY, result.faceY, 0.07);
              this.signals = {
                ...this.signals,
                faceDetected: true,
                userLooking: true,
                faceX: this.smoothX,
                faceY: this.smoothY,
              };
            } else {
              this.lastLandmarks = null;
              this.smoothX = lerp(this.smoothX, 0, 0.04);
              this.smoothY = lerp(this.smoothY, 0, 0.04);
              this.signals = {
                ...this.signals,
                faceDetected: false,
                userLooking: false,
                faceX: this.smoothX,
                faceY: this.smoothY,
              };
            }
            this.emit();
          }
        } else if (ctx) {
          ctx.drawImage(this.video, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let sumX = 0;
          let sumY = 0;
          let weight = 0;
          let brightSum = 0;

          for (let i = 0; i < data.length; i += 4) {
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            brightSum += lum;
            const px = (i / 4) % w;
            const py = Math.floor(i / 4 / w);
            const skinish = data[i] > data[i + 1] && data[i + 1] > data[i + 2] && lum > 40 && lum < 220;
            if (skinish) {
              sumX += px * lum;
              sumY += py * lum;
              weight += lum;
            }
          }

          const faceLikely = weight > w * h * 8 && brightSum / (data.length / 4) > 30;
          let targetX = 0;
          let targetY = 0;

          if (faceLikely) {
            targetX = ((sumX / weight / w) - 0.5) * 2;
            targetY = ((sumY / weight / h) - 0.5) * 2;
          }

          this.smoothX = lerp(this.smoothX, faceLikely ? targetX : 0, faceLikely ? 0.06 : 0.04);
          this.smoothY = lerp(this.smoothY, faceLikely ? targetY : 0, faceLikely ? 0.06 : 0.04);

          this.signals = {
            ...this.signals,
            faceDetected: faceLikely,
            userLooking: faceLikely,
            faceX: Math.max(-1, Math.min(1, this.smoothX)),
            faceY: Math.max(-1, Math.min(1, this.smoothY)),
          };
          this.emit();
        }
      } catch {
        /* frame skip */
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

export const cameraEngine = new CameraEngine();
