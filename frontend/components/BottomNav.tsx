import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, CheckSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/tasks', icon: CheckSquare, label: 'Taken' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
];

/** @deprecated Bottom nav removed — navigation via home menu. Kept for reference. */
export default function BottomNav() {
  return (
    <nav className="hidden">
      <div className="grid grid-cols-4 h-16">
        {mainItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5',
                isActive ? 'text-nova-cyan' : 'text-nova-muted'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
