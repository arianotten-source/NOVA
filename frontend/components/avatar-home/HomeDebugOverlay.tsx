import { useState } from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { permissionLabel, queryCameraPermission } from '@/lib/voice/permissions';
import { voiceLog } from '@/lib/voice/voiceLogger';
import { useEffect } from 'react';

export default function HomeDebugOverlay() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [camPerm, setCamPerm] = useState('…');
  const { cameraSignals } = useAvatar();
  const { phase, micPermission, aiConnected, ttsReady, micSupported } = useVoicePipeline();

  useEffect(() => {
    queryCameraPermission().then((p) => setCamPerm(permissionLabel(p)));
  }, [cameraSignals.permission]);

  useEffect(() => {
    const unsubscribe = voiceLog.subscribe((event, detail) => {
      const line = detail ? `${event}: ${detail}` : event;
      setLogs((prev) => [line, ...prev].slice(0, 8));
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
        : phase === 'speaking'
          ? 'Speaking'
          : 'Idle';

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
        <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-3 z-50 w-[min(92vw,280px)] rounded-xl border border-nova-border/60 bg-nova-dark/95 backdrop-blur-md p-3 text-[10px] font-mono text-gray-300 space-y-1.5 shadow-xl">
          <p className="text-nova-cyan text-xs font-semibold mb-2">Debug</p>
          <Row label="Camera" value={cameraSignals.permission === 'granted' ? 'OK' : camPerm === 'OK' ? 'OK' : 'Geen toegang'} />
          <Row label="Microfoon" value={permissionLabel(micPermission)} />
          <Row label="Speech" value={speechState} />
          <Row label="AI" value={aiConnected ? 'Connected' : 'Disconnected'} />
          <Row label="Face" value={faceState} />
          <Row label="TTS" value={ttsReady ? (phase === 'speaking' ? 'Speaking' : 'Ready') : 'N/A'} />
          <Row label="STT" value={micSupported ? 'Supported' : 'Unsupported'} />
          <div className="pt-2 border-t border-nova-border/40 mt-2 max-h-24 overflow-y-auto space-y-0.5">
            {logs.map((l) => (
              <p key={l} className="text-nova-muted truncate">
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
