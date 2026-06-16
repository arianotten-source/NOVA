import { Link } from 'react-router-dom';
import { Calendar, StickyNote, CheckSquare, Bell, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewData {
  agendaToday: number;
  notes: number;
  openTasks: number;
  reminders: number;
  systemOk: boolean;
  cpu: number;
  networkOnline: boolean;
}

interface NovaOverviewSectionProps {
  overview: OverviewData;
  userName: string;
  timeLabel: string;
  dateLabel: string;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
  to,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  tone?: 'primary' | 'positive' | 'warning';
  to?: string;
}) {
  const content = (
  <>
      <Icon className="w-4 h-4 text-nova-blue mb-1" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-nova-muted">{label}</span>
      <strong
        className={cn(
          'text-base font-bold font-mono tabular-nums',
          tone === 'positive' && 'text-green-400',
          tone === 'warning' && 'text-orange-400',
          tone === 'primary' && 'text-nova-cyan text-xl'
        )}
      >
        {value}
      </strong>
    </>
  );

  const cls = cn(
    'flex flex-col gap-0.5 p-3 rounded-xl bg-nova-dark border border-nova-border min-h-[72px]',
    tone === 'primary' && 'col-span-2 border-nova-blue/25 bg-nova-blue/5',
    to && 'hover:border-nova-blue/30 transition-colors'
  );

  if (to) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    );
  }

  return <div className={cls}>{content}</div>;
}

export default function NovaOverviewSection({
  overview,
  userName,
  timeLabel,
  dateLabel,
}: NovaOverviewSectionProps) {
  return (
    <section className="nova-panel p-4 space-y-3" aria-label="Overzicht">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-light text-nova-cyan font-mono">{timeLabel}</p>
          <p className="text-sm text-nova-muted capitalize">{dateLabel}</p>
          <h2 className="text-lg font-semibold text-gray-100 mt-2">
            Welkom, <span className="text-nova-blue">{userName}</span>
          </h2>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <MetricCard
          icon={Calendar}
          label="Agenda vandaag"
          value={String(overview.agendaToday)}
          tone="primary"
          to="/agenda"
        />
        <MetricCard icon={StickyNote} label="Notities" value={String(overview.notes)} to="/notes" />
        <MetricCard icon={CheckSquare} label="Open taken" value={String(overview.openTasks)} to="/tasks" />
        <MetricCard icon={Bell} label="Herinneringen" value={String(overview.reminders)} to="/agenda" />
        <MetricCard
          icon={Activity}
          label="Systeemstatus"
          value={overview.systemOk ? 'OK' : 'Let op'}
          tone={overview.systemOk ? 'positive' : 'warning'}
          to="/system"
        />
      </div>
      <p className="text-[11px] text-nova-muted">
        CPU {overview.cpu}% · Netwerk {overview.networkOnline ? 'online' : 'offline'}
      </p>
    </section>
  );
}
