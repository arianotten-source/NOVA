/** SVG-only ambient background — fallback when canvas is unavailable. */
export default function HomeBackgroundSvg() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#04060e] overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 28%, rgba(0,80,120,0.16), transparent 65%), radial-gradient(ellipse 70% 50% at 75% 85%, rgba(70,35,110,0.12), transparent)',
        }}
      />
      <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 24 }).map((_, i) => (
          <circle
            key={i}
            cx={`${10 + (i * 17) % 90}%`}
            cy={`${8 + (i * 23) % 88}%`}
            r={0.6 + (i % 3) * 0.4}
            fill="rgba(0,212,255,0.35)"
          />
        ))}
      </svg>
    </div>
  );
}
