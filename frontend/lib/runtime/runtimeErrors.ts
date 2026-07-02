export interface RuntimeErrorEntry {
  t: number;
  source: string;
  message: string;
}

const errors: RuntimeErrorEntry[] = [];
const listeners = new Set<() => void>();

export function pushRuntimeError(source: string, message: string) {
  errors.unshift({ t: Date.now(), source, message });
  if (errors.length > 20) errors.pop();
  listeners.forEach((fn) => fn());
}

export function getRuntimeErrors() {
  return [...errors];
}

export function subscribeRuntimeErrors(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

let attached = false;

export function attachRuntimeErrorHandlers() {
  if (attached || typeof window === 'undefined') return;
  attached = true;

  window.addEventListener('error', (ev) => {
    pushRuntimeError('window', ev.message || String(ev.error));
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const msg = ev.reason instanceof Error ? ev.reason.message : String(ev.reason);
    pushRuntimeError('promise', msg);
  });
}
