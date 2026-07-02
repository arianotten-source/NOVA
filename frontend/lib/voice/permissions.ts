import { acquireMicStream, releaseMicStream } from './micStream';

export type PermissionResult = 'granted' | 'denied' | 'unsupported' | 'prompt';

export async function requestMicrophonePermission(): Promise<PermissionResult> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
  try {
    const stream = await acquireMicStream();
    if (!stream.active) {
      releaseMicStream();
      return 'denied';
    }
    return 'granted';
  } catch (err) {
    releaseMicStream();
    const name = (err as DOMException)?.name;
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied';
    return 'denied';
  }
}

export async function queryMicrophonePermission(): Promise<PermissionResult> {
  if (!navigator.permissions?.query) return 'prompt';
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function queryCameraPermission(): Promise<PermissionResult> {
  if (!navigator.permissions?.query) return 'prompt';
  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export function permissionDeniedMessage(kind: 'microphone' | 'camera'): string {
  if (kind === 'microphone') {
    return 'Microfoontoegang ontbreekt. Sta microfoon toe in je browserinstellingen om met N.O.V.A. te praten.';
  }
  return 'Cameratoegang ontbreekt. Sta de camera toe in je browserinstellingen voor oogcontact.';
}

export function permissionLabel(result: PermissionResult): string {
  switch (result) {
    case 'granted':
      return 'OK';
    case 'denied':
      return 'Geen toegang';
    case 'unsupported':
      return 'Niet ondersteund';
    default:
      return 'Nog niet gevraagd';
  }
}
