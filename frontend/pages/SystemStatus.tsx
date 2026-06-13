import { useSystemStats } from '@/hooks/useSystemStats';
import { SystemStatsWidget } from '@/widgets/SystemStatsWidget';
import { formatBytes } from '@/lib/utils';
import { Monitor, HardDrive, Wifi, Server } from 'lucide-react';

export default function SystemStatus() {
  const stats = useSystemStats();

  const infoCards = [
    { icon: Monitor, label: 'Platform', value: stats.platform },
    { icon: Server, label: 'Hostname', value: stats.hostname },
    { icon: Wifi, label: 'Netwerk', value: stats.network.online ? `Online (${stats.network.type})` : 'Offline' },
    { icon: HardDrive, label: 'Opslag vrij', value: formatBytes(stats.storage.total - stats.storage.used) },
  ];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-xl font-semibold">Systeemstatus</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="nova-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-nova-blue/10 text-nova-blue flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-nova-muted uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="nova-panel p-6">
          <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider mb-5">Resource gebruik</h2>
          <SystemStatsWidget cpu={stats.cpu} ram={stats.ram} storage={stats.storage} />
        </div>
      </div>
    </div>
  );
}
