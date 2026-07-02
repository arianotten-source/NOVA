/** Shared voice pipeline flags — STT and TTS must never overlap */
export const voiceState = {
  isSpeaking: false,
  micEnabled: true,
  recognitionActive: false,
  echoCancellation: true,
};

export function setSpeaking(v: boolean) {
  voiceState.isSpeaking = v;
  if (v) voiceState.micEnabled = false;
}

export function setMicEnabled(v: boolean) {
  voiceState.micEnabled = v;
}

export function setRecognitionActive(v: boolean) {
  voiceState.recognitionActive = v;
}
