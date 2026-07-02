export interface AnimationKeyframe {
  t: number;
  mouthOpen?: number;
  headTilt?: number;
  headNod?: number;
  eyeOffsetY?: number;
  glowPulse?: number;
  smileAmount?: number;
}

export interface AnimationClip {
  id: string;
  durationMs: number;
  loop: boolean;
  keyframes: AnimationKeyframe[];
}

export const ANIMATION_CLIPS: Record<string, AnimationClip> = {
  idle: {
    id: 'idle',
    durationMs: 4000,
    loop: true,
    keyframes: [
      { t: 0, headNod: 0 },
      { t: 0.5, headNod: 1 },
      { t: 1, headNod: 0 },
    ],
  },
  blink: {
    id: 'blink',
    durationMs: 180,
    loop: false,
    keyframes: [
      { t: 0, mouthOpen: 0 },
      { t: 0.5, mouthOpen: 0 },
      { t: 1, mouthOpen: 0 },
    ],
  },
  speaking: {
    id: 'speaking',
    durationMs: 400,
    loop: true,
    keyframes: [
      { t: 0, mouthOpen: 0.15 },
      { t: 0.25, mouthOpen: 0.45 },
      { t: 0.5, mouthOpen: 0.2 },
      { t: 0.75, mouthOpen: 0.5 },
      { t: 1, mouthOpen: 0.18 },
    ],
  },
  thinking: {
    id: 'thinking',
    durationMs: 3200,
    loop: true,
    keyframes: [
      { t: 0, eyeOffsetY: -3, glowPulse: 0.22, smileAmount: 0.05 },
      { t: 0.35, eyeOffsetY: -5, glowPulse: 0.38, smileAmount: 0.08 },
      { t: 0.7, eyeOffsetY: -2, glowPulse: 0.28, smileAmount: 0.04 },
      { t: 1, eyeOffsetY: -3, glowPulse: 0.22, smileAmount: 0.05 },
    ],
  },
  listening: {
    id: 'listening',
    durationMs: 2000,
    loop: true,
    keyframes: [
      { t: 0, headTilt: 0 },
      { t: 0.5, headTilt: 2 },
      { t: 1, headTilt: 0 },
    ],
  },
  happy_bounce: {
    id: 'happy_bounce',
    durationMs: 900,
    loop: true,
    keyframes: [
      { t: 0, headNod: 0, smileAmount: 0.7 },
      { t: 0.5, headNod: 4, smileAmount: 0.95 },
      { t: 1, headNod: 0, smileAmount: 0.7 },
    ],
  },
  smile: {
    id: 'smile',
    durationMs: 1200,
    loop: false,
    keyframes: [
      { t: 0, smileAmount: 0.3 },
      { t: 1, smileAmount: 0.85 },
    ],
  },
  sleep: {
    id: 'sleep',
    durationMs: 5000,
    loop: true,
    keyframes: [
      { t: 0, headTilt: 3, headNod: 2 },
      { t: 0.5, headTilt: 4, headNod: 3 },
      { t: 1, headTilt: 3, headNod: 2 },
    ],
  },
  surprised: {
    id: 'surprised',
    durationMs: 600,
    loop: false,
    keyframes: [
      { t: 0, headNod: -2 },
      { t: 0.4, headNod: 2 },
      { t: 1, headNod: 0 },
    ],
  },
  concerned: {
    id: 'concerned',
    durationMs: 2000,
    loop: true,
    keyframes: [
      { t: 0, headTilt: -2 },
      { t: 1, headTilt: -3 },
    ],
  },
  sad: {
    id: 'sad',
    durationMs: 3000,
    loop: true,
    keyframes: [
      { t: 0, headNod: 2 },
      { t: 1, headNod: 4 },
    ],
  },
  eye_look: {
    id: 'eye_look',
    durationMs: 1800,
    loop: true,
    keyframes: [
      { t: 0, headTilt: -3 },
      { t: 0.5, headTilt: 3 },
      { t: 1, headTilt: -3 },
    ],
  },
  wake_up: {
    id: 'wake_up',
    durationMs: 800,
    loop: false,
    keyframes: [
      { t: 0, headNod: 5 },
      { t: 1, headNod: 0 },
    ],
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sampleKeyframe(clip: AnimationClip, progress: number): AnimationKeyframe {
  const frames = clip.keyframes;
  if (frames.length === 0) return { t: 0 };
  if (frames.length === 1) return frames[0];

  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].t < progress) i += 1;
  const a = frames[i];
  const b = frames[Math.min(i + 1, frames.length - 1)];
  const span = Math.max(0.0001, b.t - a.t);
  const localT = Math.min(1, Math.max(0, (progress - a.t) / span));

  const out: AnimationKeyframe = { t: progress };
  const keys: (keyof AnimationKeyframe)[] = [
    'mouthOpen',
    'headTilt',
    'headNod',
    'eyeOffsetY',
    'glowPulse',
    'smileAmount',
  ];
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (av != null || bv != null) {
      const val = lerp(av ?? 0, bv ?? 0, localT);
      if (k === 'mouthOpen') out.mouthOpen = val;
      if (k === 'headTilt') out.headTilt = val;
      if (k === 'headNod') out.headNod = val;
      if (k === 'eyeOffsetY') out.eyeOffsetY = val;
      if (k === 'glowPulse') out.glowPulse = val;
      if (k === 'smileAmount') out.smileAmount = val;
    }
  }
  return out;
}

export class AnimationEngine {
  private clipId = 'idle';
  private startedAt = 0;
  private oneShotUntil = 0;

  setClip(id: string, now: number) {
    if (this.clipId === id) return;
    this.clipId = ANIMATION_CLIPS[id] ? id : 'idle';
    this.startedAt = now;
  }

  playOneShot(id: string, now: number) {
    const clip = ANIMATION_CLIPS[id];
    if (!clip) return;
    this.clipId = id;
    this.startedAt = now;
    this.oneShotUntil = now + clip.durationMs;
  }

  update(now: number): AnimationKeyframe {
    const clip = ANIMATION_CLIPS[this.clipId] ?? ANIMATION_CLIPS.idle;
    const elapsed = now - this.startedAt;
    let progress = elapsed / clip.durationMs;
    if (clip.loop) progress = progress % 1;
    else progress = Math.min(1, progress);

    if (!clip.loop && this.oneShotUntil > 0 && now >= this.oneShotUntil) {
      this.clipId = 'idle';
      this.startedAt = now;
      this.oneShotUntil = 0;
    }

    return sampleKeyframe(clip, progress);
  }

  getClipId() {
    return this.clipId;
  }
}
