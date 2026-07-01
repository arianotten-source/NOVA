import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '@/components/navItems';

export default function MobileHeader() {
  const location = useLocation();
  const current = navItems.find(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  );

  return (
    <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-nova-border bg-nova-dark/95 backdrop-blur-sm">
      <Link
        to="/"
        className="nova-btn-ghost p-2 -ml-2 touch-manipulation"
        aria-label="Terug naar N.O.V.A."
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-sm font-semibold text-gray-100 truncate">
        {current?.label ?? 'N.O.V.A.'}
      </h1>
    </header>
  );
}
