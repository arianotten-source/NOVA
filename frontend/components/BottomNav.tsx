import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Calendar,
  Menu,
  StickyNote,
  Radio,
  Activity,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/tasks', icon: CheckSquare, label: 'Taken' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
];

const moreItems = [
  { to: '/notes', icon: StickyNote, label: 'Notities' },
  { to: '/sensors', icon: Radio, label: 'Sensoren' },
  { to: '/system', icon: Activity, label: 'Systeem' },
  { to: '/files', icon: FolderOpen, label: 'Bestanden' },
  { to: '/settings', icon: Settings, label: 'Instellingen' },
];

interface BottomNavProps {
  moreOpen: boolean;
  onMoreToggle: () => void;
  onMoreClose: () => void;
}

export default function BottomNav({ moreOpen, onMoreToggle, onMoreClose }: BottomNavProps) {
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-nova-dark border-t border-nova-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {mainItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onMoreClose}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-0 px-1',
                  isActive ? 'text-nova-cyan' : 'text-nova-muted'
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] truncate w-full text-center">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onMoreToggle}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-0 px-1',
              moreOpen ? 'text-nova-cyan' : 'text-nova-muted'
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">Meer</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={onMoreClose} />
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-nova-panel border-t border-nova-border rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-neon-strong max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-nova-muted uppercase tracking-wider mb-3 px-1">Meer opties</p>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onMoreClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                      isActive
                        ? 'bg-nova-blue/10 text-nova-cyan border border-nova-blue/20'
                        : 'bg-nova-dark text-gray-300 hover:bg-nova-border/30'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
