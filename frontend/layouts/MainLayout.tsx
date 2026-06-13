import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ChatPanel from '@/components/ChatPanel';
import BottomNav from '@/components/BottomNav';
import MobileMenu from '@/components/MobileMenu';
import MobileHeader from '@/components/MobileHeader';

export default function MainLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const showChatPanel = location.pathname !== '/chat';
  const hideMobileHeader = location.pathname === '/chat';

  return (
    <div className="flex h-full w-full max-w-[100vw] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!hideMobileHeader && (
          <MobileHeader onMenuOpen={() => setMenuOpen(true)} />
        )}

        <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden pb-nav-bottom md:pb-0">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Outlet />
          </div>
          {showChatPanel && (
            <div className="hidden xl:flex flex-shrink-0">
              <ChatPanel />
            </div>
          )}
        </main>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <BottomNav
        moreOpen={moreOpen}
        onMoreToggle={() => setMoreOpen((v) => !v)}
        onMoreClose={() => setMoreOpen(false)}
      />
    </div>
  );
}
