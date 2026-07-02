import type { VisemeId } from './types';

const VOWEL_A = /[aáàâä]/i;
const VOWEL_E = /[eéèêë]/i;
const VOWEL_O = /[oóòôöuúùûü]/i;
const LABIAL = /[mbp]/i;
const FRICATIVE = /[fv]/i;
const LIQUID = /[l]/i;

export function charToViseme(char: string): VisemeId {
  if (LABIAL.test(char)) return 'M';
  if (FRICATIVE.test(char)) return 'F';
  if (LIQUID.test(char)) return 'L';
  if (VOWEL_A.test(char)) return 'A';
  if (VOWEL_E.test(char)) return 'E';
  if (VOWEL_O.test(char)) return 'O';
  return 'neutral';
}

export function visemeToMouth(viseme: VisemeId): { open: number; smile: number; width: number } {
  switch (viseme) {
    case 'A':
      return { open: 0.55, smile: 0.05, width: 1 };
    case 'E':
      return { open: 0.35, smile: 0.2, width: 0.9 };
    case 'O':
      return { open: 0.5, smile: 0, width: 0.75 };
    case 'M':
      return { open: 0.05, smile: 0, width: 0.6 };
    case 'F':
      return { open: 0.12, smile: -0.05, width: 0.7 };
    case 'L':
      return { open: 0.22, smile: 0.1, width: 0.85 };
    case 'smile':
      return { open: 0.15, smile: 0.45, width: 1 };
    default:
      return { open: 0.08, smile: 0.05, width: 0.8 };
  }
}

export class LipSyncEngine {
  private text = '';
  private cursor = 0;
  private phase = 0;
  private viseme: VisemeId = 'neutral';
  private jitter = 0;
  private nextJitterAt = 0;

  setText(text: string) {
    this.text = text;
    this.cursor = 0;
    this.phase = 0;
    this.viseme = 'neutral';
    this.jitter = 0;
  }

  tick(dt: number, energy: number): VisemeId {
    if (!this.text) return 'neutral';

    const speed = 0.0035 + energy * 0.007;
    this.phase += dt * speed;

    if (this.phase >= 1) {
      this.phase = 0;
      this.cursor = Math.min(this.text.length - 1, this.cursor + 1);
      const ch = this.text[this.cursor] ?? ' ';
      const next = charToViseme(ch);
      this.viseme = next === 'neutral' && Math.random() < 0.3 ? 'E' : next;
    }

    if (Date.now() > this.nextJitterAt) {
      this.jitter = (Math.random() - 0.5) * 0.15;
      this.nextJitterAt = Date.now() + 80 + Math.random() * 120;
    }

    return this.viseme;
  }

  getMouthModulation(): number {
    return this.jitter;
  }

  reset() {
    this.text = '';
    this.cursor = 0;
    this.phase = 0;
    this.viseme = 'neutral';
    this.jitter = 0;
  }

  /** Smooth return to neutral mouth after speaking */
  decay(dt: number) {
    if (this.text) return;
    this.phase = Math.max(0, this.phase - dt * 0.004);
    if (this.jitter !== 0) this.jitter *= 0.9;
    if (Math.abs(this.jitter) < 0.01) this.jitter = 0;
    this.viseme = 'neutral';
  }

  getViseme() {
    return this.viseme;
  }
}

export const lipSyncEngine = new LipSyncEngine();
