import type { AvatarExpression } from '@/types/avatar';
import { useAvatar } from '@/context/AvatarContext';
import AvatarFace from './AvatarFace';
import { cn } from '@/lib/utils';

interface ExpressionCardProps {
  expression: AvatarExpression;
}

export default function ExpressionCard({ expression }: ExpressionCardProps) {
  const { status, setExpression } = useAvatar();
  const active = status?.activeExpressionId === expression.id;

  return (
    <article
      className={cn(
        'nova-panel p-4 flex flex-col gap-3 transition-all duration-300',
        active && 'border-nova-cyan/60 shadow-neon scale-[1.02]'
      )}
    >
      <div className="aspect-[2/1] rounded-lg bg-black border border-nova-border overflow-hidden">
        <AvatarFace
          expressionId={expression.id}
          theme={status?.settings.theme}
          variant="oled"
        />
      </div>
      <div className="flex items-start gap-2">
        <span className="text-2xl" aria-hidden>
          {expression.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-100">{expression.name}</h4>
          <p className="text-xs text-nova-muted mt-0.5">{expression.description}</p>
        </div>
      </div>
      <button
        type="button"
        className={cn('nova-btn-primary w-full min-h-[44px]', active && 'border-nova-cyan/50')}
        onClick={() => setExpression(expression.id)}
      >
        {active ? 'Actief' : 'Activeren'}
      </button>
    </article>
  );
}
