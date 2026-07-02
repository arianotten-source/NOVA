import { useAvatar } from '@/context/AvatarContext';
import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { permissionDeniedMessage } from '@/lib/voice/permissions';

export default function HomePermissionBanner() {
  const { cameraSignals } = useAvatar();
  const { micPermission, error } = useVoicePipeline();

  const messages: string[] = [];
  if (micPermission === 'denied') {
    messages.push(permissionDeniedMessage('microphone'));
  }
  if (cameraSignals.permission === 'denied') {
    messages.push(permissionDeniedMessage('camera'));
  }
  if (error && !messages.includes(error)) {
    messages.push(error);
  }

  if (messages.length === 0) return null;

  return (
    <div className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] left-4 right-4 z-30 pointer-events-none">
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/70 backdrop-blur-sm px-4 py-3 text-xs text-amber-100 space-y-1">
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
    </div>
  );
}
