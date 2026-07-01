import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatar } from '@/context/AvatarContext';

export default function PersonalityBubble() {
  const { engineSnapshot, cameraSignals, voiceSignals } = useAvatar();
  const [message, setMessage] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState(Date.now());

  useEffect(() => {
    if (cameraSignals.faceDetected) {
      setLastSeen(Date.now());
      if (message === 'Welkom terug.') return;
    }
  }, [cameraSignals.faceDetected, message]);

  useEffect(() => {
    const id = setInterval(() => {
      const idle = Date.now() - lastSeen;
      const state = engineSnapshot?.state;

      if (cameraSignals.faceDetected && idle < 3000 && !message) {
        setMessage('Welkom terug.');
        setTimeout(() => setMessage(null), 4000);
        return;
      }

      if (!voiceSignals.isListening && !voiceSignals.isSpeaking && state === 'idle') {
        if (idle > 120000 && !message) {
          setMessage('Ik wacht rustig.');
          setTimeout(() => setMessage(null), 5000);
        } else if (idle > 45000 && idle < 50000 && !message) {
          setMessage('🙂 Ik ben hier wanneer je me nodig hebt.');
          setTimeout(() => setMessage(null), 5000);
        }
      }
    }, 5000);
    return () => clearInterval(id);
  }, [engineSnapshot?.state, cameraSignals.faceDetected, voiceSignals, lastSeen, message]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.p
          key={message}
          className="text-center text-sm text-nova-cyan/90 px-6 max-w-md mx-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          style={{ textShadow: '0 0 12px rgba(0,255,245,0.25)' }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
