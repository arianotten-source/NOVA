import { useAvatar } from '@/context/AvatarContext';
import AvatarStatusCards from '@/components/avatar/AvatarStatusCards';
import LiveAvatar from '@/components/avatar/LiveAvatar';
import ExpressionLibrary from '@/components/avatar/ExpressionLibrary';
import AnimationLibrary from '@/components/avatar/AnimationLibrary';
import AvatarTestCenter from '@/components/avatar/AvatarTestCenter';
import AutoEmotionsPanel from '@/components/avatar/AutoEmotionsPanel';
import HardwareStatusPanel from '@/components/avatar/HardwareStatusPanel';
import AvatarSettingsPanel from '@/components/avatar/AvatarSettingsPanel';
import FutureExtensionsPanel from '@/components/avatar/FutureExtensionsPanel';

export default function Avatar() {
  const { loading } = useAvatar();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-nova-muted text-sm">Avatar laden...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 w-full min-w-0">
        <header>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <span aria-hidden>🙂</span> N.O.V.A. Avatar
          </h1>
          <p className="text-nova-muted text-sm mt-1">
            Persoonlijkheid • Expressies • Animaties
          </p>
        </header>

        <AvatarStatusCards />

        <section className="nova-panel p-6 flex justify-center">
          <LiveAvatar />
        </section>

        <ExpressionLibrary />
        <AnimationLibrary />
        <AvatarTestCenter />
        <AutoEmotionsPanel />
        <HardwareStatusPanel />
        <AvatarSettingsPanel />
        <FutureExtensionsPanel />
      </div>
    </div>
  );
}
