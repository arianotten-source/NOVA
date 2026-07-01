import { useEffect } from 'react';
import { useAvatar } from '@/context/AvatarContext';
import AmbientBackground from '@/components/experience/AmbientBackground';
import FloatingAvatarFace from '@/components/experience/FloatingAvatarFace';
import MicControl from '@/components/experience/MicControl';
import NovaBrand from '@/components/experience/NovaBrand';
import OverflowMenu from '@/components/experience/OverflowMenu';
import PersonalityBubble from '@/components/experience/PersonalityBubble';

export default function AvatarExperience() {
  const { engineSnapshot, cameraSignals, enableCamera, voiceSignals } = useAvatar();
  const pose = engineSnapshot?.pose;
  const state = engineSnapshot?.state ?? 'idle';

  useEffect(() => {
    enableCamera();
  }, [enableCamera]);

  if (!pose) {
    return (
      <div className="flex-1 flex items-center justify-center text-nova-muted text-sm">
        N.O.V.A. wordt wakker…
      </div>
    );
  }

  return (
    <>
      <AmbientBackground />

      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <NovaBrand />
        <OverflowMenu />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-6 max-h-[72vh]">
          <FloatingAvatarFace
            pose={pose}
            state={state}
            faceX={cameraSignals.faceX}
            faceY={cameraSignals.faceY}
            faceDetected={cameraSignals.faceDetected}
          />
          <PersonalityBubble />
        </div>
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
