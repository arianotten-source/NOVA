export interface SensorDevice {
  deviceId: string;
  name: string;
  temperature: number;
  humidity: number;
  timestamp: number;
  lastUpdate: string;
}

export interface SensorAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  metric: 'temperature' | 'humidity';
  level: AlertLevel;
  value: number;
  message: string;
  timestamp: string;
}

export type AlertLevel = 'green' | 'orange' | 'red';
export type AlertMetric = 'temperature' | 'humidity';

export interface SensorApiResponse {
  devices: SensorDevice[];
  alerts: SensorAlert[];
}

/** Future sensor types — V2+ */
export type FutureSensorType =
  | 'pir_motion'
  | 'co2'
  | 'light'
  | 'door_contact'
  | 'water_level'
  | 'android_hub';

export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
export const SENSOR_API_PORT = 3847;
