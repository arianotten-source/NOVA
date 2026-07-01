import { useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';

const SPLASH_KEY = 'nova-v2-splash-seen';

interface SplashGateProps {
  children: React.ReactNode;
}

export default function SplashGate({ children }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setShowSplash(!sessionStorage.getItem(SPLASH_KEY));
    } catch {
      setShowSplash(true);
    }
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_KEY, '1');
      } catch {
        /* ignore */
      }
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [showSplash]);

  if (!mounted) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#04060e] text-nova-cyan text-sm">
        N.O.V.A. wordt gestart...
      </div>
    );
  }

  return (
    <>
      {children}
      {showSplash && (
        <div className="fixed inset-0 z-[200]">
          <SplashScreen />
        </div>
      )}
    </>
  );
}
