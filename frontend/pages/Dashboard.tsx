import { Link } from 'react-router-dom';
import { StickyNote, CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useSystemStats } from '@/hooks/useSystemStats';
import { SystemStatsWidget } from '@/widgets/SystemStatsWidget';
import SensorOverviewWidget from '@/widgets/SensorOverviewWidget';
import { formatDate, formatTime } from '@/lib/utils';

const shortcuts = [
  { to: '/notes', icon: StickyNote, label: 'Nieuwe notitie', color: 'text-nova-blue' },
  { to: '/tasks', icon: CheckSquare, label: 'Nieuwe taak', color: 'text-nova-cyan' },
  { to: '/agenda', icon: Calendar, label: 'Nieuwe afspraak', color: 'text-purple-400' },
  { to: '/chat', icon: MessageSquare, label: 'Open chat', color: 'text-green-400' },
];

export default function Dashboard() {
  const { settings } = useSettings();
  const stats = useSystemStats();
  const now = new Date();

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 w-full min-w-0">
        <header className="text-center space-y-1">
          <p className="text-4xl font-light text-nova-cyan font-mono">{formatTime(now)}</p>
          <p className="text-nova-muted capitalize">{formatDate(now)}</p>
        </header>

        <section className="text-center py-6">
          <h2 className="text-2xl font-semibold text-gray-100">
            Welkom terug, <span className="text-nova-blue">{settings.userName}</span>
          </h2>
          <p className="text-nova-muted mt-2 text-sm">Je persoonlijke AI-assistent staat klaar.</p>
        </section>

        <section>
          <h3 className="text-sm font-medium text-nova-muted uppercase tracking-wider mb-4">Snelkoppelingen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shortcuts.map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={to} className="nova-card flex flex-col items-center gap-3 py-6 group">
                <div className="w-12 h-12 rounded-xl bg-nova-dark border border-nova-border flex items-center justify-center group-hover:border-nova-blue/30 group-hover:shadow-neon transition-all">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <span className="text-sm text-gray-300">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <SensorOverviewWidget />

        <section className="nova-panel p-6">
          <h3 className="text-sm font-medium text-nova-muted uppercase tracking-wider mb-5">Systeemstatus</h3>
          <SystemStatsWidget cpu={stats.cpu} ram={stats.ram} storage={stats.storage} />
        </section>
      </div>
    </div>
  );
}
