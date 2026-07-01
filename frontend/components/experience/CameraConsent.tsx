import { useAvatar } from '@/context/AvatarContext';
import { motion } from 'framer-motion';
import { Camera, Shield } from 'lucide-react';

export default function CameraConsent() {
  const { cameraSignals, enableCamera, updateSettings } = useAvatar();

  if (cameraSignals.permission === 'granted') return null;
  if (cameraSignals.permission === 'denied') {
    return (
      <p className="text-center text-xs text-nova-muted px-6 max-w-md mx-auto">
        Camera geweigerd. Schakel toegang in via instellingen om oogcontact te gebruiken.
      </p>
    );
  }

  return (
    <motion.div
      className="mx-4 mb-2 p-4 rounded-2xl border border-nova-border/60 bg-nova-dark/70 backdrop-blur-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-nova-blue/10 border border-nova-blue/30 flex items-center justify-center shrink-0">
          <Camera className="w-5 h-5 text-nova-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-100">Oogcontact inschakelen?</p>
          <p className="text-xs text-nova-muted mt-1 leading-relaxed">
            N.O.V.A. kan je gezicht volgen voor natuurlijk oogcontact. Alles wordt lokaal op je apparaat verwerkt.
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] text-nova-muted">
            <Shield className="w-3 h-3" />
            Privacy eerst · geen cloud-upload
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              className="nova-btn-primary text-xs min-h-[40px]"
              onClick={async () => {
                await updateSettings({ cameraEnabled: true });
                await enableCamera();
              }}
            >
              Toestaan
            </button>
            <button
              type="button"
              className="nova-btn-ghost text-xs min-h-[40px]"
              onClick={() => updateSettings({ cameraEnabled: false })}
            >
              Niet nu
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
