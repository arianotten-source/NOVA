import { useAvatar } from '@/context/AvatarContext';
import { Smile, Monitor, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AvatarStatusCards() {
  const { status } = useAvatar();
  if (!status) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="nova-panel p-4">
        <div className="flex items-center gap-2 text-nova-muted text-xs uppercase tracking-wider mb-2">
          <Smile className="w-4 h-4 text-nova-cyan" />
          Huidige emotie
        </div>
        <p className="text-xl font-semibold text-gray-100">{status.expressionLabel}</p>
        <p className="text-xs text-green-400 mt-2">Status: Actief</p>
      </div>

      <div className="nova-panel p-4">
        <div className="flex items-center gap-2 text-nova-muted text-xs uppercase tracking-wider mb-2">
          <Monitor className="w-4 h-4 text-nova-cyan" />
          OLED
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              status.oledOnline ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-400'
            )}
          />
          <p className="text-xl font-semibold text-gray-100">
            {status.oledOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="nova-panel p-4">
        <div className="flex items-center gap-2 text-nova-muted text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-nova-cyan" />
          Animatie
        </div>
        <p className="text-xl font-semibold text-gray-100">{status.animationLabel}</p>
        <p className="text-xs text-nova-muted mt-2">Idle standaard</p>
      </div>
    </div>
  );
}
