import { Link } from 'react-router-dom';
import { MessageSquare, Settings, Monitor, HardDrive, Wifi, Server } from 'lucide-react';
import NovaAccordion from './NovaAccordion';
import SensorOverviewWidget from '@/widgets/SensorOverviewWidget';
import { SystemStatsWidget } from '@/widgets/SystemStatsWidget';
import { formatBytes } from '@/lib/utils';
import type { Conversation } from '@/types';
import type { AppSettings } from '@/types';

interface NovaAdvancedSectionsProps {
  conversations: Conversation[];
  stats: {
    cpu: number;
    ram: { used: number; total: number; percent: number };
    storage: { used: number; total: number; percent: number };
    network: { online: boolean; type: string };
    platform: string;
    hostname: string;
  };
  settings: AppSettings;
}

export default function NovaAdvancedSections({
  conversations,
  stats,
  settings,
}: NovaAdvancedSectionsProps) {
  const infoCards = [
    { icon: Monitor, label: 'Platform', value: stats.platform },
    { icon: Server, label: 'Hostname', value: stats.hostname },
    { icon: Wifi, label: 'Netwerk', value: stats.network.online ? `Online (${stats.network.type})` : 'Offline' },
    { icon: HardDrive, label: 'Opslag vrij', value: formatBytes(stats.storage.total - stats.storage.used) },
  ];

  return (
    <div className="space-y-3">
      <NovaAccordion id="nova-history" title="Historie" count={conversations.length} defaultOpen={false}>
        {conversations.length === 0 ? (
          <p className="text-sm text-nova-muted">Nog geen gesprekken opgeslagen.</p>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conv) => (
              <li key={conv.id} className="p-3 rounded-lg bg-nova-dark border border-nova-border">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-nova-muted">
                  {conv.messages.length} berichten · {new Date(conv.updatedAt).toLocaleDateString('nl-NL')}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/chat"
          className="flex items-center justify-center gap-2 min-h-[44px] text-sm text-nova-blue hover:text-nova-cyan"
        >
          <MessageSquare className="w-4 h-4" />
          Open chat
        </Link>
      </NovaAccordion>

      <NovaAccordion id="nova-sensors" title="Sensorinformatie" defaultOpen={false}>
        <SensorOverviewWidget />
      </NovaAccordion>

      <NovaAccordion id="nova-diagnostics" title="Diagnostiek" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {infoCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-nova-dark border border-nova-border">
              <div className="w-9 h-9 rounded-lg bg-nova-blue/10 text-nova-blue flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-nova-muted uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <SystemStatsWidget cpu={stats.cpu} ram={stats.ram} storage={stats.storage} compact />
        <Link
          to="/system"
          className="block text-center text-sm text-nova-blue hover:text-nova-cyan mt-3 min-h-[44px] leading-[44px]"
        >
          Volledige systeemstatus →
        </Link>
      </NovaAccordion>

      <NovaAccordion id="nova-settings" title="Instellingen" defaultOpen={false}>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 py-2 border-b border-nova-border/60">
            <dt className="text-nova-muted">Gebruiker</dt>
            <dd className="font-medium">{settings.userName}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2 border-b border-nova-border/60">
            <dt className="text-nova-muted">Taal</dt>
            <dd className="font-medium uppercase">{settings.language}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2 border-b border-nova-border/60">
            <dt className="text-nova-muted">Thema</dt>
            <dd className="font-medium capitalize">{settings.theme}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2 border-b border-nova-border/60">
            <dt className="text-nova-muted">AI-provider</dt>
            <dd className="font-medium">{settings.aiProvider}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-nova-muted">Spraak</dt>
            <dd className="font-medium">{settings.voiceEnabled ? 'Ingeschakeld' : 'Uitgeschakeld'}</dd>
          </div>
        </dl>
        <Link
          to="/settings"
          className="flex items-center justify-center gap-2 min-h-[44px] text-sm text-nova-blue hover:text-nova-cyan mt-2"
        >
          <Settings className="w-4 h-4" />
          Open instellingen
        </Link>
      </NovaAccordion>
    </div>
  );
}
