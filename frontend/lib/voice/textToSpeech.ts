import { voiceLog } from './voiceLogger';
import { setSpeaking } from './voiceState';

function pickVoice(lang = 'nl-NL'): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const nl = lang.startsWith('nl') ? lang.slice(0, 2) : 'nl';
  return (
    voices.find((v) => v.lang.startsWith(nl)) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0] ??
    null
  );
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function warmUpTts(): void {
  if (!isTtsSupported()) return;
  speechSynthesis.getVoices();
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  speechSynthesis.cancel();
  setSpeaking(false);
}

export function speakText(
  text: string,
  handlers?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
    rate?: number;
    pitch?: number;
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (!isTtsSupported() || !text.trim()) {
      setSpeaking(false);
      handlers?.onEnd?.();
      resolve();
      return;
    }

    stopSpeaking();
    setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-NL';
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = handlers?.rate ?? 1;
    utterance.pitch = handlers?.pitch ?? 1;

    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      setSpeaking(false);
      voiceLog.emit('TTS voltooid');
      handlers?.onEnd?.();
      resolve();
    };

    utterance.onstart = () => {
      setSpeaking(true);
      voiceLog.emit('TTS gestart');
      handlers?.onStart?.();
    };
    utterance.onend = finish;
    utterance.onerror = () => {
      handlers?.onError?.('TTS fout');
      finish();
    };

    speechSynthesis.speak(utterance);

    // Android Chrome sometimes skips onend
    window.setTimeout(finish, Math.min(60000, text.length * 120 + 2000));
  });
}
