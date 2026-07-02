import type { VoiceSignals } from '@/lib/avatar/engine/types';
import { VoiceState } from './types';

export function voiceSignalsFromState(
  state: VoiceState,
  partial: Partial<VoiceSignals> = {}
): VoiceSignals {
  return {
    state,
    isListening: state === VoiceState.LISTENING,
    isThinking: state === VoiceState.THINKING || state === VoiceState.PROCESSING,
    isSpeaking: state === VoiceState.SPEAKING,
    speechEnergy: partial.speechEnergy ?? defaultEnergy(state),
    userTalking: partial.userTalking ?? state === VoiceState.LISTENING,
    viseme: partial.viseme ?? 'neutral',
    emotion: partial.emotion ?? 'neutral',
    wakeActivation: partial.wakeActivation ?? 0,
    replyEmotion: partial.replyEmotion ?? null,
  };
}

function defaultEnergy(state: VoiceState): number {
  switch (state) {
    case VoiceState.LISTENING:
      return 0.45;
    case VoiceState.SPEAKING:
      return 0.8;
    case VoiceState.THINKING:
    case VoiceState.PROCESSING:
      return 0.3;
    default:
      return 0.2;
  }
}
