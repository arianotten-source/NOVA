import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050810]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-nova-cyan font-bold tracking-[0.35em] text-xl sm:text-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ textShadow: '0 0 24px rgba(0, 255, 245, 0.45)' }}
      >
        N.O.V.A.
      </motion.div>
      <motion.p
        className="text-nova-muted text-xs mt-3 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Neural Observation & Voice Assistant
      </motion.p>
    </motion.div>
  );
}
