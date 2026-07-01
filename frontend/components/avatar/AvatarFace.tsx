import { useMemo } from 'react';
import type { AvatarAnimationId, AvatarExpressionId, AvatarLevel, AvatarTheme } from '@/types/avatar';
import { getFaceGeometry, type EyeStyle, type MouthStyle } from '@/lib/avatar/faceGeometry';
import { cn } from '@/lib/utils';

interface AvatarFaceProps {
  expressionId: AvatarExpressionId;
  animationId?: AvatarAnimationId;
  theme?: AvatarTheme;
  blinkFrequency?: AvatarLevel;
  intensity?: AvatarLevel;
  variant?: 'live' | 'oled';
  cleared?: boolean;
  className?: string;
}

function mouthPath(style: MouthStyle, cx: number, cy: number, scale: number): string {
  switch (style) {
    case 'bigSmile':
      return `M ${cx - 28 * scale} ${cy} Q ${cx} ${cy + 22 * scale} ${cx + 28 * scale} ${cy}`;
    case 'smile':
      return `M ${cx - 22 * scale} ${cy + 2 * scale} Q ${cx} ${cy + 16 * scale} ${cx + 22 * scale} ${cy + 2 * scale}`;
    case 'smileSoft':
      return `M ${cx - 18 * scale} ${cy + 4 * scale} Q ${cx} ${cy + 12 * scale} ${cx + 18 * scale} ${cy + 4 * scale}`;
    case 'frown':
      return `M ${cx - 20 * scale} ${cy + 14 * scale} Q ${cx} ${cy - 4 * scale} ${cx + 20 * scale} ${cy + 14 * scale}`;
    case 'o':
      return `M ${cx} ${cy - 8 * scale} a ${10 * scale} ${12 * scale} 0 1 0 0.01 0`;
    case 'skew':
      return `M ${cx - 18 * scale} ${cy + 8 * scale} Q ${cx + 4 * scale} ${cy + 14 * scale} ${cx + 20 * scale} ${cy}`;
    default:
      return `M ${cx - 18 * scale} ${cy + 8 * scale} L ${cx + 18 * scale} ${cy + 8 * scale}`;
  }
}

function Eye({
  x,
  y,
  style,
  scale,
  mono,
}: {
  x: number;
  y: number;
  style: EyeStyle;
  scale: number;
  mono: boolean;
}) {
  const fill = mono ? '#e2e8f0' : '#f8fafc';
  const stroke = mono ? '#94a3b8' : '#cbd5e1';

  if (style === 'closed' || style === 'laugh') {
    return (
      <path
        d={`M ${x - 14 * scale} ${y} Q ${x} ${y + (style === 'laugh' ? 10 : 6) * scale} ${x + 14 * scale} ${y}`}
        fill="none"
        stroke={mono ? fill : '#67e8f9'}
        strokeWidth={3 * scale}
        strokeLinecap="round"
      />
    );
  }

  if (style === 'half') {
    return (
      <ellipse cx={x} cy={y + 2 * scale} rx={12 * scale} ry={5 * scale} fill={fill} stroke={stroke} strokeWidth={1.5} />
    );
  }

  if (style === 'heart') {
    return (
      <text x={x} y={y + 6 * scale} textAnchor="middle" fontSize={18 * scale}>
        ♥
      </text>
    );
  }

  const ry = style === 'wide' ? 14 * scale : 10 * scale;
  const rx = style === 'wide' ? 12 * scale : 10 * scale;

  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={1.5} />;
}

