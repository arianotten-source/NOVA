import type { AlertLevel, AlertMetric, SensorAlert, SensorDevice } from './sensorTypes';
import { randomUUID } from 'crypto';

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

export function getAlertMessage(metric: AlertMetric, value: number, level: AlertLevel): string {
  const unit = metric === 'temperature' ? '°C' : '%';
  const label = metric === 'temperature' ? 'Temperatuur' : 'Luchtvochtigheid';

  if (level === 'green') return `${label} normaal (${value}${unit})`;
  if (level === 'orange') return `${label} afwijkend (${value}${unit})`;
  return `${label} kritiek (${value}${unit})`;
}

export function buildAlertsForDevice(device: SensorDevice): SensorAlert[] {
  const now = new Date().toISOString();
  const alerts: SensorAlert[] = [];

  const tempLevel = getTemperatureLevel(device.temperature);
  if (tempLevel !== 'green') {
    alerts.push({
      id: randomUUID(),
      deviceId: device.deviceId,
      deviceName: device.name,
      metric: 'temperature',
      level: tempLevel,
      value: device.temperature,
      message: getAlertMessage('temperature', device.temperature, tempLevel),
      timestamp: now,
    });
  }

  const humLevel = getHumidityLevel(device.humidity);
  if (humLevel !== 'green') {
    alerts.push({
      id: randomUUID(),
      deviceId: device.deviceId,
      deviceName: device.name,
      metric: 'humidity',
      level: humLevel,
      value: device.humidity,
      message: getAlertMessage('humidity', device.humidity, humLevel),
      timestamp: now,
    });
  }

  return alerts;
}

export function isDeviceOnline(lastUpdate: string, now = Date.now()): boolean {
  return now - new Date(lastUpdate).getTime() < 2 * 60 * 1000;
}
