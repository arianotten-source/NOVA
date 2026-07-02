import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { VoiceState } from '@/lib/voice/v2/types';
import { cn } from '@/lib/utils';

const STATE_LABEL: Partial<Record<VoiceState, string>> = {
  [VoiceState.LISTENING]: 'Luisteren…',
  [VoiceState.PROCESSING]: 'Verwerken…',
  [VoiceState.THINKING]: 'Nadenken…',
  [VoiceState.SPEAKING]: 'Spreken…',
  [VoiceState.WAITING]: 'Even rust…',
};

export default function HomeVoiceStatus() {
  const { voiceState, interimText, finalText, error, thinkingSnapshot, snapshot } = useVoicePipeline();
  const display =
    interimText ||
    (voiceState === VoiceState.SPEAKING ? finalText : '') ||
    snapshot.displayText ||
    (voiceState === VoiceState.THINKING || voiceState === VoiceState.PROCESSING
      ? thinkingSnapshot.preface
      : '');

  if (!display && voiceState === VoiceState.IDLE && !error) return null;

  const label = STATE_LABEL[voiceState];

  return (
    <div className="absolute bottom-[18%] left-0 right-0 z-20 px-6 pointer-events-none">
      {label && (
        <p className="text-center text-[10px] uppercase tracking-widest text-nova-cyan/70 mb-2">{label}</p>
      )}
      {display && (
        <p
          className={cn(
            'text-center text-sm leading-relaxed max-w-md mx-auto px-4 py-2 rounded-2xl',
            'bg-nova-dark/50 border border-nova-border/30 backdrop-blur-sm',
            voiceState === VoiceState.LISTENING ? 'text-nova-cyan' : 'text-gray-200'
          )}
        >
          {display}
        </p>
      )}
      {error && (
        <p className="text-center text-xs text-amber-400/90 mt-2 max-w-sm mx-auto">{error}</p>
      )}
    </div>
  );
}
