import type { RenderPose } from '@/lib/avatar/engine/types';
import type { AvatarStateId } from '@/lib/avatar/engine/types';

interface Props {
  pose: RenderPose;
  state?: AvatarStateId;
}

/** Pure SVG face — no framer-motion, no rAF. Mobile-safe fallback. */
export default function PresenceFaceStatic({ pose, state = 'idle' }: Props) {
  const smile = Math.max(-0.4, Math.min(1, pose.smileAmount));
  const mouthOpen = pose.mouthOpen;
  const browRaise = pose.browRaise;
  const blink = pose.isBlinking || pose.blinkAmount > 0.5;
  const eyeScale = pose.eyeScale;
  const sleepy = state === 'sleeping' || pose.expressionId === 'slaperig';
  const surprised = state === 'surprised' || pose.expressionId === 'verrast';
  const stroke = '#5eead4';

  const mouthD =
    mouthOpen > 0.18
      ? `M 42 76 a 8 ${5 + mouthOpen * 8} 0 1 0 16 0 a 8 ${5 + mouthOpen * 8} 0 1 0 -16 0`
      : surprised
        ? `M 42 76 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`
        : smile > 0.3
          ? `M 36 77 Q 50 ${84 + smile * 4} 64 77`
          : `M 40 78 L 60 78`;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none avatar-breathe">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label="N.O.V.A."
      >
        <line x1="22" y1={28 + browRaise * -3} x2="38" y2={26 + browRaise * -3} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="62" y1={26 + browRaise * -3} x2="78" y2={28 + browRaise * -3} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        {(['left', 'right'] as const).map((side) => {
          const cx = side === 'left' ? 30 : 70;
          const cy = 42;
          const rx = 15 * eyeScale;
          const ry = blink || sleepy ? 1.2 : 13.5 * eyeScale;
          return (
            <g key={side}>
              <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(250,252,255,0.96)" stroke="rgba(94,234,212,0.35)" strokeWidth="0.4" />
              {ry > 2 && (
                <>
                  <circle cx={cx} cy={cy} r={4} fill="#080f1a" />
                  <circle cx={cx + 1.2} cy={cy - 1} r="1" fill="rgba(255,255,255,0.75)" />
                </>
              )}
            </g>
          );
        })}
        <path
          d={mouthD}
          fill={mouthOpen > 0.2 ? 'rgba(8,15,26,0.92)' : 'none'}
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          className={mouthOpen > 0.12 ? 'avatar-anim-talk' : undefined}
        />
      </svg>
    </div>
  );
}
