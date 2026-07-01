import { AnimatePresence, motion } from 'framer-motion';
import { useAvatar } from '@/context/AvatarContext';
import { moodVectorLabel } from '@/lib/avatar/presence/MoodEngine';

export default function PersonalityBubble() {
  const { engineSnapshot } = useAvatar();
  const presence = engineSnapshot?.presence;
  const message = presence?.whisper ?? null;
  const moodLabel = presence ? moodVectorLabel(presence.moodVector) : null;

  return (
    <div className="flex flex-col items-center gap-2 min-h-[3rem]">
      <AnimatePresence mode="wait">
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
      {moodLabel && !message && (
        <p className="text-[10px] text-nova-muted/70 tracking-wide">{moodLabel}</p>
      )}
    </div>
  );
}
