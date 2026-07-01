import { useState } from 'react';
import { useAvatar } from '@/context/AvatarContext';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AvatarTestCenter() {
  const {
    testExpression,
    testAnimation,
    randomEmotion,
    clearOled,
    reset,
    testConnection,
    setVoiceSignals,
    voiceSignals,
    dispatchContextEvent,
  } = useAvatar();
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<void | string>, label: string) {
    setMessage(`${label}…`);
    try {
      const result = await action();
      setMessage(typeof result === 'string' ? result : `${label} voltooid`);
    } catch {
      setMessage(`${label} mislukt`);
    }
  }

  const buttons = [
    { label: 'Test expressie', action: () => testExpression() },
    { label: 'Test animatie', action: () => testAnimation() },
    { label: 'Willekeurige emotie', action: () => randomEmotion() },
    { label: 'OLED leegmaken', action: () => clearOled() },
    { label: 'OLED reset', action: () => reset() },
    { label: 'Test verbinding', action: () => testConnection() },
    { label: 'Simuleer taak voltooid', action: async () => dispatchContextEvent('task_completed') },
    { label: 'Simuleer alarm', action: async () => dispatchContextEvent('alarm') },
  ];

  return (
    <section className="nova-panel p-5 space-y-4">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Avatar Test</h2>

      <button
        type="button"
        className={cn('nova-btn-primary w-full min-h-[44px] flex items-center justify-center gap-2', voiceSignals.isListening && 'border-nova-cyan/50')}
        onClick={() =>
          setVoiceSignals({
            isListening: !voiceSignals.isListening,
            userTalking: false,
            isSpeaking: false,
            isThinking: false,
          })
        }
      >
        {voiceSignals.isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        {voiceSignals.isListening ? 'Luistermodus aan' : 'Luistermodus simuleren'}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {buttons.map(({ label, action }) => (
          <button
            key={label}
            type="button"
            className="nova-btn-primary min-h-[44px] text-left px-4 touch-manipulation"
            onClick={() => run(action, label)}
          >
            ▶ {label}
          </button>
        ))}
      </div>
      {message ? <p className="text-xs text-nova-cyan">{message}</p> : null}
    </section>
  );
}
