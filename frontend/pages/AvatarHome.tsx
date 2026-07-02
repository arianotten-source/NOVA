import { useAvatar, useAvatarPoseFallback } from '@/context/AvatarContext';
import { VoicePipelineProvider } from '@/context/VoicePipelineContext';
import HomeBackground from '@/components/avatar-home/HomeBackground';
import HomeCameraPrompt from '@/components/avatar-home/HomeCameraPrompt';
import HomeDebugOverlay from '@/components/avatar-home/HomeDebugOverlay';
import HomeLoading from '@/components/avatar-home/HomeLoading';
import HomeMenu from '@/components/avatar-home/HomeMenu';
import HomeMic from '@/components/avatar-home/HomeMic';
import HomePermissionBanner from '@/components/avatar-home/HomePermissionBanner';
import HomeVoiceStatus from '@/components/avatar-home/HomeVoiceStatus';
import HomeWhisper from '@/components/avatar-home/HomeWhisper';
import HomeIdentityPrompt from '@/components/avatar-home/HomeIdentityPrompt';
import PresenceFace from '@/components/avatar-home/PresenceFace';
import PresenceFaceStatic from '@/components/avatar-home/PresenceFaceStatic';
import EngineErrorBoundary from '@/components/errors/EngineErrorBoundary';

function AvatarHomeContent() {
  const { engineSnapshot, cameraSignals, status, loading } = useAvatar();
  const fallbackPose = useAvatarPoseFallback('neutraal');
  const pose = engineSnapshot?.pose ?? fallbackPose;
  const state = engineSnapshot?.state ?? 'idle';
  const presence = engineSnapshot?.presence;

  const cameraTracking =
    Boolean(status?.settings.cameraEnabled) &&
    cameraSignals.permission === 'granted' &&
    cameraSignals.available;

  const isStarting = loading;

  return (
    <div className="relative flex flex-col h-[100dvh] w-full overflow-hidden bg-[#04060e]">
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

      <HomePermissionBanner />

      <main className="relative flex-1 min-h-0">
        {/* Static base — always visible even if animated layer fails */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <PresenceFaceStatic pose={fallbackPose} state="idle" />
        </div>

          <EngineErrorBoundary
          name="Avatar Engine"
          fallback={<PresenceFaceStatic pose={fallbackPose} state={state} />}
        >
          <EngineErrorBoundary
            name="Presence Engine"
            fallback={null}
          >
            <div className="relative z-10 h-full">
            <PresenceFace
              pose={pose}
              state={state}
              faceX={cameraTracking ? cameraSignals.faceX : 0}
              faceY={cameraTracking ? cameraSignals.faceY : 0}
              faceDetected={cameraTracking && cameraSignals.faceDetected}
            />
            </div>
          </EngineErrorBoundary>
        </EngineErrorBoundary>

        <EngineErrorBoundary name="Voice Status" fallback={null}>
          <HomeVoiceStatus />
        </EngineErrorBoundary>

        <EngineErrorBoundary name="Presence Whispers" fallback={null}>
          <HomeWhisper />
        </EngineErrorBoundary>

        <EngineErrorBoundary name="Identity Engine" fallback={null}>
          <HomeIdentityPrompt />
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

      <EngineErrorBoundary name="Debug Overlay" fallback={null}>
        <HomeDebugOverlay />
      </EngineErrorBoundary>
    </div>
  );
}

export default function AvatarHome() {
  const fallbackPose = useAvatarPoseFallback('neutraal');

  return (
    <VoicePipelineProvider>
      <EngineErrorBoundary
        name="Avatar Home"
        fallback={
          <div className="h-[100dvh] w-full flex items-center justify-center bg-[#04060e]">
            <PresenceFaceStatic pose={fallbackPose} state="idle" />
          </div>
        }
      >
        <AvatarHomeContent />
      </EngineErrorBoundary>
    </VoicePipelineProvider>
  );
}
