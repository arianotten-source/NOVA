import { useEffect, useState } from 'react';
import NovaAvatarMark from '@/lib/branding/NovaAvatarMark';

type SplashPhase = 'opening' | 'blink' | 'smile' | 'done';

export default function SplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>('opening');
  const [eyeOpen, setEyeOpen] = useState(0.05);
  const [blink, setBlink] = useState(0);
  const [smile, setSmile] = useState(0.1);
  const [glow, setGlow] = useState(0.1);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setPhase('opening');
      setEyeOpen(1);
      setGlow(0.4);
    }, 80);

    const t2 = window.setTimeout(() => {
      setPhase('blink');
      setBlink(1);
    }, 900);

    const t3 = window.setTimeout(() => {
      setBlink(0);
      setPhase('smile');
      setSmile(0.55);
      setGlow(0.55);
    }, 1100);

    const t4 = window.setTimeout(() => setPhase('done'), 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#04060e] h-[100dvh] w-full overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(124,58,237,0.14) 0%, transparent 65%)',
        }}
      />
      <div
        className={`relative w-[min(52vw,220px)] h-[min(52vw,220px)] transition-opacity duration-500 ${
          phase === 'done' ? 'opacity-0 scale-105' : 'opacity-100'
        }`}
        style={{ transition: 'opacity 0.45s ease, transform 0.45s ease' }}
      >
        <NovaAvatarMark
          className="w-full h-full nova-splash-avatar"
          eyeOpen={eyeOpen}
          blink={blink}
          smile={smile}
          glow={glow}
          aria-label="N.O.V.A. wordt gestart"
        />
      </div>
    </div>
  );
}
