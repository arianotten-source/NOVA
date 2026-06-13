/** V1 — temperature & humidity from ESP32 */
export interface SensorDevice {
  deviceId: string;
  name: string;
  temperature: number;
  humidity: number;
  /** Unix timestamp from device */
  timestamp: number;
  /** ISO string when N.O.V.A. received the update */
  lastUpdate: string;
}

export interface SensorUpdatePayload {
  deviceId: string;
  name: string;
  temperature: number;
  humidity: number;
  timestamp: number;
}

export type AlertLevel = 'green' | 'orange' | 'red';
export type AlertMetric = 'temperature' | 'humidity';

export interface SensorAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  metric: AlertMetric;
  level: AlertLevel;
  value: number;
  message: string;
  timestamp: string;
}

export interface SensorStore {
  devices: SensorDevice[];
  alerts: SensorAlert[];
}

/** Future sensor types — not implemented in V1 */
export type FutureSensorType =
  | 'pir_motion'
  | 'co2'
  | 'light'
  | 'door_contact'
  | 'water_level'
  | 'android_hub';

export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
export const SENSOR_API_PORT = 3847;
