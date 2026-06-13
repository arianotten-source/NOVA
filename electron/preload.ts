import { contextBridge, ipcRenderer } from 'electron';
import type { MemorySection, NovaMemoryState, MemoryManifest } from '../backend/storage/memoryTypes';

export interface NovaAPI {
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
    getStats: () => Promise<SystemStats>;
  };
  files: {
    list: (dir: string) => Promise<FileEntry[]>;
    read: (filePath: string) => Promise<string>;
  };
}

export interface SystemStats {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  storage: { used: number; total: number; percent: number };
  network: { online: boolean; type: string };
  platform: string;
  hostname: string;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
}

const api: NovaAPI = {
  memory: {
    loadAll: () => ipcRenderer.invoke('memory:loadAll'),
    saveSection: (section, data) => ipcRenderer.invoke('memory:saveSection', section, data),
    buildAIContext: () => ipcRenderer.invoke('memory:buildAIContext'),
  },
  storage: {
    read: (collection) => ipcRenderer.invoke('storage:read', collection),
    write: (collection, data) => ipcRenderer.invoke('storage:write', collection, data),
  },
  system: {
    getStats: () => ipcRenderer.invoke('system:getStats'),
  },
  files: {
    list: (dir) => ipcRenderer.invoke('files:list', dir),
    read: (filePath) => ipcRenderer.invoke('files:read', filePath),
  },
};

contextBridge.exposeInMainWorld('nova', api);
