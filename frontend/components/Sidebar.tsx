import { NavLink } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/components/navItems';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-shrink-0 bg-nova-dark border-r border-nova-border flex-col md:w-[4.5rem] xl:w-56">
      <div className="p-3 xl:p-5 border-b border-nova-border">
        <div className="flex items-center gap-3 justify-center xl:justify-start">
          <div className="w-9 h-9 rounded-lg bg-nova-blue/10 border border-nova-blue/30 flex items-center justify-center shadow-neon flex-shrink-0">
            <Cpu className="w-5 h-5 text-nova-blue" />
          </div>
          <div className="hidden xl:block min-w-0">
            <h1 className="text-sm font-bold tracking-wider text-nova-cyan">N.O.V.A.</h1>
            <p className="text-[10px] text-nova-muted uppercase tracking-widest">Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 xl:p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 xl:px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                'justify-center xl:justify-start',
                isActive
                  ? 'bg-nova-blue/10 text-nova-cyan border border-nova-blue/20 shadow-neon'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-nova-panel'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xl:inline truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden xl:block p-4 border-t border-nova-border">
        <p className="text-[10px] text-nova-muted text-center">v1.0.0 — NeonPulseLabs</p>
      </div>
    </aside>
  );
}
