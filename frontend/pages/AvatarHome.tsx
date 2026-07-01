import { useAvatar, useAvatarPoseFallback } from '@/context/AvatarContext';
import HomeBackground from '@/components/avatar-home/HomeBackground';
import HomeCameraPrompt from '@/components/avatar-home/HomeCameraPrompt';
import HomeLoading from '@/components/avatar-home/HomeLoading';
import HomeMenu from '@/components/avatar-home/HomeMenu';
import HomeMic from '@/components/avatar-home/HomeMic';
import HomeWhisper from '@/components/avatar-home/HomeWhisper';
import PresenceFace from '@/components/avatar-home/PresenceFace';
import PresenceFaceStatic from '@/components/avatar-home/PresenceFaceStatic';
import EngineErrorBoundary from '@/components/errors/EngineErrorBoundary';

export default function AvatarHome() {
  const { engineSnapshot, cameraSignals, status, loading } = useAvatar();
  const fallbackPose = useAvatarPoseFallback('neutraal');
  const pose = engineSnapshot?.pose ?? fallbackPose;
  const state = engineSnapshot?.state ?? 'idle';
  const presence = engineSnapshot?.presence;

  const cameraTracking =
    Boolean(status?.settings.cameraEnabled) &&
    cameraSignals.permission === 'granted' &&
    cameraSignals.available;

  const isStarting = loading || !engineSnapshot;

  return (
    <div className="relative flex flex-col h-[100dvh] w-full overflow-hidden">
      <HomeBackground glow={presence?.energy ?? 0.5} />

      {isStarting && <HomeLoading />}

      <header className="relative z-30 flex items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span
          className="text-sm font-semibold tracking-[0.25em] text-nova-cyan select-none"
          style={{ textShadow: '0 0 14px rgba(0,255,245,0.3)' }}
        >
          N.O.V.A.
        </span>
        <HomeMenu />
      </header>

      <main className="relative flex-1 min-h-0">
        <EngineErrorBoundary
          name="Avatar Engine"
          fallback={<PresenceFaceStatic pose={fallbackPose} state={state} />}
        >
          <EngineErrorBoundary
            name="Presence Engine"
            fallback={<PresenceFaceStatic pose={pose} state={state} />}
          >
            <PresenceFace
              pose={pose}
              state={state}
              faceX={cameraTracking ? cameraSignals.faceX : 0}
              faceY={cameraTracking ? cameraSignals.faceY : 0}
              faceDetected={cameraTracking && cameraSignals.faceDetected}
            />
          </EngineErrorBoundary>
        </EngineErrorBoundary>

        <EngineErrorBoundary name="Presence Whispers" fallback={null}>
          <HomeWhisper />
        </EngineErrorBoundary>

        <EngineErrorBoundary name="Camera Engine" fallback={null}>
          <HomeCameraPrompt />
        </EngineErrorBoundary>
      </main>

      <footer className="relative z-30">
        <EngineErrorBoundary name="Voice Engine" fallback={null}>
          <HomeMic />
        </EngineErrorBoundary>
      </footer>
    </div>
  );
}
