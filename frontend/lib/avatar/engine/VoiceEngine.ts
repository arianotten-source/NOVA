import type { AvatarStateId, VoiceSignals } from './types';
import { visemeToMouth } from '@/lib/voice/v2/lipSync';

export interface VoiceStateOutput {
  state: AvatarStateId | null;
  mouthOpen: number;
  eyeScaleBoost: number;
  browRaise: number;
  smileBoost: number;
}

export class VoiceEngine {
  private speechPhase = 0;

  evaluate(voice: VoiceSignals, dt: number): VoiceStateOutput {
    if (voice.isSpeaking) {
      this.speechPhase += dt * 0.008;
      const viseme = visemeToMouth(voice.viseme);
      const wave = (Math.sin(this.speechPhase * 12) + 1) / 2;
      return {
        state: 'speaking',
        mouthOpen: Math.max(viseme.open, 0.1 + wave * 0.25 * voice.speechEnergy),
        eyeScaleBoost: 0.02,
        browRaise: 0.05,
        smileBoost: viseme.smile,
      };
    }

    if (voice.isThinking) {
      return {
        state: 'thinking',
        mouthOpen: 0,
        eyeScaleBoost: 0.04,
        browRaise: 0.12,
        smileBoost: 0,
      };
    }

    if (voice.isListening) {
      const talk = voice.userTalking ? 0.12 + voice.speechEnergy * 0.2 : 0;
      return {
        state: 'listening',
        mouthOpen: talk,
        eyeScaleBoost: voice.userTalking ? 0.06 : 0.1,
        browRaise: 0.2,
        smileBoost: 0,
      };
    }

    return { state: null, mouthOpen: 0, eyeScaleBoost: 0, browRaise: 0, smileBoost: 0 };
  }
}
