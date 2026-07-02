export const MIC_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

let activeStream: MediaStream | null = null;

export function getMicStream(): MediaStream | null {
  return activeStream;
}

export async function acquireMicStream(): Promise<MediaStream> {
  if (activeStream?.active) return activeStream;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia unsupported');
  }
  activeStream = await navigator.mediaDevices.getUserMedia({
    audio: MIC_AUDIO_CONSTRAINTS,
    video: false,
  });
  return activeStream;
}

export function releaseMicStream(): void {
  activeStream?.getTracks().forEach((t) => t.stop());
  activeStream = null;
}

export function micEchoCancellationActive(): boolean {
  const track = activeStream?.getAudioTracks()[0];
  if (!track) return true;
  const settings = track.getSettings?.();
  return settings?.echoCancellation !== false;
}

export function setMicTrackMuted(muted: boolean): void {
  activeStream?.getAudioTracks().forEach((t) => {
    t.enabled = !muted;
  });
}
