import http from 'http';
import { getSensorService } from '../services/sensorService';
import { handleAvatarRequest } from './avatarRoutes';
import type { SensorUpdatePayload } from '../sensors/sensorTypes';
import { SENSOR_API_PORT } from '../sensors/sensorTypes';

let server: http.Server | null = null;

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function isValidPayload(data: unknown): data is SensorUpdatePayload {
  if (!data || typeof data !== 'object') return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.deviceId === 'string' &&
    typeof p.name === 'string' &&
    typeof p.temperature === 'number' &&
    typeof p.humidity === 'number' &&
    typeof p.timestamp === 'number'
  );
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = req.url ?? '/';

  const handled = await handleAvatarRequest(req, res, url, sendJson, readBody);
  if (handled) return;

  const sensorService = getSensorService();
  await sensorService.load();

  if (req.method === 'POST' && url === '/api/sensors/update') {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body);
      if (!isValidPayload(data)) {
        sendJson(res, 400, { error: 'Invalid payload' });
        return;
      }
      const device = await sensorService.updateDevice(data);
      sendJson(res, 200, { success: true, device });
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
    }
    return;
  }

  if (req.method === 'GET' && url === '/api/sensors') {
    const store = sensorService.getStore();
    sendJson(res, 200, { devices: store.devices, alerts: store.alerts });
    return;
  }

  const deviceMatch = url.match(/^\/api\/sensors\/([^/?]+)$/);
  if (req.method === 'GET' && deviceMatch) {
    const device = sensorService.getDevice(decodeURIComponent(deviceMatch[1]));
    if (!device) {
      sendJson(res, 404, { error: 'Device not found' });
      return;
    }
    sendJson(res, 200, { device });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

export function startSensorServer(port = SENSOR_API_PORT): http.Server {
  if (server) return server;

  server = http.createServer((req, res) => {
    handleRequest(req, res).catch(() => {
      sendJson(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[N.O.V.A.] API running on http://0.0.0.0:${port} (sensors + avatar)`);
  });

  return server;
}

export function stopSensorServer() {
  if (server) {
    server.close();
    server = null;
  }
}
