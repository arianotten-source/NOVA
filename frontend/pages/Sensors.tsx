import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSensors } from '@/hooks/useSensors';
import {
  isDeviceOnline,
  getTemperatureLevel,
  getHumidityLevel,
  levelColor,
  levelBg,
  formatLastUpdate,
} from '@/lib/sensorUtils';
import { cn } from '@/lib/utils';
import type { SensorDevice } from '@/types/sensors';

const FUTURE_SENSORS = [
  'PIR bewegingssensor',
  'CO₂ sensor',
  'Lichtsensor',
  'Deurcontact',
  'Waterniveau',
  'Android Hub',
];

export default function Sensors() {
  const { devices, alerts, loading, refresh } = useSensors(10000);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 w-full min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Sensor Hub</h1>
            <p className="text-nova-muted text-sm mt-1">ESP32 Device Manager</p>
          </div>
          <button onClick={handleRefresh} className="nova-btn-primary flex items-center gap-2" disabled={refreshing}>
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            Vernieuwen
          </button>
        </div>

        {loading ? (
          <p className="text-nova-muted text-sm text-center py-12">Sensoren laden...</p>
        ) : devices.length === 0 ? (
          <div className="nova-panel p-8 text-center">
            <p className="text-nova-muted text-sm">Geen sensoren gevonden.</p>
            <p className="text-nova-muted text-xs mt-2">Configureer een ESP32 module om data te versturen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {devices.map((device) => (
              <DeviceCard key={device.deviceId} device={device} />
            ))}
          </div>
        )}

        {alerts.filter((a) => a.level !== 'green').length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider mb-4">Waarschuwingen</h2>
            <div className="space-y-2">
              {alerts.filter((a) => a.level !== 'green').slice(0, 10).map((alert) => (
                <div key={alert.id} className={cn('nova-panel px-4 py-3 text-sm border', levelBg(alert.level))}>
                  <span className="font-medium">{alert.deviceName}</span>
                  <span className="text-nova-muted"> — </span>
                  {alert.message}
                  <span className="text-[10px] text-nova-muted ml-2">{formatLastUpdate(alert.timestamp)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="nova-panel p-5">
          <h2 className="text-sm font-medium text-nova-muted uppercase tracking-wider mb-3">Toekomstige sensoren</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {FUTURE_SENSORS.map((name) => (
              <div key={name} className="px-3 py-2 rounded-lg bg-nova-dark border border-nova-border text-xs text-nova-muted">
                {name}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DeviceCard({ device }: { device: SensorDevice }) {
  const online = isDeviceOnline(device.lastUpdate);
  const tempLevel = getTemperatureLevel(device.temperature);
  const humLevel = getHumidityLevel(device.humidity);

  return (
    <div className="nova-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-100">{device.name}</h3>
          <p className="text-[10px] text-nova-muted font-mono">{device.deviceId}</p>
        </div>
        <span className={cn('text-xs font-medium', online ? 'text-green-400' : 'text-red-400')}>
          {online ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="min-w-0">
          <p className="text-[10px] text-nova-muted mb-1">Temperatuur</p>
          <p className={cn('text-xl sm:text-2xl font-mono', levelColor(tempLevel))}>
            🌡 {device.temperature}°C
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-nova-muted mb-1">Luchtvochtigheid</p>
          <p className={cn('text-xl sm:text-2xl font-mono', levelColor(humLevel))}>
            💧 {device.humidity}%
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-nova-border">
        <p className="text-[10px] text-nova-muted">
          Laatste update: {formatLastUpdate(device.lastUpdate)}
        </p>
      </div>
    </div>
  );
}
