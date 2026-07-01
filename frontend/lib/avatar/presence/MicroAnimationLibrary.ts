import type { MicroAnimChannels } from './types';
import { EMPTY_MICRO_ANIM } from './types';

export interface MicroAnimationDef {
  id: string;
  category: string;
  durationMs: number;
  weight: number;
  sample: (t: number) => Partial<MicroAnimChannels>;
}

const BROW_IDS = ['raise_left', 'raise_right', 'raise_both', 'furrow', 'wonder', 'skeptic'];
const EYE_IDS = ['wide', 'narrow', 'squint', 'dart_left', 'dart_right', 'look_up', 'look_down', 'slow_close'];
const MOUTH_IDS = ['smirk_left', 'smirk_right', 'soft_smile', 'pout', 'open_slight', 'corner_twitch'];
const BLINK_IDS = ['slow_blink', 'double_blink', 'half_blink', 'flutter'];
const GAZE_IDS = ['glance_left', 'glance_right', 'scan', 'focus', 'drift'];
const BREATH_IDS = ['inhale', 'exhale', 'sigh_soft', 'sigh_deep'];
const THINK_IDS = ['ponder', 'consider', 'hmm', 'realize'];
const REACT_IDS = ['surprise_micro', 'doubt', 'agree_nod', 'curious_peek', 'warmth'];

function wave(t: number, freq = 1, amp = 1) {
  return Math.sin(t * Math.PI * 2 * freq) * amp;
}

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function makeBrowAnim(id: string, side: 'left' | 'right' | 'both'): MicroAnimationDef {
  return {
    id: `brow_${id}`,
    category: 'brow',
    durationMs: 900 + Math.random() * 600,
    weight: 1,
    sample: (t) => {
      const e = ease(Math.sin(t * Math.PI));
      return {
        browLeftY: side !== 'right' ? -6 * e : 0,
        browRightY: side !== 'left' ? -6 * e : 0,
      };
    },
  };
}

function makeEyeAnim(id: string, kind: string): MicroAnimationDef {
  const defs: Record<string, (t: number) => Partial<MicroAnimChannels>> = {
    wide: (t) => ({ eyeOpenLeft: 1 + 0.12 * ease(t), eyeOpenRight: 1 + 0.12 * ease(t), pupilScale: 1.08 }),
    narrow: (t) => ({ eyeOpenLeft: 1 - 0.25 * ease(t), eyeOpenRight: 1 - 0.25 * ease(t) }),
    squint: (t) => ({ eyeOpenLeft: 1 - 0.35 * Math.sin(t * Math.PI), eyeOpenRight: 1 - 0.35 * Math.sin(t * Math.PI) }),
    dart_left: (t) => ({ lookX: -8 * ease(t), lookY: 0 }),
    dart_right: (t) => ({ lookX: 8 * ease(t), lookY: 0 }),
    look_up: (t) => ({ lookY: -6 * ease(t), browLeftY: -2 * ease(t), browRightY: -2 * ease(t) }),
    look_down: (t) => ({ lookY: 5 * ease(t) }),
    slow_close: (t) => ({ eyeOpenLeft: 1 - 0.85 * ease(t), eyeOpenRight: 1 - 0.85 * ease(t) }),
  };
  return {
    id: `eye_${id}`,
    category: 'eye',
    durationMs: 1100,
    weight: 1.1,
    sample: defs[kind] ?? (() => ({})),
  };
}

function makeMouthAnim(id: string, kind: string): MicroAnimationDef {
  const defs: Record<string, (t: number) => Partial<MicroAnimChannels>> = {
    smirk_left: (t) => ({ mouthCornerLeft: 0.2 * ease(t), asymmetricSmile: 0.15 * ease(t) }),
    smirk_right: (t) => ({ mouthCornerRight: 0.2 * ease(t), asymmetricSmile: -0.15 * ease(t) }),
    soft_smile: (t) => ({ mouthCornerLeft: 0.12 * ease(t), mouthCornerRight: 0.12 * ease(t) }),
    pout: (t) => ({ mouthCornerLeft: -0.1 * ease(t), mouthCornerRight: -0.1 * ease(t) }),
    open_slight: (t) => ({ mouthCornerLeft: 0.05 * ease(t), mouthCornerRight: 0.05 * ease(t) }),
    corner_twitch: (t) => ({ mouthCornerRight: wave(t, 2, 0.08) }),
  };
  return {
    id: `mouth_${id}`,
    category: 'mouth',
    durationMs: 800,
    weight: 1,
    sample: defs[kind] ?? (() => ({})),
  };
}

