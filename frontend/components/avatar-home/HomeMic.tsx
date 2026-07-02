import { Mic, MicOff } from 'lucide-react';
import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { VoiceState } from '@/lib/voice/v2/types';
import { useClientOnly } from '@/hooks/useClientOnly';
import { cn } from '@/lib/utils';

export default function HomeMic() {
  const client = useClientOnly();
  const { voiceState, micSupported, toggleListening } = useVoicePipeline();

  const isListening = voiceState === VoiceState.LISTENING;
  const isThinking = voiceState === VoiceState.THINKING || voiceState === VoiceState.PROCESSING;
  const disabled = voiceState === VoiceState.SPEAKING;

  if (!client || !micSupported) return null;

  return (
    <div className="flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={() => void toggleListening()}
        disabled={disabled}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center touch-manipulation',
          'border bg-nova-dark/50 backdrop-blur-sm transition-shadow',
          disabled && 'opacity-40 pointer-events-none',
          isListening
            ? 'border-nova-cyan shadow-[0_0_28px_rgba(0,255,245,0.3)]'
            : isThinking
              ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
              : 'border-nova-border/50 text-nova-muted'
        )}
        aria-label={
          isListening ? 'Stop luisteren' : isThinking ? 'Onderbreek en spreek opnieuw' : 'Start luisteren'
        }
      >
        {disabled ? (
          <MicOff className="w-6 h-6 text-nova-muted" />
        ) : (
          <Mic className={cn('w-6 h-6', isListening ? 'text-nova-cyan' : isThinking ? 'text-amber-300' : '')} />
        )}
      </button>
    </div>
  );
}
