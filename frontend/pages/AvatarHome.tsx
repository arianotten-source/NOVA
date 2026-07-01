import { useAvatar } from '@/context/AvatarContext';
import HomeBackground from '@/components/avatar-home/HomeBackground';
import HomeCameraPrompt from '@/components/avatar-home/HomeCameraPrompt';
import HomeMenu from '@/components/avatar-home/HomeMenu';
import HomeMic from '@/components/avatar-home/HomeMic';
import HomeWhisper from '@/components/avatar-home/HomeWhisper';
import PresenceFace from '@/components/avatar-home/PresenceFace';

/**
 * N.O.V.A. home — fullscreen living avatar.
 * No dashboard, cards, bottom nav, or round head.
 */
export default function AvatarHome() {
  const { engineSnapshot, cameraSignals, status } = useAvatar();
  const pose = engineSnapshot?.pose;
  const state = engineSnapshot?.state ?? 'idle';
  const presence = engineSnapshot?.presence;
  const cameraOn =
    Boolean(status?.settings.cameraEnabled) && cameraSignals.permission === 'granted';

  if (!pose) {
    return (
      <div className="flex-1 flex items-center justify-center text-nova-muted text-sm">
        N.O.V.A. wordt wakker…
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0 w-full overflow-hidden">
      <HomeBackground glow={presence?.energy ?? 0.5} />

      {/* Header — only brand + menu */}
      <header className="relative z-30 flex items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span
          className="text-sm font-semibold tracking-[0.25em] text-nova-cyan select-none"
          style={{ textShadow: '0 0 14px rgba(0,255,245,0.3)' }}
        >
          N.O.V.A.
        </span>
        <HomeMenu />
      </header>

      {/* Fullscreen avatar */}
      <main className="relative flex-1 min-h-0">
        <PresenceFace
          pose={pose}
          state={state}
          faceX={cameraOn ? cameraSignals.faceX : 0}
          faceY={cameraOn ? cameraSignals.faceY : 0}
          faceDetected={cameraOn && cameraSignals.faceDetected}
        />
        <HomeWhisper />
        <HomeCameraPrompt />
      </main>

      <footer className="relative z-30">
        <HomeMic />
      </footer>
    </div>
  );
}
