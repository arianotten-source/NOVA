type RafCallback = (timestamp: number) => void;

let rafImpl: ((cb: FrameRequestCallback) => number) | null = null;

function getRaf(): (cb: FrameRequestCallback) => number {
  if (typeof window === 'undefined') {
    return (cb) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
  }
  if (!rafImpl) {
    rafImpl =
      window.requestAnimationFrame?.bind(window) ??
      ((cb: FrameRequestCallback) => window.setTimeout(() => cb(Date.now()), 16));
  }
  return rafImpl;
}

export function safeRequestAnimationFrame(callback: RafCallback): number {
  return getRaf()(callback);
}

export function safeCancelAnimationFrame(id: number): void {
  if (typeof window === 'undefined') return;
  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

export function createSafeRafLoop(loop: (now: number) => void) {
  let id = 0;
  let running = true;

  const tick = (ts: number) => {
    if (!running) return;
    if (typeof document !== 'undefined' && document.hidden) {
      id = safeRequestAnimationFrame(tick);
      return;
    }
    try {
      loop(ts);
    } catch (err) {
      console.error('[safeRafLoop]', err);
    }
    id = safeRequestAnimationFrame(tick);
  };

  id = safeRequestAnimationFrame(tick);

  return () => {
    running = false;
    safeCancelAnimationFrame(id);
  };
}
