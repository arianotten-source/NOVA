import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useClientOnly } from '@/hooks/useClientOnly';
import { sendAiMessage } from '@/services/aiService';
import { requestMicrophonePermission, queryMicrophonePermission, type PermissionResult } from '@/lib/voice/permissions';
import { speakText, stopSpeaking, warmUpTts, isTtsSupported } from '@/lib/voice/textToSpeech';
import { voiceLog } from '@/lib/voice/voiceLogger';

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface VoicePipelineValue {
  phase: VoicePhase;
  interimText: string;
  finalText: string;
  micPermission: PermissionResult;
  micSupported: boolean;
  aiConnected: boolean;
  ttsReady: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
}

const VoicePipelineContext = createContext<VoicePipelineValue | null>(null);

const SILENCE_MS = 2200;

export function VoicePipelineProvider({ children }: { children: React.ReactNode }) {
  const client = useClientOnly();
  const { setVoiceSignals, setThinking, setSpeaking } = useAvatar();

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [micPermission, setMicPermission] = useState<PermissionResult>('prompt');
  const [aiConnected, setAiConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const phaseRef = useRef<VoicePhase>('idle');
  const lastSpeechAt = useRef(0);
  const silenceTimer = useRef<number | null>(null);
  const accumulatedRef = useRef('');
  const processingRef = useRef(false);
  const isFinalizingRef = useRef(false);
  const finalizeListeningRef = useRef<() => Promise<void>>(async () => {});

  const micSupported =
    client &&
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const ttsReady = client && isTtsSupported();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!client) return;
    warmUpTts();
    queryMicrophonePermission().then(setMicPermission);
  }, [client]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      window.clearInterval(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const processWithAi = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      processingRef.current = true;
      setFinalText(trimmed);
      setInterimText('');
      accumulatedRef.current = '';
      voiceLog.emit('Transcript voltooid', trimmed);

      setPhase('thinking');
      setVoiceSignals({ isListening: false, isThinking: true, isSpeaking: false, userTalking: false });
      setThinking(true);

      try {
        const { reply, connected } = await sendAiMessage(trimmed);
        setAiConnected(connected);
        setThinking(false);

        setPhase('speaking');
        setSpeaking(true);
        setVoiceSignals({
          isListening: false,
          isThinking: false,
          isSpeaking: true,
          speechEnergy: 0.75,
          userTalking: false,
        });

        await speakText(reply, {
          onStart: () => {
            setVoiceSignals({ isSpeaking: true, speechEnergy: 0.8, isListening: false, isThinking: false });
          },
          onEnd: () => {
            setSpeaking(false);
            setPhase('idle');
            setVoiceSignals({
              isListening: false,
              isThinking: false,
              isSpeaking: false,
              speechEnergy: 0.2,
              userTalking: false,
            });
            processingRef.current = false;
          },
        });
      } catch (err) {
        setError('AI of spraakuitvoer mislukt');
        voiceLog.emit('Fout', String(err));
        setThinking(false);
        setSpeaking(false);
        setPhase('idle');
        setVoiceSignals({
          isListening: false,
          isThinking: false,
          isSpeaking: false,
          speechEnergy: 0.2,
          userTalking: false,
        });
        processingRef.current = false;
      }
    },
    [setVoiceSignals, setThinking, setSpeaking]
  );

  const finalizeListening = useCallback(async () => {
    if (isFinalizingRef.current || phaseRef.current !== 'listening') return;
    isFinalizingRef.current = true;
    clearSilenceTimer();
    setPhase('idle');

    const text = accumulatedRef.current.trim();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }

    voiceLog.emit('Microfoon gestopt');
    setInterimText('');

    if (text) {
      await processWithAi(text);
    } else {
      setVoiceSignals({ isListening: false, userTalking: false, speechEnergy: 0.2, isThinking: false, isSpeaking: false });
    }
    isFinalizingRef.current = false;
  }, [processWithAi, setVoiceSignals, clearSilenceTimer]);

  finalizeListeningRef.current = finalizeListening;

  useEffect(() => {
    if (!micSupported) return;

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'nl-NL';

      recognition.onresult = (event) => {
        let interim = '';
        let finalPart = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalPart += chunk;
          else interim += chunk;
        }

        if (interim || finalPart) {
          lastSpeechAt.current = Date.now();
          voiceLog.emit('Spraak ontvangen', interim || finalPart);
        }

        if (finalPart) accumulatedRef.current += finalPart;
        setInterimText(accumulatedRef.current + interim);
      };

      recognition.onerror = (e) => {
        const msg = (e as Event & { error?: string }).error ?? 'onbekend';
        if (msg !== 'aborted' && msg !== 'no-speech') {
          setError(`Spraakherkenning: ${msg}`);
          voiceLog.emit('Fout', msg);
        }
      };

      recognition.onend = () => {
        if (phaseRef.current === 'listening') {
          void finalizeListeningRef.current();
        }
      };

      recognitionRef.current = recognition;
      return () => {
        try {
          recognition.abort?.();
        } catch {
          /* ignore */
        }
      };
    } catch (err) {
      console.error('[VoicePipeline] init', err);
      return undefined;
    }
  }, [micSupported]);

  const startListening = useCallback(async () => {
    if (!micSupported || phaseRef.current === 'speaking' || phaseRef.current === 'thinking') return;

    if (phaseRef.current === 'listening') return;

    stopSpeaking();
    setError(null);
    accumulatedRef.current = '';
    setInterimText('');
    setFinalText('');

    const perm = await requestMicrophonePermission();
    setMicPermission(perm);
    if (perm !== 'granted') {
      setError('Microfoontoegang is nodig om te luisteren.');
      return;
    }

    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setPhase('listening');
      lastSpeechAt.current = Date.now();
      voiceLog.emit('Microfoon gestart');
      setVoiceSignals({
        isListening: true,
        isSpeaking: false,
        isThinking: false,
        userTalking: false,
        speechEnergy: 0.4,
      });

      clearSilenceTimer();
      silenceTimer.current = window.setInterval(() => {
        if (phaseRef.current !== 'listening') return;
        const silent = Date.now() - lastSpeechAt.current > SILENCE_MS;
        const hasText = Boolean(accumulatedRef.current.trim());
        if (silent && hasText) {
          void finalizeListening();
        } else if (silent && !hasText && Date.now() - lastSpeechAt.current > SILENCE_MS + 2000) {
          void finalizeListening();
        }
      }, 400);
    } catch (err) {
      setError('Kon microfoon niet starten');
      voiceLog.emit('Fout', String(err));
      setPhase('idle');
    }
  }, [micSupported, finalizeListening, setVoiceSignals, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    void finalizeListening();
  }, [finalizeListening]);

  const toggleListening = useCallback(async () => {
    if (phaseRef.current === 'listening') stopListening();
    else await startListening();
  }, [startListening, stopListening]);

  const value = useMemo(
    () => ({
      phase,
      interimText,
      finalText,
      micPermission,
      micSupported: Boolean(micSupported),
      aiConnected,
      ttsReady: Boolean(ttsReady),
      error,
      startListening,
      stopListening,
      toggleListening,
    }),
    [
      phase,
      interimText,
      finalText,
      micPermission,
      micSupported,
      aiConnected,
      ttsReady,
      error,
      startListening,
      stopListening,
      toggleListening,
    ]
  );


  return <VoicePipelineContext.Provider value={value}>{children}</VoicePipelineContext.Provider>;
}

export function useVoicePipeline() {
  const ctx = useContext(VoicePipelineContext);
  if (!ctx) throw new Error('useVoicePipeline must be used within VoicePipelineProvider');
  return ctx;
}

export function useVoicePipelineOptional() {
  return useContext(VoicePipelineContext);
}
