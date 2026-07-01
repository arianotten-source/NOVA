import type { AvatarStateId, VoiceSignals } from './types';

export interface VoiceStateOutput {
  state: AvatarStateId | null;
  mouthOpen: number;
  eyeScaleBoost: number;
  browRaise: number;
}

export class VoiceEngine {
  private speechPhase = 0;

  evaluate(voice: VoiceSignals, dt: number): VoiceStateOutput {
    if (voice.isSpeaking) {
      this.speechPhase += dt * 0.008;
      const wave = (Math.sin(this.speechPhase * 12) + 1) / 2;
      return {
        state: 'speaking',
        mouthOpen: 0.15 + wave * 0.45 * voice.speechEnergy,
        eyeScaleBoost: 0.02,
        browRaise: 0.05,
      };
    }

    if (voice.isThinking) {
      return {
        state: 'thinking',
        mouthOpen: 0.05,
        eyeScaleBoost: 0,
        browRaise: 0.15,
      };
    }

    if (voice.isListening) {
      const talk = voice.userTalking ? 0.12 + voice.speechEnergy * 0.2 : 0;
      return {
        state: 'listening',
        mouthOpen: talk,
        eyeScaleBoost: voice.userTalking ? 0.06 : 0.1,
        browRaise: 0.2,
      };
    }

    return { state: null, mouthOpen: 0, eyeScaleBoost: 0, browRaise: 0 };
  }
}
