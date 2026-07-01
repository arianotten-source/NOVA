import { FUTURE_AVATAR_FEATURES } from '@/lib/avatar/catalog';

export default function FutureExtensionsPanel() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">
        Toekomstige uitbreidingen
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FUTURE_AVATAR_FEATURES.map((feature) => (
          <div key={feature} className="nova-panel p-4 opacity-80">
            <h3 className="font-medium text-gray-200 text-sm">{feature}</h3>
            <p className="text-xs text-nova-muted mt-2">Binnenkort beschikbaar</p>
          </div>
        ))}
      </div>
    </section>
  );
}
