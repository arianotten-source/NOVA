import type { SensorApiResponse, SensorDevice } from '@/types/sensors';
import { SENSOR_API_PORT } from '@/types/sensors';

const API_BASE = import.meta.env.DEV ? '' : `http://localhost:${SENSOR_API_PORT}`;

const MOCK_DEVICES: SensorDevice[] = [
  {
    deviceId: 'livingroom01',
    name: 'Woonkamer',
    temperature: 22.4,
    humidity: 48,
    timestamp: Math.floor(Date.now() / 1000),
    lastUpdate: new Date().toISOString(),
  },
  {
    deviceId: 'bedroom01',
    name: 'Slaapkamer',
    temperature: 19.1,
    humidity: 55,
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

async function fetchApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchSensors(): Promise<SensorApiResponse> {
  const data = await fetchApi<SensorApiResponse>('/api/sensors');
  if (data) return data;
  return { devices: MOCK_DEVICES, alerts: [] };
}

export async function fetchSensorDevice(deviceId: string): Promise<SensorDevice | null> {
  const data = await fetchApi<{ device: SensorDevice }>(`/api/sensors/${encodeURIComponent(deviceId)}`);
  if (data?.device) return data.device;
  return MOCK_DEVICES.find((d) => d.deviceId === deviceId) ?? null;
}

export async function postSensorUpdate(payload: {
  deviceId: string;
  name: string;
  temperature: number;
  humidity: number;
  timestamp: number;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/sensors/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
