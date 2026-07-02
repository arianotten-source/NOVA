let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let osc: OscillatorNode | null = null;
let playing = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Subtle synth ambience — ~25% chance, very soft */
export function maybePlayThinkingAmbience(enabled = true): void {
  if (!enabled || playing || Math.random() > 0.25) return;
  const audio = getCtx();
  if (!audio) return;

  try {
    if (audio.state === 'suspended') void audio.resume();
    gain = audio.createGain();
    gain.gain.value = 0.012;
    osc = audio.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 180 + Math.random() * 40;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    playing = true;
  } catch {
    /* optional */
  }
}

export function stopThinkingAmbience(): void {
  if (!playing) return;
  try {
    osc?.stop();
    osc?.disconnect();
    gain?.disconnect();
  } catch {
    /* ignore */
  }
  osc = null;
  gain = null;
  playing = false;
}
