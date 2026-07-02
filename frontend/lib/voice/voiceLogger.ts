export type VoiceLogEvent =
  | 'Microfoon gestart'
  | 'Spraak ontvangen'
  | 'Transcript voltooid'
  | 'AI request verzonden'
  | 'AI antwoord ontvangen'
  | 'TTS gestart'
  | 'TTS voltooid'
  | 'Microfoon gestopt'
  | 'Fout';

type Listener = (event: VoiceLogEvent, detail?: string) => void;

const listeners = new Set<Listener>();
const history: { t: number; event: VoiceLogEvent; detail?: string }[] = [];

export const voiceLog = {
  emit(event: VoiceLogEvent, detail?: string) {
    const line = detail ? `${event}: ${detail}` : event;
    console.log(`[N.O.V.A. Voice] ${line}`);
    history.push({ t: Date.now(), event, detail });
    if (history.length > 40) history.shift();
    listeners.forEach((fn) => fn(event, detail));
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getHistory() {
    return [...history];
  },
};
