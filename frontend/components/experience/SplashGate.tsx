import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './SplashScreen';

const SPLASH_KEY = 'nova-v2-splash-seen';

interface SplashGateProps {
  children: React.ReactNode;
}

export default function SplashGate({ children }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem(SPLASH_KEY);
    } catch {
      return true;
    }
  });

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

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>
      {!showSplash && children}
    </>
  );
}
