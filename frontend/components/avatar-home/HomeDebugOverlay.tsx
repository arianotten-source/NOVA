import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAvatar } from '@/context/AvatarContext';
import { useIdentityOptional } from '@/context/IdentityContext';
import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { VoiceState } from '@/lib/voice/v2/types';
import { voiceLog } from '@/lib/voice/voiceLogger';
import { engineTelemetry, patchTelemetry, readMemoryMb } from '@/lib/debug/engineTelemetry';
import { ttsDebug } from '@/lib/voice/textToSpeech';

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
  const location = useLocation();
  const { cameraSignals, engineSnapshot, voiceSignals } = useAvatar();
  const { snapshot: identitySnapshot, enrollment, settings: identitySettings } = useIdentityOptional();
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
    ttsReady,
  } = useVoicePipeline();

  useEffect(() => {
    const unsubscribe = voiceLog.subscribe((event, detail) => {
      const line = detail ? `${event}: ${detail}` : event;
      setLogs((prev) => [line, ...prev].slice(0, 20));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    patchTelemetry({
      avatar: {
        fps: engineSnapshot?.fps ?? null,
        state: engineSnapshot?.state ?? null,
        expression: engineSnapshot?.pose.expressionId ?? null,
      },
      presence: {
        energy: engineSnapshot?.presence?.energy ?? null,
        whisper: engineSnapshot?.presence?.whisper ?? null,
      },
      emotion: voiceSignals.emotion,
      thinking: {
        active: thinkingSnapshot.active,
        style: thinkingSnapshot.active ? thinkingSnapshot.style : null,
      },
      speech: {
        state: STATE_LABEL[voiceState],
        recognition: recognitionActive,
        mic: micEnabled,
      },
      camera: {
        permission: cameraSignals.permission,
        faceDetected: cameraSignals.faceDetected,
        personKnown: cameraSignals.personKnown,
        personName: cameraSignals.personName,
      },
      lipSync: { viseme: voiceSignals.viseme },
      router: { path: location.pathname },
      memoryMb: readMemoryMb(),
    });
  }, [
    engineSnapshot,
    voiceSignals,
    thinkingSnapshot,
    voiceState,
    recognitionActive,
    micEnabled,
    cameraSignals,
    location.pathname,
  ]);

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
        <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-3 z-50 w-[min(94vw,340px)] rounded-xl border border-nova-border/60 bg-nova-dark/95 backdrop-blur-md p-3 text-[10px] font-mono text-gray-300 space-y-2 shadow-xl max-h-[62vh] overflow-y-auto">
          <p className="text-nova-cyan text-xs font-semibold">Debug Console</p>

          <Section title="Avatar">
            <Row label="FPS" value={String(engineTelemetry.avatar.fps ?? '—')} />
            <Row label="State" value={engineTelemetry.avatar.state ?? '—'} />
            <Row label="Expression" value={engineTelemetry.avatar.expression ?? '—'} />
          </Section>

          <Section title="Presence">
            <Row label="Energy" value={String(engineTelemetry.presence.energy ?? '—')} />
            <Row label="Whisper" value={engineTelemetry.presence.whisper ?? '—'} />
          </Section>

          <Section title="Voice / Speech">
            <Row label="State" value={STATE_LABEL[voiceState]} />
            <Row label="Mic" value={micEnabled ? 'On' : 'Off'} />
            <Row label="STT" value={recognitionActive ? 'Active' : 'Off'} />
            <Row label="Emotion" value={voiceSnapshot.emotion} />
            <Row label="Echo" value={echoCancellation ? 'On' : 'Off'} />
            <Row label="Queue" value={String(aiQueueSize)} />
            <Row label="Transcript" value={currentTranscript || '—'} />
            <Row label="Latency" value={voiceSnapshot.aiLatencyMs != null ? `${voiceSnapshot.aiLatencyMs}ms` : '—'} />
          </Section>

          <Section title="TTS">
            <Row label="Ready" value={ttsReady ? 'Yes' : 'No'} />
            <Row label="Speaking" value={isSpeaking ? 'Yes' : 'No'} />
            <Row label="Voices" value={String(ttsDebug.voiceCount)} />
            <Row label="Voice" value={ttsDebug.selectedVoice ?? '—'} />
            <Row label="Queue" value={String(ttsDebug.queueLength)} />
            <Row label="Last err" value={ttsDebug.lastError ?? '—'} />
            <Row label="Display" value={voiceSnapshot.displayText?.slice(0, 40) ?? '—'} />
          </Section>

          <Section title="Thinking">
            <Row label="Active" value={thinkingSnapshot.active ? 'Yes' : 'No'} />
            <Row label="Style" value={thinkingSnapshot.active ? thinkingSnapshot.style : '—'} />
          </Section>

          <Section title="Camera / MediaPipe">
            <Row label="Camera" value={faceState} />
            <Row label="Permission" value={cameraSignals.permission} />
            <Row
              label="Identity"
              value={
                identitySnapshot.isKnown
                  ? `${identitySnapshot.currentPersonName}`
                  : identitySnapshot.isUnknown
                    ? 'Onbekend'
                    : '—'
              }
            />
            <Row label="Enroll" value={enrollment.step} />
            <Row label="Face ID" value={identitySettings.faceRecognitionEnabled ? 'On' : 'Off'} />
          </Section>

          <Section title="LipSync">
            <Row label="Viseme" value={voiceSignals.viseme} />
          </Section>

          <Section title="System">
            <Row label="Router" value={location.pathname} />
            <Row label="Memory" value={`${memorySize} turns · ${engineTelemetry.memoryMb ?? '—'} MB`} />
            <Row label="Wake" value={wakeWordListening ? 'On' : 'Off'} />
          </Section>

          <div className="pt-2 border-t border-nova-border/40 max-h-24 overflow-y-auto space-y-0.5">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5 border-t border-nova-border/30 pt-1.5 first:border-t-0 first:pt-0">
      <p className="text-nova-muted text-[9px] uppercase tracking-wider">{title}</p>
      {children}
    </div>
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
