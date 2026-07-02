import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useClientOnly } from '@/hooks/useClientOnly';
import { queryMicrophonePermission, type PermissionResult } from '@/lib/voice/permissions';
import { warmUpTts, isTtsSupported } from '@/lib/voice/textToSpeech';
import { voiceEngineV2 } from '@/lib/voice/v2/VoiceEngineV2';
import { VoiceState, type VoiceSnapshot } from '@/lib/voice/v2/types';
import { speechRecognitionManager } from '@/lib/voice/v2/speechRecognitionManager';
import { conversationMemory } from '@/lib/voice/v2/conversationMemory';
import type { ThinkingSnapshot } from '@/lib/thinking/ThinkingEngine';
import { thinkingEngine } from '@/lib/thinking/ThinkingEngine';

/** @deprecated Use VoiceState from v2 — kept for UI compatibility */
export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'generating' | 'speaking';

function stateToPhase(state: VoiceState): VoicePhase {
  switch (state) {
    case VoiceState.LISTENING:
      return 'listening';
    case VoiceState.PROCESSING:
    case VoiceState.THINKING:
      return 'thinking';
    case VoiceState.SPEAKING:
      return 'speaking';
    case VoiceState.WAITING:
      return 'idle';
    default:
      return 'idle';
  }
}

interface VoicePipelineValue {
  phase: VoicePhase;
  voiceState: VoiceState;
  snapshot: VoiceSnapshot;
  interimText: string;
  finalText: string;
  micPermission: PermissionResult;
  micSupported: boolean;
  aiConnected: boolean;
  ttsReady: boolean;
  error: string | null;
  thinkingSnapshot: ThinkingSnapshot;
  micEnabled: boolean;
  recognitionActive: boolean;
  isSpeaking: boolean;
  echoCancellation: boolean;
  currentTranscript: string;
  aiQueueSize: number;
  memorySize: number;
  wakeWordListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  cancelActive: () => void;
}

const VoicePipelineContext = createContext<VoicePipelineValue | null>(null);

export function VoicePipelineProvider({ children }: { children: React.ReactNode }) {
  const client = useClientOnly();
  const { setVoiceSignals, setThinking, setSpeaking } = useAvatar();

  const [snapshot, setSnapshot] = useState<VoiceSnapshot>(voiceEngineV2.getSnapshot());
  const [micPermission, setMicPermission] = useState<PermissionResult>('prompt');

  const micSupported = client && speechRecognitionManager.isSupported();
  const ttsReady = client && isTtsSupported();

  useEffect(() => {
    if (!client) return;

    warmUpTts();
    queryMicrophonePermission().then(setMicPermission);

    voiceEngineV2.setAvatarBridge({ setVoiceSignals, setThinking, setSpeaking });
    const ok = voiceEngineV2.init();
    if (!ok) return;

    const unsub = voiceEngineV2.subscribe(setSnapshot);
    void voiceEngineV2.startHotwordListen();

    return () => {
      unsub();
    };
  }, [client, setVoiceSignals, setThinking, setSpeaking]);

  const startListening = useCallback(() => voiceEngineV2.startListening(true), []);
  const stopListening = useCallback(() => voiceEngineV2.stopListening(), []);
  const toggleListening = useCallback(() => voiceEngineV2.toggleListening(), []);
  const cancelActive = useCallback(() => voiceEngineV2.cancel(), []);

  const thinkingSnapshot =
    snapshot.state === VoiceState.THINKING || snapshot.state === VoiceState.PROCESSING
      ? thinkingEngine.isActive()
        ? thinkingEngine.getSnapshot()
        : snapshot.thinkingSnapshot
      : snapshot.thinkingSnapshot;

  const value = useMemo(
    () => ({
      phase: stateToPhase(snapshot.state),
      voiceState: snapshot.state,
      snapshot,
      interimText: snapshot.interimText,
      finalText: snapshot.finalText,
      micPermission,
      micSupported: Boolean(micSupported),
      aiConnected: snapshot.aiConnected,
      ttsReady: Boolean(ttsReady),
      error: snapshot.error,
      thinkingSnapshot,
      micEnabled: snapshot.micEnabled,
      recognitionActive: snapshot.recognitionActive,
      isSpeaking: snapshot.state === VoiceState.SPEAKING,
      echoCancellation: snapshot.echoCancellation,
      currentTranscript: snapshot.currentTranscript,
      aiQueueSize: snapshot.aiQueueSize,
      memorySize: conversationMemory.size(),
      wakeWordListening: snapshot.wakeWordListening,
      startListening,
      stopListening,
      toggleListening,
      cancelActive,
    }),
    [
      snapshot,
      micPermission,
      micSupported,
      ttsReady,
      thinkingSnapshot,
      startListening,
      stopListening,
      toggleListening,
      cancelActive,
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
