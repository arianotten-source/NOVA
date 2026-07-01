import { useAvatar } from '@/context/AvatarContext';
import AvatarRenderer from './AvatarRenderer';
import { cn } from '@/lib/utils';

export default function LiveAvatar() {
  const { engineSnapshot, status } = useAvatar();
  const pose = engineSnapshot?.pose;
  if (!status || !pose) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className={cn(
          'avatar-live-wrap rounded-full border border-nova-blue/30 bg-nova-dark/80 shadow-neon',
          'w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] xl:w-[250px] xl:h-[250px]',
          'flex items-center justify-center p-4 transition-all duration-300 mx-auto'
        )}
      >
        <AvatarRenderer
          pose={pose}
          theme={status.settings.theme}
          blinkFrequency={status.settings.blinkFrequency}
          intensity={status.settings.expressionIntensity}
          variant="live"
          cleared={!status.oledOnline}
        />
      </div>
      <p className="text-sm text-nova-muted text-center">
        {status.expressionLabel} · {engineSnapshot.state}
      </p>
    </div>
  );
}
