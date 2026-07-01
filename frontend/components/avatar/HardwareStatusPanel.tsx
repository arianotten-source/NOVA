import { useAvatar } from '@/context/AvatarContext';

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-nova-border/60 text-sm last:border-0">
      <dt className="text-nova-muted">{label}</dt>
      <dd className="font-medium text-gray-100 text-right">{value}</dd>
    </div>
  );
}

export default function HardwareStatusPanel() {
  const { status } = useAvatar();
  if (!status) return null;

  const { oled, esp } = status.hardware;

  return (
    <section className="nova-panel p-5 space-y-4">
      <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Hardware Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <dl>
          <p className="text-xs text-nova-cyan font-semibold mb-2 uppercase">OLED</p>
          <Row label="Status" value={oled.connected ? 'Verbonden' : 'Niet verbonden'} />
          <Row label="I2C adres" value={oled.i2cAddress} />
          <Row label="Driver" value={oled.driver} />
          <Row label="Resolutie" value={oled.resolution} />
          <Row label="FPS" value={oled.fps} />
          <Row label="Firmware" value={oled.firmware} />
        </dl>
        <dl>
          <p className="text-xs text-nova-cyan font-semibold mb-2 uppercase">ESP Status</p>
          <Row label="Status" value={esp.online ? 'Online' : 'Offline'} />
          <Row label="WiFi" value={esp.wifi} />
          <Row label="Sensoren" value={esp.sensors} />
        </dl>
      </div>
    </section>
  );
}
