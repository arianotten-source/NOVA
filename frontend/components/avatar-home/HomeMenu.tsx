import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { homeMenuItems } from './menuItems';
import { cn } from '@/lib/utils';

export default function HomeMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-nova-cyan/90 touch-manipulation"
        aria-label="Menu openen"
      >
        <MoreHorizontal className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className="fixed top-0 right-0 z-50 h-full w-[min(100vw,280px)] bg-[#0a0f18]/98 border-l border-nova-border/40 p-5 pt-[max(1rem,env(safe-area-inset-top))]"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            >
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 text-nova-muted touch-manipulation"
                  aria-label="Sluiten"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-1">
                {homeMenuItems.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'block min-h-[52px] px-4 py-3 rounded-xl text-base transition-colors touch-manipulation',
                          isActive
                            ? 'text-nova-cyan bg-nova-blue/10'
                            : 'text-gray-200 hover:bg-nova-dark/80'
                        )
                      }
                    >
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
