export default function NovaBrand() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className="w-8 h-8 rounded-lg border border-nova-blue/40 bg-nova-blue/10 flex items-center justify-center"
        style={{ boxShadow: '0 0 16px rgba(0, 212, 255, 0.2)' }}
      >
        <span className="text-nova-cyan text-xs font-bold">N</span>
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
