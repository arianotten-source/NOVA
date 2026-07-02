import { useEffect, useRef, useState } from 'react';
import { useClientOnly } from '@/hooks/useClientOnly';
import { createSafeRafLoop } from '@/lib/safeRaf';
import type { RenderPose } from '@/lib/avatar/engine/types';
import type { AvatarStateId } from '@/lib/avatar/engine/types';
import PresenceFaceStatic from './PresenceFaceStatic';

interface PresenceFaceProps {
  pose: RenderPose;
  state: AvatarStateId;
  faceX: number;
  faceY: number;
  faceDetected: boolean;
}

export default function PresenceFace(props: PresenceFaceProps) {
  const client = useClientOnly();
  if (!client) {
    return <PresenceFaceStatic pose={props.pose} state={props.state} />;
  }
  return <PresenceFaceAnimated {...props} />;
}

function PresenceFaceAnimated({
  pose,
  state,
  faceX,
  faceY,
  faceDetected,
}: PresenceFaceProps) {
  const search = useRef(0);
  const frame = useRef(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const sx = useRef(0);
  const sy = useRef(0);
  const micro = pose.microAnim;

  useEffect(() => {
    const stop = createSafeRafLoop(() => {
      search.current += 0.015;
      const mx = micro?.lookX ?? 0;
      const my = micro?.lookY ?? 0;
      const tx = faceDetected
        ? Math.max(-12, Math.min(12, faceX * 12)) + mx * 0.4
        : Math.sin(search.current) * 6 + mx * 0.4;
      const ty = faceDetected
        ? Math.max(-8, Math.min(8, faceY * 8)) + my * 0.4
        : Math.cos(search.current * 0.65) * 4 + my * 0.4;
      sx.current += (tx - sx.current) * 0.07;
      sy.current += (ty - sy.current) * 0.07;
      frame.current += 1;
      if (frame.current % 2 === 0) {
        setGaze({ x: sx.current, y: sy.current });
      }
    });
    return stop;
  }, [faceDetected, faceX, faceY, micro?.lookX, micro?.lookY]);

  const smile = Math.max(-0.4, Math.min(1, pose.smileAmount));
  const mouthOpen = pose.mouthOpen;
  const browRaise = pose.browRaise;
  const blink = pose.isBlinking || pose.blinkAmount > 0.5;
  const eyeScale = pose.eyeScale;
  const sleepy = state === 'sleeping' || pose.expressionId === 'slaperig';
  const surprised = state === 'surprised' || pose.expressionId === 'verrast';
  const curious = state === 'curious' || pose.expressionId === 'nieuwsgierig';
  const concerned = state === 'concerned' && smile < 0;

  const eyeOpenL = micro?.eyeOpenLeft ?? 1;
  const eyeOpenR = micro?.eyeOpenRight ?? 1;
  const stroke = '#5eead4';
  const glow = 0.1 + pose.glowPulse * 0.1 + (micro?.glowIntensity ?? 0.12) * 0.5;
  const speaking = mouthOpen > 0.12 || pose.activeAnimation === 'speaking';

  const mouthD =
    mouthOpen > 0.18 || pose.activeAnimation === 'speaking'
      ? `M ${50 - 8} ${76} a 8 ${5 + mouthOpen * 8} 0 1 0 16 0 a 8 ${5 + mouthOpen * 8} 0 1 0 -16 0`
      : surprised
        ? `M ${42} ${76} a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`
        : smile > 0.3
          ? `M ${36} ${77} Q 50 ${84 + smile * 4} 64 ${77}`
          : smile < -0.1
            ? `M ${38} ${82} Q 50 ${74} 62 ${82}`
            : `M ${40} ${78} L 60 ${78}`;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none avatar-breathe">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: `drop-shadow(0 0 ${12 + pose.glowPulse * 16}px rgba(94, 234, 212, ${glow}))` }}
        aria-label="N.O.V.A."
      >
        <line
          x1="22"
          y1={28 + browRaise * -3 + (micro?.browLeftY ?? 0) * 0.15 + (curious ? -2 : 0)}
          x2="38"
          y2={26 + browRaise * -3 + (micro?.browLeftY ?? 0) * 0.15 + (concerned ? 2 : 0)}
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={sleepy ? 0.5 : 0.95}
        />
        <line
          x1="62"
          y1={26 + browRaise * -3 + (micro?.browRightY ?? 0) * 0.15 + (concerned ? 2 : 0)}
          x2="78"
          y2={28 + browRaise * -3 + (micro?.browRightY ?? 0) * 0.15}
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {(['left', 'right'] as const).map((side) => {
          const cx = side === 'left' ? 30 : 70;
          const cy = 42 + pose.eyeOffsetY * 0.05;
          const px = cx + gaze.x * 0.12 + pose.pupilOffsetX * 0.08;
          const py = cy + gaze.y * 0.12 + pose.pupilOffsetY * 0.08;
          const open = side === 'left' ? eyeOpenL : eyeOpenR;
          const rx = 15 * eyeScale * (surprised ? 1.1 : 1);
          const ry = blink || sleepy ? 1.2 : 13.5 * eyeScale * open * (surprised ? 1.08 : 1);
          const pr = (surprised ? 5 : concerned ? 3 : 4) * (micro?.pupilScale ?? 1);

          return (
            <g key={side}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="rgba(250,252,255,0.96)"
                stroke="rgba(94,234,212,0.35)"
                strokeWidth="0.4"
              />
              {ry > 2 && (
                <>
                  <circle cx={px} cy={py} r={pr} fill="#080f1a" />
                  <circle cx={px + 1.2} cy={py - 1} r="1" fill="rgba(255,255,255,0.75)" />
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
          className={speaking ? 'avatar-anim-talk' : undefined}
        />
      </svg>
    </div>
  );
}
