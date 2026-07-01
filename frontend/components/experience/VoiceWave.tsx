import { motion } from 'framer-motion';

interface VoiceWaveProps {
  active: boolean;
  energy?: number;
  mode?: 'listen' | 'speak';
}

export default function VoiceWave({ active, energy = 0.5, mode = 'listen' }: VoiceWaveProps) {
  if (!active) return null;

  const bars = 12;
  const base = mode === 'speak' ? 0.6 : 0.35 + energy * 0.5;

  return (
    <div className="flex items-end justify-center gap-1 h-8" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-nova-cyan/80"
          animate={{
            height: [
              4 + base * 8,
              8 + base * 20 * (0.5 + Math.sin(i) * 0.5),
              4 + base * 10,
            ],
          }}
          transition={{
            duration: mode === 'speak' ? 0.35 : 0.5,
            repeat: Infinity,
            delay: i * 0.04,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
