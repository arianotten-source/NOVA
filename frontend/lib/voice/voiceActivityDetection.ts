import { createSafeRafLoop } from '@/lib/safeRaf';

const SPEECH_THRESHOLD = 0.018;
const SPEECH_HOLD_MS = 180;
const SILENCE_HOLD_MS = 320;

export class VoiceActivityDetector {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private stopRaf: (() => void) | null = null;
  private level = 0;
  private userSpeaking = false;
  private lastSpeechAt = 0;
  private lastSilenceAt = 0;

  start(stream: MediaStream): void {
    this.stop();
    try {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;
      this.source = this.ctx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      this.data = new Uint8Array(this.analyser.fftSize);

      this.stopRaf = createSafeRafLoop(() => {
        if (!this.analyser || !this.data) return;
        this.analyser.getByteTimeDomainData(this.data);
        let sum = 0;
        for (let i = 0; i < this.data.length; i++) {
          const v = (this.data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / this.data.length);
        this.level = this.level * 0.65 + rms * 0.35;
        const now = performance.now();

        if (this.level > SPEECH_THRESHOLD) {
          this.lastSpeechAt = now;
          if (now - this.lastSilenceAt > SPEECH_HOLD_MS || this.userSpeaking) {
            this.userSpeaking = true;
          }
        } else {
          this.lastSilenceAt = now;
          if (now - this.lastSpeechAt > SILENCE_HOLD_MS) {
            this.userSpeaking = false;
          }
        }
      });
    } catch {
      this.stop();
    }
  }

  stop(): void {
    this.stopRaf?.();
    this.stopRaf = null;
    try {
      this.source?.disconnect();
      this.analyser?.disconnect();
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.data = null;
    this.level = 0;
    this.userSpeaking = false;
  }

  isUserSpeaking(): boolean {
    return this.userSpeaking;
  }

  getLevel(): number {
    return this.level;
  }
}

export const voiceActivityDetector = new VoiceActivityDetector();
