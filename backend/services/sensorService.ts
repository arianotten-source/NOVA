import fs from 'fs/promises';
import path from 'path';
import type { SensorDevice, SensorStore, SensorUpdatePayload } from '../sensors/sensorTypes';
import { buildAlertsForDevice } from '../sensors/alertEngine';

const MAX_ALERTS = 50;

function getDataDir(): string {
  try {
    const { app } = require('electron') as typeof import('electron');
    const root = app.isPackaged ? app.getAppPath() : process.cwd();
    return path.join(root, 'data', 'sensors');
  } catch {
    return path.join(process.cwd(), 'data', 'sensors');
  }
}

function getStorePath(): string {
  return path.join(getDataDir(), 'devices.json');
}

const DEFAULT_STORE: SensorStore = {
  devices: [
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
  ],
  alerts: [],
};

export class SensorService {
  private store: SensorStore = structuredClone(DEFAULT_STORE);
  private loaded = false;

  async load(): Promise<SensorStore> {
    if (this.loaded) return this.getStore();
    await fs.mkdir(getDataDir(), { recursive: true });
    try {
      const content = await fs.readFile(getStorePath(), 'utf-8');
      this.store = JSON.parse(content) as SensorStore;
    } catch {
      this.store = structuredClone(DEFAULT_STORE);
      await this.persist();
    }
    this.loaded = true;
    return this.getStore();
  }

  private async persist() {
    await fs.mkdir(getDataDir(), { recursive: true });
    await fs.writeFile(getStorePath(), JSON.stringify(this.store, null, 2), 'utf-8');
  }

  getStore(): SensorStore {
    return structuredClone(this.store);
  }

  getAllDevices(): SensorDevice[] {
    return [...this.store.devices];
  }

  getDevice(deviceId: string): SensorDevice | null {
    return this.store.devices.find((d) => d.deviceId === deviceId) ?? null;
  }

  async updateDevice(payload: SensorUpdatePayload): Promise<SensorDevice> {
    if (!this.loaded) await this.load();

    const now = new Date().toISOString();
    const existing = this.store.devices.findIndex((d) => d.deviceId === payload.deviceId);

    const device: SensorDevice = {
      deviceId: payload.deviceId,
      name: payload.name,
      temperature: payload.temperature,
      humidity: payload.humidity,
      timestamp: payload.timestamp,
      lastUpdate: now,
    };

    if (existing >= 0) {
      this.store.devices[existing] = device;
    } else {
      this.store.devices.push(device);
    }

    const newAlerts = buildAlertsForDevice(device);
    if (newAlerts.length > 0) {
      this.store.alerts = [...newAlerts, ...this.store.alerts].slice(0, MAX_ALERTS);
    }

    await this.persist();
    return device;
  }

  getAlerts(limit = 10) {
    return this.store.alerts.slice(0, limit);
  }
}

let instance: SensorService | null = null;

export function getSensorService(): SensorService {
  if (!instance) instance = new SensorService();
  return instance;
}
