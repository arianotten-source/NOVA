import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { getSystemStats } from '../services/systemService';
import { getMemoryService } from '../services/memoryService';
import type { MemorySection } from '../storage/memoryTypes';

function getDataDir(): string {
  const { app } = require('electron') as typeof import('electron');
  const root = app.isPackaged ? app.getAppPath() : process.cwd();
  return path.join(root, 'data');
}

const LEGACY_COLLECTION_MAP: Record<string, string> = {
  notes: 'notes/notes.json',
  tasks: 'notes/tasks.json',
  events: 'notes/events.json',
  conversations: 'memory/conversations.json',
  settings: 'settings/settings.json',
  sensors: 'memory/sensors.json',
  logs: 'logs/app.json',
};

function getLegacyFilePath(collection: string): string {
  const relative = LEGACY_COLLECTION_MAP[collection];
  if (!relative) throw new Error(`Unknown collection: ${collection}`);
  return path.join(getDataDir(), relative);
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function registerIpcHandlers() {
  const memory = getMemoryService();

  ipcMain.handle('memory:loadAll', async () => {
    const state = await memory.load();
    return {
      state,
      manifest: memory.getManifest(),
    };
  });

  ipcMain.handle('memory:saveSection', async (_event, section: MemorySection, data: unknown) => {
    await memory.saveSection(section, data as never);
    return memory.getState();
  });

  ipcMain.handle('memory:buildAIContext', async () => {
    if (!memory.isLoaded()) await memory.load();
    return memory.buildAIContext();
  });

  // Legacy storage API — kept for chat, agenda, sensors, files
  ipcMain.handle('storage:read', async (_event, collection: string) => {
    const filePath = getLegacyFilePath(collection);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  });

  ipcMain.handle('storage:write', async (_event, collection: string, data: unknown) => {
    const filePath = getLegacyFilePath(collection);
    await ensureDir(filePath);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  });

  ipcMain.handle('system:getStats', async () => {
    return getSystemStats();
  });

  ipcMain.handle('files:list', async (_event, dir: string) => {
    const DATA_DIR = getDataDir();
    const targetDir = path.resolve(DATA_DIR, dir);
    if (!targetDir.startsWith(DATA_DIR)) {
      throw new Error('Access denied');
    }
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const results = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(targetDir, entry.name);
          const stat = await fs.stat(fullPath);
          return {
            name: entry.name,
            path: path.relative(DATA_DIR, fullPath),
            isDirectory: entry.isDirectory(),
            size: stat.size,
          };
        })
      );
      return results;
    } catch {
      return [];
    }
  });

  ipcMain.handle('files:read', async (_event, filePath: string) => {
    const DATA_DIR = getDataDir();
    const fullPath = path.resolve(DATA_DIR, filePath);
    if (!fullPath.startsWith(DATA_DIR)) {
      throw new Error('Access denied');
    }
    return fs.readFile(fullPath, 'utf-8');
  });
}
