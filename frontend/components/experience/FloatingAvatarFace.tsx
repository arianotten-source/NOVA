import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import type { RenderPose } from '@/lib/avatar/engine/types';
import type { AvatarStateId } from '@/lib/avatar/engine/types';

interface FloatingAvatarFaceProps {
  pose: RenderPose;
  state: AvatarStateId;
  faceX: number;
  faceY: number;
  faceDetected: boolean;
}

export default function FloatingAvatarFace({
  pose,
  state,
  faceX,
  faceY,
  faceDetected,
}: FloatingAvatarFaceProps) {
  const searchPhase = useRef(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const smoothX = useRef(0);
  const smoothY = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      searchPhase.current += 0.018;
      const targetX = faceDetected
        ? Math.max(-15, Math.min(15, faceX * 15))
        : Math.sin(searchPhase.current) * 8;
      const targetY = faceDetected
        ? Math.max(-10, Math.min(10, faceY * 10))
        : Math.cos(searchPhase.current * 0.7) * 5;

      smoothX.current += (targetX - smoothX.current) * 0.08;
      smoothY.current += (targetY - smoothY.current) * 0.08;
      setGaze({ x: smoothX.current, y: smoothY.current });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [faceDetected, faceX, faceY]);

  const breathe = useSpring(1, { stiffness: 40, damping: 12 });
  useEffect(() => {
    const i = setInterval(() => {
      breathe.set(1 + Math.sin(Date.now() / 2000) * 0.012);
    }, 32);
    return () => clearInterval(i);
  }, [breathe]);

  const smile = Math.max(-0.4, Math.min(1, pose.smileAmount));
  const mouthOpen = pose.mouthOpen;
  const browRaise = pose.browRaise;
  const blink = pose.isBlinking || pose.blinkAmount > 0.5;
  const eyeScale = pose.eyeScale;
  const curious = state === 'curious' || pose.expressionId === 'nieuwsgierig';
  const angry = state === 'concerned' && smile < 0;
  const sleepy = state === 'sleeping' || pose.expressionId === 'slaperig';
  const surprised = state === 'surprised' || pose.expressionId === 'verrast';

  const leftBrowY = -8 - browRaise * 12 + (curious ? -8 : 0) + (angry ? 6 : 0);
  const rightBrowY = -8 - browRaise * 12 + (angry ? 6 : 0);

  return (
    <motion.div
      className="relative w-[min(92vw,720px)] mx-auto flex items-center justify-center"
      style={{ y: breathe, scale: breathe }}
    >
      <svg
        viewBox="0 0 400 500"
        className="w-full h-auto"
        style={{
          filter: `drop-shadow(0 0 ${20 + pose.glowPulse * 12}px rgba(0, 212, 255, ${0.1 + pose.glowPulse * 0.08}))`,
        }}
        aria-label="N.O.V.A. avatar"
      >
        <motion.line
          x1="95"
          y1={120 + leftBrowY}
          x2="165"
          y2={108 + leftBrowY}
          stroke="#67e8f9"
          strokeWidth="5"
          strokeLinecap="round"
          animate={{ opacity: sleepy ? 0.55 : 1 }}
        />
        <motion.line
          x1="235"
          y1={108 + rightBrowY}
          x2="305"
          y2={120 + rightBrowY}
          stroke="#67e8f9"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {(['left', 'right'] as const).map((side) => {
          const cx = side === 'left' ? 130 : 270;
          const cy = 175 + pose.eyeOffsetY;
          const pupilCx = cx + gaze.x * 0.35 + pose.pupilOffsetX;
          const pupilCy = cy + gaze.y * 0.35 + pose.pupilOffsetY;
          const rx = 42 * eyeScale * (surprised ? 1.15 : 1);
          const ry = blink || sleepy ? 4 : 38 * eyeScale * (surprised ? 1.12 : 1);
          const pupilR = surprised ? 14 : angry ? 8 : 11;

          return (
            <g key={side}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="rgba(248,250,252,0.95)"
                stroke="rgba(103,232,249,0.5)"
                strokeWidth="2"
              />
              {!blink && !sleepy && (
                <>
                  <circle cx={pupilCx} cy={pupilCy} r={pupilR} fill="#0a1628" />
                  <circle cx={pupilCx + 4} cy={pupilCy - 3} r="3" fill="rgba(255,255,255,0.7)" />
                </>
              )}
            </g>
          );
        })}

        <motion.path
          d={
            mouthOpen > 0.2
              ? `M ${200 - 22} ${360} a 22 ${12 + mouthOpen * 20} 0 1 0 44 0 a 22 ${12 + mouthOpen * 20} 0 1 0 -44 0`
              : surprised
                ? `M ${178} ${360} a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0`
                : smile > 0.35
                  ? `M ${150} ${365} Q 200 ${395 + smile * 15} 250 ${365}`
                  : smile < -0.1
                    ? `M ${160} ${385} Q 200 ${355} 240 ${385}`
                    : `M ${165} ${372} L 235 ${372}`
          }
          fill={mouthOpen > 0.25 || surprised ? 'rgba(15,23,42,0.9)' : 'none'}
          stroke="#67e8f9"
          strokeWidth="5"
          strokeLinecap="round"
          animate={
            pose.activeAnimation === 'speaking' || mouthOpen > 0.15
              ? { scaleY: [1, 1.08, 0.95, 1.05, 1] }
              : {}
          }
          transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '200px 370px' }}
        />
      </svg>
    </motion.div>
  );
}
