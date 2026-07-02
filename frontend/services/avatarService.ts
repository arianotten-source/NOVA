import type { AvatarStatus, AvatarSettings, AutoEmotionMap, AvatarPlayPayload } from '@/types/avatar';
import {
  AVATAR_EXPRESSIONS,
  DEFAULT_AUTO_EMOTIONS,
  DEFAULT_AVATAR_SETTINGS,
  randomExpressionId,
} from '@/lib/avatar/catalog';
import { SENSOR_API_PORT } from '@/types/sensors';
import { safeClone } from '@/lib/safeClone';
import { isMobileDevice } from '@/lib/runtime/isMobile';

function resolveApiBase(): string {
  if (import.meta.env.DEV) return '';
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://localhost:${SENSOR_API_PORT}`;
  }
  return '';
}

const API_BASE = resolveApiBase();
const FETCH_TIMEOUT_MS = isMobileDevice() ? 800 : 2500;

const MOCK_STATUS: AvatarStatus = {
  activeExpressionId: 'blij',
  activeAnimationId: 'idle',
  oledOnline: true,
  expressionLabel: 'Blij',
  animationLabel: 'Idle',
  hardware: {
    oled: {
      connected: true,
      i2cAddress: '0x3C',
      driver: 'SSD1306',
      resolution: '128 x 64',
      fps: 30,
      firmware: 'v1.0',
    },
    esp: { online: true, wifi: 'Sterk', sensors: 'Online' },
  },
  settings: { ...DEFAULT_AVATAR_SETTINGS },
  autoEmotions: { ...DEFAULT_AUTO_EMOTIONS },
  lastUpdated: new Date().toISOString(),
};

let localStatus: AvatarStatus = safeClone(MOCK_STATUS);

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function applyLocalPlay(payload: AvatarPlayPayload): AvatarStatus {
  if (payload.type === 'expression') {
    const expr = AVATAR_EXPRESSIONS.find((e) => e.id === payload.id);
    if (expr) {
      localStatus = {
        ...localStatus,
        activeExpressionId: expr.id,
        expressionLabel: expr.name,
        oledOnline: true,
        lastUpdated: new Date().toISOString(),
      };
    }
  } else {
    localStatus = {
      ...localStatus,
      activeAnimationId: payload.id as AvatarStatus['activeAnimationId'],
      animationLabel: payload.id,
      lastUpdated: new Date().toISOString(),
    };
  }
  return safeClone(localStatus);
}

export const avatarService = {
  async getStatus(): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/status');
    if (data) {
      localStatus = data;
      return data;
    }
    return safeClone(localStatus);
  },

  async play(payload: AvatarPlayPayload): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (data) {
      localStatus = data;
      return data;
    }
    return applyLocalPlay(payload);
  },

  async playAnimation(id: string): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/animation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (data) {
      localStatus = data;
      return data;
    }
    return applyLocalPlay({ type: 'animation', id });
  },

  async reset(): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/reset', { method: 'POST' });
    if (data) {
      localStatus = data;
      return data;
    }
    localStatus = safeClone(MOCK_STATUS);
    return safeClone(localStatus);
  },

  async clearOled(): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/clear', { method: 'POST' });
    if (data) {
      localStatus = data;
      return data;
    }
    localStatus = { ...localStatus, oledOnline: false, lastUpdated: new Date().toISOString() };
    return safeClone(localStatus);
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const data = await apiFetch<{ success: boolean; message: string }>('/api/avatar/test', {
      method: 'POST',
    });
    if (data) return data;
    localStatus = { ...localStatus, oledOnline: true };
    return { success: true, message: 'OLED verbinding OK (lokaal mock)' };
  },

  async updateSettings(partial: Partial<AvatarSettings>): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: partial }),
    });
    if (data) {
      localStatus = {
        ...data,
        settings: { ...DEFAULT_AVATAR_SETTINGS, ...data.settings },
      };
      return safeClone(localStatus);
    }
    localStatus = {
      ...localStatus,
      settings: { ...DEFAULT_AVATAR_SETTINGS, ...localStatus.settings, ...partial },
      lastUpdated: new Date().toISOString(),
    };
    return safeClone(localStatus);
  },

  async updateAutoEmotions(autoEmotions: Partial<AutoEmotionMap>): Promise<AvatarStatus> {
    const data = await apiFetch<AvatarStatus>('/api/avatar/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoEmotions }),
    });
    if (data) {
      localStatus = data;
      return data;
    }
    localStatus = {
      ...localStatus,
      autoEmotions: { ...localStatus.autoEmotions, ...autoEmotions },
      lastUpdated: new Date().toISOString(),
    };
    return safeClone(localStatus);
  },

  randomExpression(): AvatarPlayPayload {
    return { type: 'expression', id: randomExpressionId() };
  },
};
