import { useAvatar } from '@/context/AvatarContext';
import { AUTO_EMOTION_ITEMS } from '@/lib/avatar/catalog';

export default function AutoEmotionsPanel() {
  const { status, toggleAutoEmotion } = useAvatar();
  if (!status) return null;

  return (
    <section className="nova-panel p-5 space-y-4">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">
        Automatische Emoties
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {AUTO_EMOTION_ITEMS.map(({ id, label }) => (
          <label
            key={id}
            className="flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-lg bg-nova-dark border border-nova-border cursor-pointer touch-manipulation"
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-nova-cyan"
              checked={status.autoEmotions[id]}
              onChange={(e) => toggleAutoEmotion(id, e.target.checked)}
            />
            <span className="text-sm text-gray-200">{label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
