import { useState, useEffect } from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useIdentity } from '@/context/IdentityContext';
import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { VoiceState } from '@/lib/voice/v2/types';
import { voiceLog } from '@/lib/voice/voiceLogger';

const STATE_LABEL: Record<VoiceState, string> = {
  [VoiceState.IDLE]: 'Idle',
  [VoiceState.LISTENING]: 'Listening',
  [VoiceState.PROCESSING]: 'Processing',
  [VoiceState.THINKING]: 'Thinking',
  [VoiceState.SPEAKING]: 'Speaking',
  [VoiceState.WAITING]: 'Waiting',
};

export default function HomeDebugOverlay() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { cameraSignals, engineSnapshot } = useAvatar();
  const { snapshot: identitySnapshot, enrollment, settings: identitySettings } = useIdentity();
  const {
    voiceState,
    snapshot: voiceSnapshot,
    currentTranscript,
    micEnabled,
    recognitionActive,
    isSpeaking,
    echoCancellation,
    aiQueueSize,
    memorySize,
    wakeWordListening,
    thinkingSnapshot,
  } = useVoicePipeline();

  useEffect(() => {
    const unsubscribe = voiceLog.subscribe((event, detail) => {
      const line = detail ? `${event}: ${detail}` : event;
      setLogs((prev) => [line, ...prev].slice(0, 10));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const faceState =
    cameraSignals.permission === 'granted' && cameraSignals.faceDetected
      ? 'Detected'
      : cameraSignals.permission === 'granted'
        ? 'Searching'
        : '—';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 z-50 px-2 py-1 rounded-md text-[10px] font-mono bg-nova-dark/80 border border-nova-border/50 text-nova-muted touch-manipulation"
      >
        DBG
      </button>

      {open && (
        <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-3 z-50 w-[min(92vw,300px)] rounded-xl border border-nova-border/60 bg-nova-dark/95 backdrop-blur-md p-3 text-[10px] font-mono text-gray-300 space-y-1.5 shadow-xl max-h-[55vh] overflow-y-auto">
          <p className="text-nova-cyan text-xs font-semibold mb-2">Voice Engine V2</p>
          <Row label="Voice State" value={STATE_LABEL[voiceState]} />
          <Row label="Mic" value={micEnabled ? 'Enabled' : 'Disabled'} />
          <Row label="TTS" value={isSpeaking ? 'Speaking' : 'Off'} />
          <Row label="Recognition" value={recognitionActive ? 'Active' : 'Off'} />
          <Row label="AI Queue" value={String(aiQueueSize)} />
          <Row label="Transcript" value={currentTranscript || '—'} />
          <Row label="Latency" value={voiceSnapshot.aiLatencyMs != null ? `${voiceSnapshot.aiLatencyMs}ms` : '—'} />
          <Row label="FPS" value={String(engineSnapshot?.fps ?? '—')} />
          <Row label="Camera" value={faceState} />
          <Row
            label="Identity"
            value={
              identitySnapshot.isKnown
                ? `${identitySnapshot.currentPersonName} (${Math.round(identitySnapshot.lastMatchConfidence * 100)}%)`
                : identitySnapshot.isUnknown
                  ? 'Onbekend'
                  : '—'
            }
          />
          <Row label="Enroll" value={enrollment.step} />
          <Row label="Face ID" value={identitySettings.faceRecognitionEnabled ? 'On' : 'Off'} />
          <Row label="Memory" value={`${memorySize} turns`} />
          <Row label="Wake Word" value={wakeWordListening ? 'Listening' : 'Idle'} />
          <Row label="Emotion" value={voiceSnapshot.emotion} />
          <Row label="Echo Cancel" value={echoCancellation ? 'On' : 'Off'} />
          <Row label="Think style" value={thinkingSnapshot.active ? thinkingSnapshot.style : '—'} />
          <div className="pt-2 border-t border-nova-border/40 mt-2 max-h-28 overflow-y-auto space-y-0.5">
            {logs.map((l, i) => (
              <p key={`${l}-${i}`} className="text-nova-muted truncate">
                {l}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-nova-muted">{label}: </span>
      <span className="text-nova-cyan">{value}</span>
    </p>
  );
}
