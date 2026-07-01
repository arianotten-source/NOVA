import type { CameraSignals } from './types';

export class CameraEngine {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
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

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 160, height: 120 },
        audio: false,
      });
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.muted = true;
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

  /** Placeholder analysis — ready for MediaPipe Face Detection hook */
  private startAnalysis() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.video) return;

    const tick = () => {
      if (!this.video) return;
      const w = 64;
      const h = 48;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(this.video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      let brightSum = 0;
      let centerBright = 0;
      for (let i = 0; i < data.length; i += 4) {
        const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
        brightSum += b;
        const px = (i / 4) % w;
        const py = Math.floor(i / 4 / w);
        if (px > w * 0.3 && px < w * 0.7 && py > h * 0.2 && py < h * 0.75) {
          centerBright += b;
        }
      }
      const avg = brightSum / (data.length / 4);
      const centerAvg = centerBright / (w * h * 0.45);
      const faceLikely = centerAvg > avg * 0.95 && avg > 25;

      this.signals = {
        ...this.signals,
        faceDetected: faceLikely,
        userLooking: faceLikely,
        faceX: faceLikely ? (Math.random() - 0.5) * 4 : 0,
        faceY: faceLikely ? (Math.random() - 0.5) * 3 : 0,
      };
      this.emit();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

export const cameraEngine = new CameraEngine();
