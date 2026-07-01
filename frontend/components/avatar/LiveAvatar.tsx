import { useAvatar } from '@/context/AvatarContext';
import AvatarFace from './AvatarFace';
import { cn } from '@/lib/utils';

export default function LiveAvatar() {
  const { status, pulseKey } = useAvatar();
  if (!status) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        key={pulseKey}
        className={cn(
          'avatar-live-wrap rounded-full border border-nova-blue/30 bg-nova-dark/80 shadow-neon',
          'w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[250px] md:h-[250px]',
          'flex items-center justify-center p-4 transition-transform duration-300 avatar-pulse-on-change'
        )}
      >
        <AvatarFace
          expressionId={status.activeExpressionId}
          animationId={status.activeAnimationId}
          theme={status.settings.theme}
          blinkFrequency={status.settings.blinkFrequency}
          intensity={status.settings.expressionIntensity}
          variant="live"
          cleared={!status.oledOnline}
        />
      </div>
      <p className="text-sm text-nova-muted">
        {status.expressionLabel} · {status.animationLabel}
      </p>
    </div>
  );
}
