import type { AvatarStateId, VoiceSignals } from './types';
import { visemeToMouth } from '@/lib/voice/v2/lipSync';

export interface VoiceStateOutput {
  state: AvatarStateId | null;
  mouthOpen: number;
  eyeScaleBoost: number;
  browRaise: number;
  smileBoost: number;
  headNod: number;
}

export class VoiceEngine {
  private speechPhase = 0;
  private blinkPhase = 0;

  evaluate(voice: VoiceSignals, dt: number): VoiceStateOutput {
    if (voice.isSpeaking) {
      this.speechPhase += dt * 0.008;
      this.blinkPhase += dt * 0.003;
      const viseme = visemeToMouth(voice.viseme);
      const wave = (Math.sin(this.speechPhase * 12) + 1) / 2;
      const micro = (Math.sin(this.speechPhase * 5.5) + 1) / 2;
      const blink = Math.sin(this.blinkPhase) > 0.97 ? 0.04 : 0;
      return {
        state: 'speaking',
        mouthOpen: Math.max(viseme.open, 0.12 + wave * 0.28 * voice.speechEnergy),
        eyeScaleBoost: 0.02 + voice.wakeActivation * 0.04 - blink,
        browRaise: 0.05 + micro * 0.04,
        smileBoost: viseme.smile,
        headNod: micro * 1.2,
      };
    }

    if (voice.isThinking) {
      return {
        state: 'thinking',
        mouthOpen: 0,
        eyeScaleBoost: 0.05,
        browRaise: 0.18,
        smileBoost: 0,
        headNod: 0,
      };
    }

    if (voice.isListening) {
      const talk = voice.userTalking ? 0.12 + voice.speechEnergy * 0.2 : 0;
      return {
        state: 'listening',
        mouthOpen: talk,
        eyeScaleBoost: 0.12 + voice.wakeActivation * 0.08,
        browRaise: 0.22,
        smileBoost: 0.05,
        headNod: 0,
      };
    }

    return { state: null, mouthOpen: 0, eyeScaleBoost: voice.wakeActivation * 0.06, browRaise: 0, smileBoost: 0, headNod: 0 };
  }
}
