import { NavLink } from 'react-router-dom';
import { X, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/components/navItems';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <>
      <div className="md:hidden fixed inset-0 z-50 bg-black/70" onClick={onClose} />
      <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[min(100vw-3rem,280px)] bg-nova-dark border-r border-nova-border flex flex-col shadow-neon-strong">
        <div className="p-4 border-b border-nova-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-nova-blue/10 border border-nova-blue/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-nova-blue" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-nova-cyan">N.O.V.A.</h1>
              <p className="text-[10px] text-nova-muted uppercase">Menu</p>
            </div>
          </div>
          <button onClick={onClose} className="nova-btn-ghost p-2" aria-label="Sluiten">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm',
                  isActive
                    ? 'bg-nova-blue/10 text-nova-cyan border border-nova-blue/20'
                    : 'text-gray-400 hover:bg-nova-panel'
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
