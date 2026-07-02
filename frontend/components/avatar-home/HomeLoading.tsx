export default function HomeLoading({ message = 'N.O.V.A. wordt gestart...' }: { message?: string }) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#04060e]/35 backdrop-blur-[2px] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-nova-cyan/30 border-t-nova-cyan animate-spin"
        aria-hidden
      />
      <p className="text-sm text-nova-cyan tracking-wide" style={{ textShadow: '0 0 12px rgba(0,255,245,0.25)' }}>
        {message}
      </p>
    </div>
  );
}
