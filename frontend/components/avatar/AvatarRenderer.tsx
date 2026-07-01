import type { RenderPose } from '@/lib/avatar/engine/types';
import type { AvatarLevel, AvatarTheme } from '@/types/avatar';
import { getFaceGeometry } from '@/lib/avatar/faceGeometry';
import { cn } from '@/lib/utils';

interface AvatarRendererProps {
  pose: RenderPose;
  theme?: AvatarTheme;
  blinkFrequency?: AvatarLevel;
  intensity?: AvatarLevel;
  variant?: 'live' | 'oled';
  cleared?: boolean;
  className?: string;
}

function mouthPath(
  smile: number,
  open: number,
  cx: number,
  cy: number,
  scale: number
): string {
  if (open > 0.25) {
    const h = 6 + open * 14 * scale;
    return `M ${cx - 10 * scale} ${cy} a ${10 * scale} ${h} 0 1 0 ${20 * scale} 0 a ${10 * scale} ${h} 0 1 0 ${-20 * scale} 0`;
  }
  if (smile > 0.55) {
    return `M ${cx - 24 * scale} ${cy + 2 * scale} Q ${cx} ${cy + (16 + smile * 8) * scale} ${cx + 24 * scale} ${cy + 2 * scale}`;
  }
  if (smile < -0.15) {
    return `M ${cx - 18 * scale} ${cy + 12 * scale} Q ${cx} ${cy - 4 * scale} ${cx + 18 * scale} ${cy + 12 * scale}`;
  }
  if (Math.abs(smile) < 0.12) {
    return `M ${cx - 16 * scale} ${cy + 8 * scale} L ${cx + 16 * scale} ${cy + 8 * scale}`;
  }
  return `M ${cx - 20 * scale} ${cy + 4 * scale} Q ${cx} ${cy + (10 + smile * 6) * scale} ${cx + 20 * scale} ${cy + 4 * scale}`;
}

