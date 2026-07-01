import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function FullscreenLayout() {
  useEffect(() => {
    document.documentElement.classList.add('nova-fullscreen');
    return () => document.documentElement.classList.remove('nova-fullscreen');
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#050810]">
      <Outlet />
    </div>
  );
}
