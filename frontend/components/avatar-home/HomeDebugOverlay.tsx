import { useState, useEffect } from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { voiceLog } from '@/lib/voice/voiceLogger';

export default function HomeDebugOverlay() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { cameraSignals, engineSnapshot } = useAvatar();
  const {
    phase,
    aiConnected,
    ttsReady,
    micSupported,
    thinkingSnapshot,
    micEnabled,
    recognitionActive,
    isSpeaking,
    echoCancellation,
    currentTranscript,
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

  const speechState =
    phase === 'listening'
      ? 'Listening'
      : phase === 'thinking'
        ? 'Thinking'
        : phase === 'generating'
          ? 'Generating'
          : phase === 'speaking'
            ? 'Speaking'
            : 'Idle';

  const faceState =
    cameraSignals.permission === 'granted' && cameraSignals.faceDetected
      ? 'Detected'
      : cameraSignals.permission === 'granted'
        ? 'Searching'
        : '—';

  const presenceMode = engineSnapshot?.presence?.mode ?? '—';
  const emotion = thinkingSnapshot.emotion || engineSnapshot?.pose.expressionId || '—';

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
          <p className="text-nova-cyan text-xs font-semibold mb-2">Debug Voice</p>
          <Row label="Listening" value={phase === 'listening' ? 'Yes' : 'No'} />
          <Row label="Thinking" value={phase === 'thinking' || phase === 'generating' ? 'Yes' : 'No'} />
          <Row label="Speaking" value={isSpeaking || phase === 'speaking' ? 'Yes' : 'No'} />
          <Row label="Mic" value={micEnabled ? 'Enabled' : 'Disabled'} />
          <Row label="STT active" value={recognitionActive ? 'Yes' : 'No'} />
          <Row label="Echo Cancel" value={echoCancellation ? 'On' : 'Off'} />
          <Row label="Transcript" value={currentTranscript || '—'} />
          <Row label="Face" value={faceState} />
          <Row label="AI" value={aiConnected ? 'Connected' : 'Disconnected'} />
          <Row label="AI latency" value={thinkingSnapshot.aiLatencyMs != null ? `${thinkingSnapshot.aiLatencyMs}ms` : '—'} />
          <Row label="TTS" value={ttsReady ? (isSpeaking ? 'Speaking' : 'Ready') : 'N/A'} />
          <Row label="STT" value={micSupported ? 'Supported' : 'Unsupported'} />
          <Row label="Status" value={speechState} />
          <Row label="Emotion" value={String(emotion)} />
          <Row label="Presence" value={String(presenceMode)} />
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
