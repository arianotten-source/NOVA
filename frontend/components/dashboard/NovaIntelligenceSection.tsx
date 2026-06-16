import { Link } from 'react-router-dom';
import { Brain, MessageSquare, Radio, Settings2, BarChart3 } from 'lucide-react';

interface IntelligenceData {
  memoryEntries: number;
  semanticCount: number;
  conversations: number;
  sensorsOnline: string;
  sensorsLoading: boolean;
  activeAlerts: number;
  aiProvider: string;
  voiceEnabled: boolean;
  completedTasks: number;
  totalTasks: number;
}

function IntelTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-nova-dark border border-nova-border min-h-[68px]">
      <Icon className="w-3.5 h-3.5 text-nova-blue" />
      <span className="text-[10px] font-medium text-nova-muted leading-tight">{label}</span>
      <strong className="text-base font-bold font-mono text-nova-cyan tabular-nums">{value}</strong>
      {sub ? <span className="text-[10px] text-nova-muted">{sub}</span> : null}
    </div>
  );
}

export default function NovaIntelligenceSection({ intelligence }: { intelligence: IntelligenceData }) {
  const aiLabel =
    intelligence.aiProvider === 'none'
      ? 'Lokaal'
      : intelligence.aiProvider === 'openai'
        ? 'OpenAI'
        : 'Lokaal LLM';

  return (
    <section className="nova-panel p-4 space-y-3" aria-label="Assistent inzichten">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-nova-cyan">Assistent inzichten</h3>
        <Link to="/settings" className="text-[10px] text-nova-blue hover:text-nova-cyan">
          Instellingen →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <IntelTile
          icon={Brain}
          label="Geheugen"
          value={String(intelligence.memoryEntries)}
          sub={`${intelligence.semanticCount} semantisch`}
        />
        <IntelTile
          icon={MessageSquare}
          label="Activiteit"
          value={String(intelligence.conversations)}
          sub="gesprekken"
        />
        <IntelTile
          icon={Radio}
          label="Sensoren"
          value={intelligence.sensorsLoading ? '…' : intelligence.sensorsOnline}
          sub={intelligence.activeAlerts > 0 ? `${intelligence.activeAlerts} meldingen` : 'Geen meldingen'}
        />
        <IntelTile
          icon={Settings2}
          label="App-status"
          value={aiLabel}
          sub={intelligence.voiceEnabled ? 'Spraak aan' : 'Spraak uit'}
        />
        <IntelTile
          icon={BarChart3}
          label="Taken voltooid"
          value={`${intelligence.completedTasks}/${intelligence.totalTasks}`}
          sub="gebruik"
        />
      </div>
    </section>
  );
}
