import { useAvatar } from '@/context/AvatarContext';
import AmbientBackground from '@/components/experience/AmbientBackground';
import CameraConsent from '@/components/experience/CameraConsent';
import FloatingAvatarFace from '@/components/experience/FloatingAvatarFace';
import MicControl from '@/components/experience/MicControl';
import NovaBrand from '@/components/experience/NovaBrand';
import OverflowMenu from '@/components/experience/OverflowMenu';
import PersonalityBubble from '@/components/experience/PersonalityBubble';

export default function AvatarExperience() {
  const { engineSnapshot, cameraSignals, voiceSignals, status } = useAvatar();
  const pose = engineSnapshot?.pose;
  const state = engineSnapshot?.state ?? 'idle';
  const presence = engineSnapshot?.presence;
  const cameraAllowed = status?.settings.cameraEnabled && cameraSignals.permission === 'granted';

  if (!pose) {
    return (
      <div className="flex-1 flex items-center justify-center text-nova-muted text-sm">
        N.O.V.A. wordt wakker…
      </div>
    );
  }

  return (
    <>
      <AmbientBackground glowIntensity={presence?.energy ?? 0.5} />

      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <NovaBrand />
        <OverflowMenu />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 max-h-[72vh]">
          <FloatingAvatarFace
            pose={pose}
            state={state}
            faceX={cameraAllowed ? cameraSignals.faceX : 0}
            faceY={cameraAllowed ? cameraSignals.faceY : 0}
            faceDetected={Boolean(cameraAllowed && cameraSignals.faceDetected)}
          />
          <PersonalityBubble />
        </div>
        {!status?.settings.cameraEnabled && <CameraConsent />}
      </main>

      <footer className="relative z-10">
        <MicControl />
      </footer>

      {voiceSignals.isListening && (
        <div className="sr-only" aria-live="polite">
          Luisteren…
        </div>
      )}
    </>
  );
}
