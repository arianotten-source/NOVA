import { AVATAR_ANIMATIONS } from '@/lib/avatar/catalog';
import AnimationCard from './AnimationCard';

export default function AnimationLibrary() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">
        Animatie bibliotheek
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AVATAR_ANIMATIONS.map((animation) => (
          <AnimationCard key={animation.id} animation={animation} />
        ))}
      </div>
    </section>
  );
}
