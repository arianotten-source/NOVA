import { motion, AnimatePresence } from 'framer-motion';
import { useAvatar } from '@/context/AvatarContext';
import { useIdentityOptional } from '@/context/IdentityContext';

export default function HomeWhisper() {
  const { engineSnapshot } = useAvatar();
  const { snapshot, careAlert } = useIdentityOptional();
  const text =
    careAlert ?? snapshot.greeting ?? engineSnapshot?.presence?.whisper;

  return (
    <div className="absolute bottom-[22%] left-0 right-0 px-8 pointer-events-none z-10">
      <AnimatePresence mode="wait">
        {text ? (
          <motion.p
            key={text}
            className="text-center text-sm text-nova-cyan/80 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textShadow: '0 0 20px rgba(0,255,245,0.2)' }}
          >
            {text}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
