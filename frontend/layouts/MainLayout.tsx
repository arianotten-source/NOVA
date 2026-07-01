import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ChatPanel from '@/components/ChatPanel';
import MobileHeader from '@/components/MobileHeader';

export default function MainLayout() {
  const location = useLocation();
  const showChatPanel = location.pathname !== '/chat';

  return (
    <div className="flex h-full w-full max-w-[100vw] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader />

        <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
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
    </div>
  );
}
