import { useVoicePipeline } from '@/context/VoicePipelineContext';
import { cn } from '@/lib/utils';

const phaseLabel = {
  idle: 'Klaar',
  listening: 'Luisteren…',
  thinking: 'Denken…',
  speaking: 'Spreken…',
};

export default function HomeVoiceStatus() {
  const { phase, interimText, finalText, error } = useVoicePipeline();
  const display = interimText || (phase === 'speaking' ? finalText : '');

  if (!display && phase === 'idle' && !error) return null;

  return (
    <div className="absolute bottom-[18%] left-0 right-0 z-20 px-6 pointer-events-none">
      {phase !== 'idle' && (
        <p className="text-center text-[10px] uppercase tracking-widest text-nova-cyan/70 mb-2">
          {phaseLabel[phase]}
        </p>
      )}
      {display && (
        <p
          className={cn(
            'text-center text-sm leading-relaxed max-w-md mx-auto px-4 py-2 rounded-2xl',
            'bg-nova-dark/50 border border-nova-border/30 backdrop-blur-sm',
            phase === 'listening' ? 'text-nova-cyan' : 'text-gray-200'
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
