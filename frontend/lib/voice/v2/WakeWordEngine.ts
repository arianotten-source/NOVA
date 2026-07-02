import { containsWakeWord, stripWakeWord, isStopCommand } from './hotwordEngine';

export { containsWakeWord, stripWakeWord, isStopCommand };

/** STT-based wake word — swap for Porcupine/OpenWakeWord via futureHooks */
export class WakeWordEngine {
  detect(transcript: string): { detected: boolean; remainder: string } {
    const t = transcript.trim();
    if (!t || !containsWakeWord(t)) {
      return { detected: false, remainder: '' };
    }
    return { detected: true, remainder: stripWakeWord(t) };
  }
}

export const wakeWordEngine = new WakeWordEngine();
