import NovaAvatarMark from '@/lib/branding/NovaAvatarMark';

export default function NovaBrand() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="w-8 h-8 rounded-xl border border-nova-cyan/30 bg-[#060a14] flex items-center justify-center overflow-hidden p-1"
        style={{ boxShadow: '0 0 16px rgba(94, 234, 212, 0.2)' }}
      >
        <NovaAvatarMark className="w-full h-full" smile={0.5} glow={0.3} aria-hidden />
      </div>
      <span
        className="text-sm font-bold tracking-[0.2em] text-nova-cyan"
        style={{ textShadow: '0 0 12px rgba(0, 255, 245, 0.35)' }}
      >
        N.O.V.A.
      </span>
    </div>
  );
}
