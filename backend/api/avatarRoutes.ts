import type { IncomingMessage, ServerResponse } from 'http';
import { getAvatarService } from '../services/avatarService';
import type { AvatarPlayPayload } from '../services/avatarTypes';

export async function handleAvatarRequest(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  sendJson: (res: ServerResponse, status: number, data: unknown) => void,
  readBody: (req: IncomingMessage) => Promise<string>
): Promise<boolean> {
  if (!url.startsWith('/api/avatar')) return false;

  const avatar = getAvatarService();

  if (req.method === 'GET' && url === '/api/avatar/status') {
    sendJson(res, 200, avatar.getStatus());
    return true;
  }

  if (req.method === 'GET' && url === '/api/avatar/expressions') {
    sendJson(res, 200, { expressions: avatar.getExpressions() });
    return true;
  }

  if (req.method === 'GET' && url === '/api/avatar/settings') {
    sendJson(res, 200, { settings: avatar.getStatus().settings, autoEmotions: avatar.getStatus().autoEmotions });
    return true;
  }

  if (req.method === 'POST' && (url === '/api/avatar/play' || url === '/api/avatar/animation')) {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body) as AvatarPlayPayload & { id?: string };
      const payload: AvatarPlayPayload =
        url === '/api/avatar/animation'
          ? { type: 'animation', id: data.id ?? 'idle' }
          : data;
      sendJson(res, 200, avatar.play(payload));
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
    }
    return true;
  }

  if (req.method === 'POST' && url === '/api/avatar/reset') {
    sendJson(res, 200, avatar.reset());
    return true;
  }

  if (req.method === 'POST' && url === '/api/avatar/clear') {
    sendJson(res, 200, avatar.clearOled());
    return true;
  }

  if (req.method === 'POST' && url === '/api/avatar/test') {
    sendJson(res, 200, avatar.testConnection());
    return true;
  }

  if (req.method === 'POST' && url === '/api/avatar/settings') {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body) as { settings?: Record<string, unknown>; autoEmotions?: Record<string, boolean> };
      if (data.settings) avatar.updateSettings(data.settings);
      if (data.autoEmotions) avatar.updateAutoEmotions(data.autoEmotions);
      sendJson(res, 200, avatar.getStatus());
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON' });
    }
    return true;
  }

  sendJson(res, 404, { error: 'Avatar route not found' });
  return true;
}
