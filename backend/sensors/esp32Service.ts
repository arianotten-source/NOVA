/**
 * ESP32 sensor integration — V1
 * Future: MQTT, mDNS discovery, additional sensor types
 */
import type { FutureSensorType } from '../sensors/sensorTypes';

export interface ESP32Module {
  deviceId: string;
  name: string;
  ip?: string;
  types: ('temperature' | 'humidity')[];
  futureTypes?: FutureSensorType[];
}

export const FUTURE_SENSOR_TYPES: FutureSensorType[] = [
  'pir_motion',
  'co2',
  'light',
  'door_contact',
  'water_level',
  'android_hub',
];
