import { useAvatar } from '@/context/AvatarContext';
import { moodToLabel } from '@/lib/avatar/engine/MoodBlend';
import { cn } from '@/lib/utils';

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-xs border-b border-nova-border/50 last:border-0">
      <span className="text-nova-muted">{label}</span>
      <span className={cn('font-mono text-right', highlight ? 'text-nova-cyan' : 'text-gray-200')}>
        {value}
      </span>
    </div>
  );
}

export default function AvatarDebugPanel() {
  const { engineSnapshot, voiceSignals, cameraSignals, systemSignals } = useAvatar();
  if (!engineSnapshot) return null;

  const mood = engineSnapshot.moodBlend;
  const topMood = moodToLabel(mood);
  const moodStr = (Object.entries(mood) as [string, number][])
    .filter(([, v]) => v > 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
    .join(' · ');

  return (
    <aside className="nova-panel p-4 space-y-3 h-fit xl:sticky xl:top-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-nova-cyan">Live Debug</h2>

      <div className="space-y-0">
        <Row label="Current Emotion" value={engineSnapshot.pose.expressionId} highlight />
        <Row label="Current State" value={engineSnapshot.state} highlight />
        <Row label="Animation" value={engineSnapshot.pose.activeAnimation} />
        <Row label="Speaking" value={voiceSignals.isSpeaking ? 'Ja' : 'Nee'} />
        <Row label="Listening" value={voiceSignals.isListening ? 'Ja' : 'Nee'} />
        <Row label="Thinking" value={voiceSignals.isThinking ? 'Ja' : 'Nee'} />
        <Row label="Mood Blend" value={moodStr || topMood} />
        <Row label="FPS" value={String(engineSnapshot.fps)} />
        <Row
          label="Battery"
          value={
            systemSignals.batteryLevel != null
              ? `${systemSignals.batteryLevel}%${systemSignals.batteryCharging ? ' ⚡' : ''}`
              : 'N/A'
          }
        />
        <Row label="CPU" value={`${systemSignals.cpu}%`} />
        <Row label="Sensoren" value={systemSignals.sensorAlerts > 0 ? `${systemSignals.sensorAlerts} alert` : 'OK'} />
        <Row label="Microfoon" value={systemSignals.microphoneActive ? 'Actief' : 'Uit'} />
        <Row label="Camera" value={cameraSignals.permission} />
        <Row label="Gezicht" value={cameraSignals.faceDetected ? 'Gedetecteerd' : '—'} />
        <Row label="Autonomous" value={engineSnapshot.autonomous ? 'Aan' : 'Uit'} />
        <Row label="Idle actie" value={engineSnapshot.idleAction ?? '—'} />
      </div>
    </aside>
  );
}