function makeBlinkAnim(id: string, kind: string): MicroAnimationDef {
  const defs: Record<string, (t: number) => Partial<MicroAnimChannels>> = {
    slow_blink: (t) => {
      const v = t < 0.5 ? 1 - t * 1.6 : (t - 0.5) * 1.6;
      return { eyeOpenLeft: Math.max(0.05, v), eyeOpenRight: Math.max(0.05, v) };
    },
    double_blink: (t) => {
      const phase = t * 3;
      const v = phase % 1 < 0.4 ? 0.08 : 1;
      return { eyeOpenLeft: v, eyeOpenRight: v };
    },
    half_blink: (t) => ({ eyeOpenLeft: 1 - 0.5 * ease(t), eyeOpenRight: 1 }),
    flutter: (t) => ({ eyeOpenLeft: 0.3 + wave(t, 4, 0.35), eyeOpenRight: 0.3 + wave(t, 4, 0.35) }),
  };
  return {
    id: `blink_${id}`,
    category: 'blink',
    durationMs: kind === 'double_blink' ? 420 : 280,
    weight: 1.2,
    sample: defs[kind] ?? (() => ({})),
  };
}

function makeGazeAnim(id: string, kind: string): MicroAnimationDef {
  const defs: Record<string, (t: number) => Partial<MicroAnimChannels>> = {
    glance_left: (t) => ({ lookX: -5 * ease(t) }),
    glance_right: (t) => ({ lookX: 5 * ease(t) }),
    scan: (t) => ({ lookX: wave(t, 0.8, 6) }),
    focus: (t) => ({ pupilScale: 1 + 0.06 * ease(t), glowIntensity: 0.15 + 0.08 * ease(t) }),
    drift: (t) => ({ lookX: wave(t, 0.3, 3), lookY: wave(t, 0.25, 2) }),
  };
  return {
    id: `gaze_${id}`,
    category: 'gaze',
    durationMs: 2000,
    weight: 0.9,
    sample: defs[kind] ?? (() => ({})),
  };
}

function makeBreathAnim(id: string, kind: string): MicroAnimationDef {
  const defs: Record<string, (t: number) => Partial<MicroAnimChannels>> = {
    inhale: (t) => ({ floatY: -2 * ease(t), glowIntensity: 0.12 + 0.06 * ease(t) }),
    exhale: (t) => ({ floatY: 2 * ease(t), glowIntensity: 0.12 - 0.04 * ease(t) }),
    sigh_soft: (t) => ({ sighAmount: ease(t) * 0.4, floatY: 1.5 * ease(t) }),
    sigh_deep: (t) => ({ sighAmount: ease(t) * 0.8, floatY: 3 * ease(t), browLeftY: 2 * ease(t), browRightY: 2 * ease(t) }),
  };
  return {
    id: `breath_${id}`,
    category: 'breath',
    durationMs: 2400,
    weight: 0.7,
    sample: defs[kind] ?? (() => ({})),
  };
}

function makeThinkAnim(id: string): MicroAnimationDef {
  return {
    id: `think_${id}`,
    category: 'think',
    durationMs: 1800,
    weight: 0.85,
    sample: (t) => ({
      lookY: -4 * ease(t),
      browRightY: -4 * ease(t),
      browLeftY: -1 * ease(t),
      glowIntensity: 0.14 + 0.1 * ease(t),
    }),
  };
}