export default function AvatarFace({
  expressionId,
  animationId = 'idle',
  theme = 'classic',
  blinkFrequency = 'normal',
  intensity = 'normal',
  variant = 'live',
  cleared = false,
  className,
}: AvatarFaceProps) {
  const geo = useMemo(() => getFaceGeometry(expressionId), [expressionId]);
  const mono = variant === 'oled';
  const scale = mono ? 0.55 : 1;
  const cx = mono ? 64 : 100;
  const cy = mono ? 32 : 100;

  const blinkClass =
    blinkFrequency === 'high'
      ? 'avatar-blink-fast'
      : blinkFrequency === 'low'
        ? 'avatar-blink-slow'
        : 'avatar-blink';

  const animClass = {
    idle: 'avatar-anim-idle',
    knipperen: 'avatar-anim-blink',
    praten: 'avatar-anim-talk',
    denken: 'avatar-anim-think',
    luisteren: 'avatar-anim-listen',
    lachen: 'avatar-anim-laugh',
    slapen: 'avatar-anim-sleep',
    opstarten: 'avatar-anim-boot',
    verbinden: 'avatar-anim-connect',
    offline: 'avatar-anim-offline',
    blij: 'avatar-anim-happy',
    verdrietig: 'avatar-anim-sad',
  }[animationId];

  const intensityScale = intensity === 'strong' ? 1.08 : intensity === 'low' ? 0.92 : 1;

  const faceFill =
    theme === 'robot'
      ? mono
        ? '#1e293b'
        : 'url(#novaFaceRobot)'
      : theme === 'minimal'
        ? mono
          ? '#0f172a'
          : '#111827'
        : theme === 'neo'
          ? 'url(#novaFaceNeo)'
          : 'url(#novaFaceClassic)';

  if (cleared) {
    return (
      <svg
        viewBox={mono ? '0 0 128 64' : '0 0 200 200'}
        className={cn('w-full h-full', className)}
        aria-hidden
      >
        <rect width="100%" height="100%" fill={mono ? '#000' : '#0a0f1a'} />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={mono ? '#334155' : '#475569'}
          fontSize={mono ? 8 : 12}
        >
          OLED leeg
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox={mono ? '0 0 128 64' : '0 0 200 200'}
      className={cn('w-full h-full', animClass, className)}
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
          <filter id="novaGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      <g className="avatar-breathe" style={{ transformOrigin: `${cx}px ${cy}px`, transform: `scale(${intensityScale})` }}>
        <circle
          cx={cx}
          cy={cy}
          r={mono ? 28 : 78}
          fill={faceFill}
          stroke={mono ? '#334155' : 'rgba(0, 229, 255, 0.25)'}
          strokeWidth={mono ? 1 : 2}
          filter={!mono ? 'url(#novaGlow)' : undefined}
        />

        <g className={blinkClass}>
          <g style={{ transform: `translateY(${geo.browTilt * scale}px)` }}>
            <line
              x1={cx - (mono ? 22 : 38)}
              y1={cy - (mono ? 14 : 38)}
              x2={cx - (mono ? 10 : 18)}
              y2={cy - (mono ? 16 : 42)}
              stroke={mono ? '#64748b' : '#67e8f9'}
              strokeWidth={mono ? 1.5 : 2.5}
              strokeLinecap="round"
            />
            <line
              x1={cx + (mono ? 10 : 18)}
              y1={cy - (mono ? 16 : 42)}
              x2={cx + (mono ? 22 : 38)}
              y2={cy - (mono ? 14 : 38)}
              stroke={mono ? '#64748b' : '#67e8f9'}
              strokeWidth={mono ? 1.5 : 2.5}
              strokeLinecap="round"
            />
          </g>

          <Eye x={cx - (mono ? 12 : 32)} y={cy - (mono ? 4 : 10)} style={geo.leftEye} scale={scale} mono={mono} />
          <Eye x={cx + (mono ? 12 : 32)} y={cy - (mono ? 4 : 10)} style={geo.rightEye} scale={scale} mono={mono} />
        </g>

        <path
          className="avatar-mouth"
          d={mouthPath(geo.mouth, cx, cy + (mono ? 10 : 28), scale)}
          fill="none"
          stroke={mono ? '#e2e8f0' : '#67e8f9'}
          strokeWidth={mono ? 2 : 3.5}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
