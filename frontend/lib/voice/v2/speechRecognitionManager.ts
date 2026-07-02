import { voiceLog } from '@/lib/voice/voiceLogger';
import { voiceState } from '@/lib/voice/voiceState';

export type RecognitionMode = 'off' | 'hotword' | 'command';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart?: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export type ResultHandler = (interim: string, finalPart: string, full: string) => void;
export type EndHandler = (intentional: boolean) => void;

/** Singleton — exactly one SpeechRecognition instance for the entire app voice path */
export class SpeechRecognitionManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private mode: RecognitionMode = 'off';
  private intentionalStop = false;
  private active = false;
  private onResult: ResultHandler | null = null;
  private onEnd: EndHandler | null = null;
  private onError: ((msg: string) => void) | null = null;

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  isActive(): boolean {
    return this.active;
  }

  getMode(): RecognitionMode {
    return this.mode;
  }

  init(): boolean {
    if (this.recognition) return true;
    if (!this.isSupported()) return false;

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'nl-NL';

      recognition.onstart = () => {
        if (voiceState.isSpeaking || this.mode === 'off') {
          this.intentionalStop = true;
          this.abort();
          return;
        }
        this.active = true;
        voiceState.recognitionActive = true;
        voiceLog.emit('STT gestart');
      };

      recognition.onresult = (event) => {
        if (voiceState.isSpeaking || this.mode === 'off') return;

        let interim = '';
        let finalPart = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalPart += chunk;
          else interim += chunk;
        }

        const full = event.results[event.results.length - 1]?.[0]?.transcript ?? interim;
        this.onResult?.(interim, finalPart, full);
      };

      recognition.onerror = (e) => {
        const msg = (e as Event & { error?: string }).error ?? 'onbekend';
        if (msg !== 'aborted' && msg !== 'no-speech') {
          this.onError?.(msg);
          voiceLog.emit('Fout', msg);
        }
      };

      recognition.onend = () => {
        this.active = false;
        voiceState.recognitionActive = false;
        const intentional = this.intentionalStop;
        this.intentionalStop = false;
        this.onEnd?.(intentional);
      };

      this.recognition = recognition;
      return true;
    } catch (err) {
      console.error('[SpeechRecognitionManager] init', err);
      return false;
    }
  }

  setHandlers(handlers: {
    onResult?: ResultHandler;
    onEnd?: EndHandler;
    onError?: (msg: string) => void;
  }) {
    this.onResult = handlers.onResult ?? null;
    this.onEnd = handlers.onEnd ?? null;
    this.onError = handlers.onError ?? null;
  }

  start(mode: RecognitionMode): boolean {
    if (!this.recognition || mode === 'off') return false;
    if (voiceState.isSpeaking) return false;
    if (this.active) {
      if (this.mode === mode) return true;
      this.abort();
    }

    this.mode = mode;
    this.intentionalStop = false;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      voiceLog.emit('Fout', String(err));
      return false;
    }
  }

  stop(): void {
    if (!this.recognition || !this.active) {
      this.mode = 'off';
      return;
    }
    this.intentionalStop = true;
    this.mode = 'off';
    try {
      this.recognition.stop();
    } catch {
      /* ignore */
    }
    voiceLog.emit('STT gestopt');
  }

  abort(): void {
    if (!this.recognition) return;
    this.intentionalStop = true;
    this.mode = 'off';
    try {
      this.recognition.abort?.();
    } catch {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
    }
  }

  destroy(): void {
    this.abort();
    this.recognition = null;
    this.active = false;
    this.mode = 'off';
  }
}

export const speechRecognitionManager = new SpeechRecognitionManager();
