import type { AvatarAnimation } from '@/types/avatar';
import { useAvatar } from '@/context/AvatarContext';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface AnimationCardProps {
  animation: AvatarAnimation;
}

export default function AnimationCard({ animation }: AnimationCardProps) {
  const { status, setAnimation } = useAvatar();
  const active = status?.activeAnimationId === animation.id;

  return (
    <button
      type="button"
      onClick={() => setAnimation(animation.id)}
      className={cn(
        'nova-panel p-4 text-left min-h-[88px] touch-manipulation transition-all duration-200',
        'hover:border-nova-blue/30',
        active && 'border-nova-cyan/60 shadow-neon'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-gray-100">{animation.name}</span>
        <Play className={cn('w-4 h-4', active ? 'text-nova-cyan' : 'text-nova-muted')} />
      </div>
      <p className="text-xs text-nova-muted">{animation.description}</p>
    </button>
  );
}
