export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#050810] h-[100dvh] w-full">
      <div
        className="text-nova-cyan font-bold tracking-[0.35em] text-xl sm:text-2xl animate-pulse"
        style={{ textShadow: '0 0 24px rgba(0, 255, 245, 0.45)' }}
      >
        N.O.V.A.
      </div>
      <p className="text-nova-muted text-xs mt-3 tracking-widest uppercase">
        Neural Observation & Voice Assistant
      </p>
    </div>
  );
}
