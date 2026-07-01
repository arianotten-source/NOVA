import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { overflowMenuItems } from './overflowMenuItems';
import { cn } from '@/lib/utils';

export default function OverflowMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-nova-border/60 bg-nova-dark/40 text-nova-cyan backdrop-blur-sm touch-manipulation"
        aria-label="Menu"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className="fixed top-0 right-0 z-50 h-full w-[min(100vw-2rem,300px)] bg-nova-panel/95 border-l border-nova-border backdrop-blur-md p-5 pt-[max(1rem,env(safe-area-inset-top))]"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase tracking-wider text-nova-muted">Menu</span>
                <button type="button" onClick={() => setOpen(false)} className="nova-btn-ghost p-2" aria-label="Sluiten">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-1">
                {overflowMenuItems.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 min-h-[48px] px-4 rounded-xl text-sm transition-colors touch-manipulation',
                          isActive
                            ? 'bg-nova-blue/15 text-nova-cyan border border-nova-blue/25'
                            : 'text-gray-300 hover:bg-nova-dark/80'
                        )
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