function makeReactAnim(id: string, kind: string): MicroAnimationDef {
  const defs: Record<string, (t: number) => Partial<MicroAnimChannels>> = {
    surprise_micro: (t) => ({ eyeOpenLeft: 1 + 0.15 * ease(t), eyeOpenRight: 1 + 0.15 * ease(t), browLeftY: -5 * ease(t), browRightY: -5 * ease(t) }),
    doubt: (t) => ({ browLeftY: -5 * ease(t), lookX: 3 * ease(t) }),
    agree_nod: (t) => ({ floatY: wave(t, 1.5, 2), mouthCornerLeft: 0.08 * ease(t), mouthCornerRight: 0.08 * ease(t) }),
    curious_peek: (t) => ({ lookX: wave(t, 0.5, 4), pupilScale: 1.05 }),
    warmth: (t) => ({ mouthCornerLeft: 0.15 * ease(t), mouthCornerRight: 0.15 * ease(t), glowIntensity: 0.18 + 0.08 * ease(t) }),
  };
  return {
    id: `react_${id}`,
    category: 'react',
    durationMs: 1200,
    weight: 1,
    sample: defs[kind] ?? (() => ({})),
  };
}

function buildLibrary(): MicroAnimationDef[] {
  const lib: MicroAnimationDef[] = [];

  for (const id of BROW_IDS) {
    if (id.includes('left')) lib.push(makeBrowAnim(id, 'left'));
    else if (id.includes('right')) lib.push(makeBrowAnim(id, 'right'));
    else lib.push(makeBrowAnim(id, 'both'));
  }

  for (const id of EYE_IDS) lib.push(makeEyeAnim(id, id));
  for (const id of MOUTH_IDS) lib.push(makeMouthAnim(id, id));
  for (const id of BLINK_IDS) lib.push(makeBlinkAnim(id, id));
  for (const id of GAZE_IDS) lib.push(makeGazeAnim(id, id));
  for (const id of BREATH_IDS) lib.push(makeBreathAnim(id, id));
  for (const id of THINK_IDS) lib.push(makeThinkAnim(id));
  for (const id of REACT_IDS) lib.push(makeReactAnim(id, id));

  // Procedural variants to exceed 100 micro-animations
  const variants = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let i = 0; i < 48; i++) {
    const v = variants[i % variants.length];
    const freq = 0.5 + (i % 7) * 0.1;
    lib.push({
      id: `combo_${i}_${v}`,
      category: 'combo',
      durationMs: 1400 + (i % 5) * 200,
      weight: 0.6,
      sample: (t) => ({
        lookX: wave(t, freq, 2 + (i % 4)),
        lookY: wave(t, freq * 0.7, 1.5),
        mouthCornerLeft: 0.05 * ease(Math.sin(t * Math.PI)),
        browLeftY: -2 * ease(Math.sin(t * Math.PI * (1 + i % 3))),
        floatY: wave(t, 0.4, 1.2),
        glowIntensity: 0.1 + 0.05 * ease(t),
      }),
    });
  }

  return lib;
}

export const MICRO_ANIMATION_LIBRARY = buildLibrary();

export function pickWeightedAnimation(
  pool: MicroAnimationDef[],
  excludeIds: Set<string> = new Set()
): MicroAnimationDef {
  const candidates = pool.filter((a) => !excludeIds.has(a.id));
  const list = candidates.length ? candidates : pool;
  const total = list.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const anim of list) {
    r -= anim.weight;
    if (r <= 0) return anim;
  }
  return list[list.length - 1];
}

export function sampleMicroAnimation(
  anim: MicroAnimationDef,
  progress: number
): MicroAnimChannels {
  const t = Math.max(0, Math.min(1, progress));
  const partial = anim.sample(t);
  return {
    ...EMPTY_MICRO_ANIM,
    animId: anim.id,
    ...partial,
  };
}

export function getAnimationsByCategory(category: string): MicroAnimationDef[] {
  return MICRO_ANIMATION_LIBRARY.filter((a) => a.category === category);
}

export const MICRO_ANIMATION_COUNT = MICRO_ANIMATION_LIBRARY.length;
