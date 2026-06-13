import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type {
  MemoryManifest,
  MemorySection,
  NovaMemoryState,
  SemanticMemoryEntry,
} from '../storage/memoryTypes';
import {
  DEFAULT_MANIFEST,
  EMPTY_MEMORY_STATE,
  MEMORY_VERSION,
} from '../storage/memoryTypes';
import type { AppSettings } from '../storage/types';

function getDataDir(): string {
  const { app } = require('electron') as typeof import('electron');
  const root = app.isPackaged ? app.getAppPath() : process.cwd();
  return path.join(root, 'data');
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJsonFile<T>(relativePath: string, fallback: T): Promise<T> {
  const filePath = path.join(getDataDir(), relativePath);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(relativePath: string, data: unknown): Promise<void> {
  const filePath = path.join(getDataDir(), relativePath);
  await ensureDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export class MemoryService {
  private state: NovaMemoryState = { ...EMPTY_MEMORY_STATE, preferences: { ...EMPTY_MEMORY_STATE.preferences } };
  private manifest: MemoryManifest = { ...DEFAULT_MANIFEST };
  private loaded = false;

  async load(): Promise<NovaMemoryState> {
    this.manifest = await readJsonFile<MemoryManifest>(
      'memory/manifest.json',
      DEFAULT_MANIFEST
    );

    const [notes, tasks, preferences, episodic, semantic] = await Promise.all([
      readJsonFile(this.manifest.sections.notes, [] as NovaMemoryState['notes']),
      readJsonFile(this.manifest.sections.tasks, [] as NovaMemoryState['tasks']),
      readJsonFile(this.manifest.sections.preferences, EMPTY_MEMORY_STATE.preferences),
      readJsonFile(this.manifest.sections.episodic, [] as NovaMemoryState['episodic']),
      readJsonFile(this.manifest.sections.semantic, [] as SemanticMemoryEntry[]),
    ]);

    this.state = { notes, tasks, preferences, episodic, semantic };
    this.loaded = true;
    return this.getState();
  }

  getManifest(): MemoryManifest {
    return { ...this.manifest };
  }

  getState(): NovaMemoryState {
    return {
      notes: [...this.state.notes],
      tasks: [...this.state.tasks],
      preferences: { ...this.state.preferences },
      episodic: [...this.state.episodic],
      semantic: [...this.state.semantic],
    };
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  async saveSection<K extends MemorySection>(
    section: K,
    data: NovaMemoryState[K]
  ): Promise<NovaMemoryState> {
    if (!this.loaded) await this.load();

    this.state[section] = data as NovaMemoryState[K];
    const relativePath = this.manifest.sections[section];
    await writeJsonFile(relativePath, data);
    await this.updateManifest();

    return this.getState();
  }

  async saveNotes(notes: NovaMemoryState['notes']) {
    return this.saveSection('notes', notes);
  }

  async saveTasks(tasks: NovaMemoryState['tasks']) {
    return this.saveSection('tasks', tasks);
  }

  async savePreferences(preferences: AppSettings) {
    return this.saveSection('preferences', preferences);
  }

  /** Future: store AI-learned facts */
  async addSemanticEntry(entry: Omit<SemanticMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.loaded) await this.load();

    const now = new Date().toISOString();
    const newEntry: SemanticMemoryEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.state.semantic.push(newEntry);
    await writeJsonFile(this.manifest.sections.semantic, this.state.semantic);
    await this.updateManifest();
    return newEntry;
  }

  /** Future: build context string for AI prompts */
  buildAIContext(): string {
    const { notes, tasks, preferences, semantic } = this.state;
    const parts: string[] = [
      `Gebruiker: ${preferences.userName}`,
      `Taal: ${preferences.language}`,
    ];

    if (notes.length > 0) {
      parts.push(`Notities (${notes.length}): ${notes.slice(0, 5).map((n) => n.title).join(', ')}`);
    }
    if (tasks.length > 0) {
      const open = tasks.filter((t) => t.status !== 'completed');
      parts.push(`Open taken (${open.length}): ${open.slice(0, 5).map((t) => t.title).join(', ')}`);
    }
    if (semantic.length > 0) {
      parts.push(`Geheugen: ${semantic.slice(0, 10).map((s) => `${s.key}=${s.value}`).join('; ')}`);
    }

    return parts.join('\n');
  }

  private async updateManifest() {
    this.manifest.updatedAt = new Date().toISOString();
    this.manifest.version = MEMORY_VERSION;
    await writeJsonFile('memory/manifest.json', this.manifest);
  }
}

let instance: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!instance) instance = new MemoryService();
  return instance;
}
