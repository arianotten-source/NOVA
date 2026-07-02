import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvatar } from '@/context/AvatarContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import VoiceWave from './VoiceWave';
import { cn } from '@/lib/utils';

export default function MicControl() {
  const navigate = useNavigate();
  const { setVoiceSignals, voiceSignals } = useAvatar();
  const { isListening, isSupported, toggleListening, transcript } = useSpeechRecognition();

  useEffect(() => {
    setVoiceSignals({
      state: isListening ? 'LISTENING' : 'IDLE',
      isListening,
      userTalking: Boolean(transcript),
      speechEnergy: transcript ? 0.65 : 0.35,
      isSpeaking: false,
      isThinking: false,
      viseme: 'neutral',
      emotion: 'neutral',
    });
  }, [isListening, transcript, setVoiceSignals]);

  const active = isListening;

  return (
    <div className="flex flex-col items-center gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <VoiceWave
        active={active}
        energy={voiceSignals.speechEnergy}
        mode={voiceSignals.isSpeaking ? 'speak' : 'listen'}
      />

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="min-w-[44px] min-h-[44px] rounded-full border border-nova-border/50 bg-nova-dark/50 text-nova-muted flex items-center justify-center touch-manipulation"
          aria-label="Tekstinvoer"
        >
          <Keyboard className="w-5 h-5" />
        </button>

        <motion.button
          type="button"
          onClick={() => isSupported && toggleListening()}
          disabled={!isSupported}
          className={cn(
            'relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center touch-manipulation',
            'border-2 bg-nova-dark/60 backdrop-blur-md',
            active ? 'border-nova-cyan shadow-[0_0_32px_rgba(0,255,245,0.35)]' : 'border-nova-blue/40'
          )}
          animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
        >
          {active && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-nova-cyan/50"
              animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          {active ? (
            <Mic className="w-7 h-7 text-nova-cyan" />
          ) : (
            <MicOff className="w-7 h-7 text-nova-muted" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
