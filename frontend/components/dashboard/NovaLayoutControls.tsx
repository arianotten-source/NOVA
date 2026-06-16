import { cn } from '@/lib/utils';
import {
  NOVA_LAYOUT_MODES,
  saveNovaLayoutMode,
  type NovaLayoutMode,
} from '@/lib/novaLayoutPrefs';

const OPTIONS: { value: NovaLayoutMode; label: string }[] = [
  { value: NOVA_LAYOUT_MODES.COMPACT, label: 'Compact' },
  { value: NOVA_LAYOUT_MODES.STANDARD, label: 'Standaard' },
  { value: NOVA_LAYOUT_MODES.ADVANCED, label: 'Geavanceerd' },
];

interface NovaLayoutControlsProps {
  layoutMode: NovaLayoutMode;
  onLayoutModeChange: (mode: NovaLayoutMode) => void;
}

export default function NovaLayoutControls({ layoutMode, onLayoutModeChange }: NovaLayoutControlsProps) {
  const setMode = (mode: NovaLayoutMode) => {
    saveNovaLayoutMode(mode);
    onLayoutModeChange(mode);
  };

  return (
    <div className="nova-panel p-3 space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-nova-muted">
        Dashboard layout
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Dashboard layout">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cn(
              'min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold border transition-colors touch-manipulation',
              layoutMode === opt.value
                ? 'border-nova-blue/40 bg-nova-blue/10 text-nova-cyan'
                : 'border-nova-border bg-nova-dark text-gray-300 hover:border-nova-blue/20'
            )}
            onClick={() => setMode(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
