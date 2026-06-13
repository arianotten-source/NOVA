import type { AlertLevel, AlertMetric } from '@/types/sensors';
import { ONLINE_THRESHOLD_MS } from '@/types/sensors';

export function getTemperatureLevel(temp: number): AlertLevel {
  if (temp >= 20 && temp <= 24) return 'green';
  if ((temp >= 18 && temp < 20) || (temp > 24 && temp <= 27)) return 'orange';
  return 'red';
}

export function getHumidityLevel(humidity: number): AlertLevel {
  if (humidity >= 40 && humidity <= 60) return 'green';
  if ((humidity >= 30 && humidity < 40) || (humidity > 60 && humidity <= 70)) return 'orange';
  return 'red';
}

export function isDeviceOnline(lastUpdate: string, now = Date.now()): boolean {
  return now - new Date(lastUpdate).getTime() < ONLINE_THRESHOLD_MS;
}

export function levelColor(level: AlertLevel): string {
  switch (level) {
    case 'green': return 'text-green-400';
    case 'orange': return 'text-orange-400';
    case 'red': return 'text-red-400';
  }
}

export function levelBg(level: AlertLevel): string {
  switch (level) {
    case 'green': return 'bg-green-500/10 border-green-500/20';
    case 'orange': return 'bg-orange-500/10 border-orange-500/20';
    case 'red': return 'bg-red-500/10 border-red-500/20';
  }
}

export function formatLastUpdate(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export function getSensorStats(devices: { temperature: number; humidity: number; lastUpdate: string }[]) {
  const online = devices.filter((d) => isDeviceOnline(d.lastUpdate));
  const avgTemp = online.length
    ? +(online.reduce((s, d) => s + d.temperature, 0) / online.length).toFixed(1)
    : 0;
  const avgHum = online.length
    ? Math.round(online.reduce((s, d) => s + d.humidity, 0) / online.length)
    : 0;
  return { onlineCount: online.length, totalCount: devices.length, avgTemp, avgHum };
}

export function metricLabel(metric: AlertMetric): string {
  return metric === 'temperature' ? 'Temperatuur' : 'Luchtvochtigheid';
}
