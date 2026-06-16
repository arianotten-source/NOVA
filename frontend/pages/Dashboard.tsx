import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StickyNote, CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { loadNovaLayoutMode, NOVA_LAYOUT_MODES, type NovaLayoutMode } from '@/lib/novaLayoutPrefs';
import { formatDate, formatTime } from '@/lib/utils';
import NovaLayoutControls from '@/components/dashboard/NovaLayoutControls';
import NovaOverviewSection from '@/components/dashboard/NovaOverviewSection';
import NovaIntelligenceSection from '@/components/dashboard/NovaIntelligenceSection';
import NovaTodayAgenda from '@/components/dashboard/NovaTodayAgenda';
import NovaQuickLists from '@/components/dashboard/NovaQuickLists';
import NovaAdvancedSections from '@/components/dashboard/NovaAdvancedSections';

const shortcuts = [
  { to: '/notes', icon: StickyNote, label: 'Notitie', color: 'text-nova-blue' },
  { to: '/tasks', icon: CheckSquare, label: 'Taak', color: 'text-nova-cyan' },
  { to: '/agenda', icon: Calendar, label: 'Afspraak', color: 'text-purple-400' },
  { to: '/chat', icon: MessageSquare, label: 'Chat', color: 'text-green-400' },
];

export default function Dashboard() {
  const [layoutMode, setLayoutMode] = useState<NovaLayoutMode>(loadNovaLayoutMode);
  const data = useDashboardData();
  const now = new Date();

  const showIntelligence = layoutMode !== NOVA_LAYOUT_MODES.COMPACT;
  const showQuickLists = layoutMode === NOVA_LAYOUT_MODES.STANDARD;
  const showAdvanced = layoutMode === NOVA_LAYOUT_MODES.ADVANCED;

  if (!data.loaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-nova-muted text-sm">Dashboard laden...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-3 w-full min-w-0">
        <NovaLayoutControls layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} />

        <NovaOverviewSection
          overview={data.overview}
          userName={data.settings.userName}
          timeLabel={formatTime(now)}
          dateLabel={formatDate(now)}
        />

        {showIntelligence ? <NovaIntelligenceSection intelligence={data.intelligence} /> : null}

        <NovaTodayAgenda events={data.todayEvents} />

        {showQuickLists ? (
          <NovaQuickLists notes={data.recentNotes} tasks={data.openTasks} />
        ) : null}

        {layoutMode === NOVA_LAYOUT_MODES.COMPACT ? (
          <section className="nova-panel p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-nova-muted mb-2">
              Snelkoppelingen
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {shortcuts.map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center justify-center gap-2 min-h-[72px] rounded-xl bg-nova-dark border border-nova-border hover:border-nova-blue/30 transition-colors touch-manipulation"
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-xs text-gray-300">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {showAdvanced ? (
          <NovaAdvancedSections
            conversations={data.recentConversations}
            stats={data.stats}
            settings={data.settings}
          />
        ) : null}
      </div>
    </div>
  );
}
