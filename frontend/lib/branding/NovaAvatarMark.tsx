/** Official N.O.V.A. brand mark — eyes, brows, smile. No head, no body, no text. */

export interface NovaAvatarMarkProps {
  className?: string;
  /** 0 = closed, 1 = fully open */
  eyeOpen?: number;
  /** 0 = neutral, 1 = full smile */
  smile?: number;
  /** 0–1 blink amount (1 = closed) */
  blink?: number;
  glow?: number;
  stroke?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}

const STROKE = '#5eead4';

export function NovaAvatarMark({
  className,
  eyeOpen = 1,
  smile = 0.55,
  blink = 0,
  glow = 0.35,
  stroke = STROKE,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel = 'N.O.V.A.',
}: NovaAvatarMarkProps) {
  const eyeRy = Math.max(1.2, 13.5 * eyeOpen * (1 - blink * 0.92));
  const smileCurve = 84 + smile * 4;
  const mouthD = `M 36 77 Q 50 ${smileCurve} 64 77`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      style={{ filter: `drop-shadow(0 0 ${10 + glow * 18}px rgba(94, 234, 212, ${0.15 + glow * 0.35}))` }}
    >
      <line x1="22" y1="28" x2="38" y2="26" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity={0.95} />
      <line x1="62" y1="26" x2="78" y2="28" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity={0.95} />

      {(['left', 'right'] as const).map((side) => {
        const cx = side === 'left' ? 30 : 70;
        const cy = 42;
        return (
          <g key={side}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={15}
              ry={eyeRy}
              fill="rgba(250,252,255,0.96)"
              stroke="rgba(94,234,212,0.35)"
              strokeWidth="0.4"
            />
            {eyeRy > 2 && (
              <>
                <circle cx={cx} cy={cy} r={4} fill="#080f1a" />
                <circle cx={cx + 1.2} cy={cy - 1} r="1" fill="rgba(255,255,255,0.75)" />
              </>
            )}
          </g>
        );
      })}

      <path d={mouthD} fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default NovaAvatarMark;
