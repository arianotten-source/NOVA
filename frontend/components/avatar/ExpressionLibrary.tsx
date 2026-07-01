import { AVATAR_EXPRESSIONS } from '@/lib/avatar/catalog';
import ExpressionCard from './ExpressionCard';

export default function ExpressionLibrary() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">
          Expressie bibliotheek
        </h2>
        <span className="text-xs text-nova-muted">{AVATAR_EXPRESSIONS.length} expressies</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {AVATAR_EXPRESSIONS.map((expression) => (
          <ExpressionCard key={expression.id} expression={expression} />
        ))}
      </div>
    </section>
  );
}
