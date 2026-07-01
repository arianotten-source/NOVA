import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import { useAvatar } from '@/context/AvatarContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useClientOnly } from '@/hooks/useClientOnly';
import { cn } from '@/lib/utils';

export default function HomeMic() {
  const client = useClientOnly();
  const { setVoiceSignals } = useAvatar();
  const { isListening, isSupported, toggleListening, transcript } = useSpeechRecognition();

  useEffect(() => {
    if (!client) return;
    setVoiceSignals({
      isListening,
      userTalking: Boolean(transcript),
      speechEnergy: transcript ? 0.7 : isListening ? 0.45 : 0.2,
    });
  }, [client, isListening, transcript, setVoiceSignals]);

  if (!client || !isSupported) return null;

  return (
    <div className="flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={toggleListening}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center touch-manipulation',
          'border bg-nova-dark/50 backdrop-blur-sm transition-shadow',
          isListening
            ? 'border-nova-cyan shadow-[0_0_28px_rgba(0,255,245,0.3)]'
            : 'border-nova-border/50 text-nova-muted'
        )}
        aria-label={isListening ? 'Stop luisteren' : 'Start luisteren'}
      >
        <Mic className={cn('w-6 h-6', isListening ? 'text-nova-cyan' : '')} />
      </button>
    </div>
  );
}
