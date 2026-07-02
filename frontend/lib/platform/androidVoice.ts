import { isMobileDevice } from '@/lib/runtime/isMobile';

let wakeLock: WakeLockSentinel | null = null;

export async function requestScreenWakeLock(): Promise<void> {
  if (!isMobileDevice() || typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> } };
  if (!nav.wakeLock) return;
  try {
    wakeLock = await nav.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch {
    /* permission denied or unsupported */
  }
}

export function releaseScreenWakeLock(): void {
  void wakeLock?.release();
  wakeLock = null;
}

export function vibrateActivation(): void {
  if (!isMobileDevice() || typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate([12, 40, 18]);
}

export function vibrateListeningPulse(): void {
  if (!isMobileDevice() || typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(8);
}
