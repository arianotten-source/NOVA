import { useAvatar } from '@/context/AvatarContext';
import { Camera } from 'lucide-react';

export default function HomeCameraPrompt() {
  const { status, enableCamera } = useAvatar();
  if (!status || status.settings.cameraEnabled) return null;

  return (
    <button
      type="button"
      onClick={() => enableCamera()}
      className="absolute bottom-[30%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full border border-nova-border/40 bg-nova-dark/60 text-xs text-nova-muted backdrop-blur-sm touch-manipulation"
    >
      <Camera className="w-3.5 h-3.5" />
      Oogcontact inschakelen
    </button>
  );
}
