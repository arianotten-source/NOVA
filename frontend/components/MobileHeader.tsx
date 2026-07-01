import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { navItems } from '@/components/navItems';

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const location = useLocation();
  const current = navItems.find((item) =>
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  );

  return (
    <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-nova-border bg-nova-dark/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onMenuOpen}
        className="nova-btn-ghost p-2 -ml-2"
        aria-label="Menu openen"
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-sm font-semibold text-gray-100 truncate">
        {current?.label ?? 'N.O.V.A.'}
      </h1>
    </header>
  );
}
