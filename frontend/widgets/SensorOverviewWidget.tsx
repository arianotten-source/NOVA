import { Link } from 'react-router-dom';
import { Thermometer, Droplets, Radio, AlertTriangle } from 'lucide-react';
import { useSensors } from '@/hooks/useSensors';
import {
  getSensorStats,
  isDeviceOnline,
  getTemperatureLevel,
  getHumidityLevel,
  levelColor,
  formatLastUpdate,
} from '@/lib/sensorUtils';
import { cn } from '@/lib/utils';

export default function SensorOverviewWidget() {
  const { devices, alerts, loading } = useSensors();

  if (loading) {
    return (
      <section className="nova-panel p-6">
        <p className="text-nova-muted text-sm">Sensoren laden...</p>
      </section>
    );
  }

  const stats = getSensorStats(devices);
  const recentAlerts = alerts.filter((a) => a.level !== 'green').slice(0, 3);

  return (
    <section className="nova-panel p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-nova-muted uppercase tracking-wider">Sensor overzicht</h3>
        <Link to="/sensors" className="text-xs text-nova-blue hover:text-nova-cyan transition-colors">
          Sensor Hub →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Radio} label="Online" value={`${stats.onlineCount}/${stats.totalCount}`} />
        <StatCard icon={Thermometer} label="Gem. temp" value={`${stats.avgTemp}°C`} />
        <StatCard icon={Droplets} label="Gem. vocht" value={`${stats.avgHum}%`} />
        <StatCard icon={AlertTriangle} label="Waarschuwingen" value={String(recentAlerts.length)} accent={recentAlerts.length > 0} />
      </div>

      {devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {devices.slice(0, 4).map((device) => {
            const online = isDeviceOnline(device.lastUpdate);
            const tempLevel = getTemperatureLevel(device.temperature);
            const humLevel = getHumidityLevel(device.humidity);
            return (
              <div key={device.deviceId} className="bg-nova-dark rounded-lg p-3 border border-nova-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{device.name}</span>
                  <span className={cn('text-[10px]', online ? 'text-green-400' : 'text-red-400')}>
                    {online ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>
                <div className="flex gap-4 text-sm font-mono">
                  <span className={levelColor(tempLevel)}>🌡 {device.temperature}°C</span>
                  <span className={levelColor(humLevel)}>💧 {device.humidity}%</span>
                </div>
                <p className="text-[10px] text-nova-muted mt-1">Update: {formatLastUpdate(device.lastUpdate)}</p>
              </div>
            );
          })}
        </div>
      )}

      {recentAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-nova-muted uppercase tracking-wider">Laatste waarschuwingen</p>
          {recentAlerts.map((alert) => (
            <div key={alert.id} className={cn('text-xs px-3 py-2 rounded-lg border', alert.level === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400')}>
              <span className="font-medium">{alert.deviceName}:</span> {alert.message}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Radio; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn('bg-nova-dark rounded-lg p-3 border border-nova-border text-center', accent && 'border-orange-500/30')}>
      <Icon className="w-4 h-4 text-nova-blue mx-auto mb-1" />
      <p className="text-[10px] text-nova-muted">{label}</p>
      <p className="text-lg font-mono text-nova-cyan">{value}</p>
    </div>
  );
}
