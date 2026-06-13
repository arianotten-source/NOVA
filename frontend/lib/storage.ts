import type { AppSettings } from '@/types';
import type { MemorySection, NovaMemoryState, MemoryManifest } from '@/types/memory';

declare global {
  interface Window {
    nova?: {
      memory: {
        loadAll: () => Promise<{ state: NovaMemoryState; manifest: MemoryManifest }>;
        saveSection: (section: MemorySection, data: unknown) => Promise<NovaMemoryState>;
        buildAIContext: () => Promise<string>;
      };
      storage: {
        read: (collection: string) => Promise<unknown>;
        write: (collection: string, data: unknown) => Promise<boolean>;
      };
      system: {
        getStats: () => Promise<{
          cpu: number;
          ram: { used: number; total: number; percent: number };
          storage: { used: number; total: number; percent: number };
          network: { online: boolean; type: string };
          platform: string;
          hostname: string;
        }>;
      };
      files: {
        list: (dir: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean; size: number }>>;
        read: (filePath: string) => Promise<string>;
      };
    };
  }
}

export async function readStorage<T>(collection: string, fallback: T): Promise<T> {
  if (window.nova?.storage) {
    const data = await window.nova.storage.read(collection);
    return (data as T) ?? fallback;
  }

  const key = `nova_${collection}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export async function writeStorage<T>(collection: string, data: T): Promise<boolean> {
  if (window.nova?.storage) {
    return window.nova.storage.write(collection, data);
  }

  const key = `nova_${collection}`;
  localStorage.setItem(key, JSON.stringify(data));
  return true;
}

export async function getSystemStats() {
  if (window.nova?.system) {
    return window.nova.system.getStats();
  }

  return {
    cpu: Math.round(Math.random() * 30 + 10),
    ram: { used: 4e9, total: 16e9, percent: 25 },
    storage: { used: 100e9, total: 500e9, percent: 20 },
    network: { online: navigator.onLine, type: 'wifi' },
    platform: navigator.platform,
    hostname: 'localhost',
  };
}

export async function listFiles(dir: string) {
  if (window.nova?.files) {
    return window.nova.files.list(dir);
  }
  return [];
}

export type { AppSettings };
