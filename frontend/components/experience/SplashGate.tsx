import { useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';

const SPLASH_KEY = 'nova-v2-splash-seen';

interface SplashGateProps {
  children: React.ReactNode;
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export default function SplashGate({ children }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SPLASH_KEY);
      setShowSplash(!seen);
    } catch {
      setShowSplash(false);
    }
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const duration = isMobileDevice() ? 1600 : 1800;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_KEY, '1');
      } catch {
        /* ignore */
      }
      setShowSplash(false);
    }, duration);
    return () => clearTimeout(t);
  }, [showSplash]);

  return (
    <>
      {children}
      {showSplash && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <SplashScreen />
        </div>
      )}
    </>
  );
}
