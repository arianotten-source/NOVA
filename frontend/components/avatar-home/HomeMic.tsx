import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvatar } from '@/context/AvatarContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

export default function HomeMic() {
  const { setVoiceSignals } = useAvatar();
  const { isListening, isSupported, toggleListening, transcript } = useSpeechRecognition();

  useEffect(() => {
    setVoiceSignals({
      isListening,
      userTalking: Boolean(transcript),
      speechEnergy: transcript ? 0.7 : isListening ? 0.45 : 0.2,
    });
  }, [isListening, transcript, setVoiceSignals]);

  if (!isSupported) return null;

  return (
    <div className="flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <motion.button
        type="button"
        onClick={toggleListening}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center touch-manipulation',
          'border bg-nova-dark/50 backdrop-blur-sm',
          isListening
            ? 'border-nova-cyan shadow-[0_0_28px_rgba(0,255,245,0.3)]'
            : 'border-nova-border/50 text-nova-muted'
        )}
        animate={isListening ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1.4, repeat: isListening ? Infinity : 0 }}
        aria-label={isListening ? 'Stop luisteren' : 'Start luisteren'}
      >
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-full border border-nova-cyan/40"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
        <Mic className={cn('w-6 h-6', isListening ? 'text-nova-cyan' : '')} />
      </motion.button>
    </div>
  );
}
