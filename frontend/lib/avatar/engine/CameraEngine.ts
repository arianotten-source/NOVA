import type { CameraSignals } from './types';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export class CameraEngine {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private smoothX = 0;
  private smoothY = 0;
  private searchPhase = 0;
  private signals: CameraSignals = {
    available: false,
    permission: 'prompt',
    faceDetected: false,
    userLooking: false,
    faceX: 0,
    faceY: 0,
  };
  private listeners = new Set<(s: CameraSignals) => void>();

  getSignals(): CameraSignals {
    return { ...this.signals };
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
        video: { facingMode: 'user', width: 320, height: 240 },
        audio: false,
      });
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.muted = true;
      this.video.playsInline = true;
      await this.video.play();

      this.signals = {
        available: true,
        permission: 'granted',
        faceDetected: false,
        userLooking: false,
        faceX: 0,
        faceY: 0,
      };
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
    this.stream = null;
    this.video = null;
    this.smoothX = 0;
    this.smoothY = 0;
    this.signals = {
      available: false,
      permission: this.signals.permission,
      faceDetected: false,
      userLooking: false,
      faceX: 0,
      faceY: 0,
    };
    this.emit();
  }

  /** Brightness-centroid tracking — ready for MediaPipe Face Landmarks */
  private startAnalysis() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !this.video) return;

    const w = 80;
    const h = 60;
    canvas.width = w;
    canvas.height = h;

    const tick = () => {
      if (!this.video) return;
      try {
        ctx.drawImage(this.video, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

      let sumX = 0;
      let sumY = 0;
      let weight = 0;
      let brightSum = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = (r + g + b) / 3;
        brightSum += lum;
        const px = (i / 4) % w;
        const py = Math.floor(i / 4 / w);
        const skinish = r > g && g > b && lum > 40 && lum < 220;
        if (skinish) {
          sumX += px * lum;
          sumY += py * lum;
          weight += lum;
        }
      }

      const avg = brightSum / (data.length / 4);
      const faceLikely = weight > w * h * 8 && avg > 30;

      let targetX = 0;
      let targetY = 0;

      if (faceLikely) {
        const cx = sumX / weight;
        const cy = sumY / weight;
        targetX = ((cx / w) - 0.5) * 2;
        targetY = ((cy / h) - 0.5) * 2;
      } else {
        this.searchPhase += 0.012;
        targetX = Math.sin(this.searchPhase) * 0.35;
        targetY = Math.cos(this.searchPhase * 0.65) * 0.25;
      }

      this.smoothX = lerp(this.smoothX, targetX, faceLikely ? 0.06 : 0.03);
      this.smoothY = lerp(this.smoothY, targetY, faceLikely ? 0.06 : 0.03);

      this.signals = {
        ...this.signals,
        faceDetected: faceLikely,
        userLooking: faceLikely,
        faceX: Math.max(-1, Math.min(1, this.smoothX)),
        faceY: Math.max(-1, Math.min(1, this.smoothY)),
      };
      this.emit();
      } catch {
        /* canvas taint or frame skip — keep last signals */
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

export const cameraEngine = new CameraEngine();
