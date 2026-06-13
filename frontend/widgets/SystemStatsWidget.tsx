import { cn, formatBytes } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  value: number;
  detail?: string;
  color?: string;
}

export default function ProgressBar({ label, value, detail, color = 'bg-nova-blue' }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-nova-cyan font-mono text-xs">
          {value}%{detail && <span className="text-nova-muted ml-2">{detail}</span>}
        </span>
      </div>
      <div className="h-2 bg-nova-dark rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface SystemStatsWidgetProps {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  storage: { used: number; total: number; percent: number };
  compact?: boolean;
}

export function SystemStatsWidget({ cpu, ram, storage, compact }: SystemStatsWidgetProps) {
  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <ProgressBar label="CPU" value={cpu} color="bg-nova-blue" />
      <ProgressBar
        label="RAM"
        value={ram.percent}
        detail={`${formatBytes(ram.used)} / ${formatBytes(ram.total)}`}
        color="bg-nova-cyan"
      />
      <ProgressBar
        label="Opslag"
        value={storage.percent}
        detail={`${formatBytes(storage.used)} / ${formatBytes(storage.total)}`}
        color="bg-purple-500"
      />
    </div>
  );
}