export default function AvatarRenderer({
  pose,
  theme = 'classic',
  blinkFrequency: _blinkFrequency = 'normal',
  intensity = 'normal',
  variant = 'live',
  cleared = false,
  className,
}: AvatarRendererProps) {
  const geo = getFaceGeometry(pose.expressionId);
  const mono = variant === 'oled';
  const scale = mono ? 0.55 : 1;
  const cx = mono ? 64 : 100;
  const cy = mono ? 32 : 100;
  const intensityScale = intensity === 'strong' ? 1.08 : intensity === 'low' ? 0.92 : 1;

  const blinkScaleY = pose.isBlinking || pose.blinkAmount > 0.5 ? 0.08 : 1;
  const eyeRx = (geo.leftEye === 'wide' ? 12 : 10) * scale * pose.eyeScale;
  const eyeRy = (geo.leftEye === 'wide' ? 14 : 10) * scale * pose.eyeScale * blinkScaleY;

  const transform = `translate(${pose.headTilt * 0.3}px, ${pose.headNod * 0.2}px) rotate(${pose.headTilt * 0.15}deg) scale(${intensityScale})`;

  const faceFill =
    theme === 'robot'
      ? mono ? '#1e293b' : 'url(#novaFaceRobot)'
      : theme === 'minimal'
        ? mono ? '#0f172a' : '#111827'
        : theme === 'neo'
          ? 'url(#novaFaceNeo)'
          : 'url(#novaFaceClassic)';

  if (cleared) {
    return (
      <svg viewBox={mono ? '0 0 128 64' : '0 0 200 200'} className={cn('w-full h-full', className)} aria-hidden>
        <rect width="100%" height="100%" fill="#000" />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#475569" fontSize={mono ? 8 : 12}>
          OLED leeg
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox={mono ? '0 0 128 64' : '0 0 200 200'}
      className={cn('w-full h-full avatar-breathe', className)}
      style={{ filter: pose.glowPulse > 0 ? `drop-shadow(0 0 ${8 + pose.glowPulse * 12}px rgba(0,255,245,${0.2 + pose.glowPulse * 0.3}))` : undefined }}
      aria-hidden
    >
      {!mono && (
        <defs>
          <radialGradient id="novaFaceClassic" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0a1628" />
          </radialGradient>
          <radialGradient id="novaFaceNeo" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>
          <linearGradient id="novaFaceRobot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
      )}

      <g style={{ transform, transformOrigin: `${cx}px ${cy}px` }}>
        <circle
          cx={cx}
          cy={cy}
          r={mono ? 28 : 78}
          fill={faceFill}
          stroke={mono ? '#334155' : 'rgba(0, 229, 255, 0.25)'}
          strokeWidth={mono ? 1 : 2}
        />

        <g transform={`translate(${pose.eyeOffsetX}, ${pose.eyeOffsetY})`}>
          <g style={{ transform: `translateY(${geo.browTilt + pose.browRaise * 8}px)` }}>
            <line x1={cx - (mono ? 22 : 38)} y1={cy - (mono ? 14 : 38)} x2={cx - (mono ? 10 : 18)} y2={cy - (mono ? 16 : 42)} stroke="#67e8f9" strokeWidth={mono ? 1.5 : 2.5} strokeLinecap="round" />
            <line x1={cx + (mono ? 10 : 18)} y1={cy - (mono ? 16 : 42)} x2={cx + (mono ? 22 : 38)} y2={cy - (mono ? 14 : 38)} stroke="#67e8f9" strokeWidth={mono ? 1.5 : 2.5} strokeLinecap="round" />
          </g>

          {geo.leftEye === 'heart' || geo.rightEye === 'heart' ? (
            <>
              <text x={cx - (mono ? 12 : 32)} y={cy - (mono ? 2 : 6)} textAnchor="middle" fontSize={16 * scale}>♥</text>
              <text x={cx + (mono ? 12 : 32)} y={cy - (mono ? 2 : 6)} textAnchor="middle" fontSize={16 * scale}>♥</text>
            </>
          ) : geo.leftEye === 'laugh' ? (
            <>
              <path d={`M ${cx - (mono ? 26 : 46)} ${cy - (mono ? 4 : 10)} Q ${cx - (mono ? 12 : 32)} ${cy + (mono ? 2 : 6)} ${cx - (mono ? 2 : 18)} ${cy - (mono ? 4 : 10)}`} fill="none" stroke="#67e8f9" strokeWidth="3" />
              <path d={`M ${cx + (mono ? 2 : 18)} ${cy - (mono ? 4 : 10)} Q ${cx + (mono ? 12 : 32)} ${cy + (mono ? 2 : 6)} ${cx + (mono ? 26 : 46)} ${cy - (mono ? 4 : 10)}`} fill="none" stroke="#67e8f9" strokeWidth="3" />
            </>
          ) : (
            <>
              <ellipse cx={cx - (mono ? 12 : 32) + pose.pupilOffsetX} cy={cy - (mono ? 4 : 10) + pose.pupilOffsetY} rx={eyeRx} ry={eyeRy} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <ellipse cx={cx + (mono ? 12 : 32) + pose.pupilOffsetX} cy={cy - (mono ? 4 : 10) + pose.pupilOffsetY} rx={eyeRx} ry={eyeRy} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              {geo.leftEye === 'closed' || pose.isBlinking ? null : (
                <circle cx={cx - (mono ? 12 : 32) + pose.pupilOffsetX * 0.5} cy={cy - (mono ? 4 : 10) + pose.pupilOffsetY * 0.5} r={3 * scale} fill="#0f172a" />
              )}
              {geo.rightEye === 'closed' ? null : (
                <circle cx={cx + (mono ? 12 : 32) + pose.pupilOffsetX * 0.5} cy={cy - (mono ? 4 : 10) + pose.pupilOffsetY * 0.5} r={3 * scale} fill="#0f172a" />
              )}
            </>
          )}
        </g>

        <path
          className="avatar-mouth"
          d={mouthPath(pose.smileAmount, pose.mouthOpen, cx, cy + (mono ? 10 : 28), scale)}
          fill={pose.mouthOpen > 0.25 ? mono ? '#cbd5e1' : 'rgba(15,23,42,0.85)' : 'none'}
          stroke={mono ? '#e2e8f0' : '#67e8f9'}
          strokeWidth={mono ? 2 : 3.5}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
