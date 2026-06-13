import type {
  MemoryManifest,
  MemorySection,
  NovaMemoryState,
  SemanticMemoryEntry,
} from '@/types/memory';
import {
  DEFAULT_MANIFEST,
  EMPTY_MEMORY_STATE,
} from '@/types/memory';
import type { AppSettings, Note, Task } from '@/types';

type MemoryListener = (state: NovaMemoryState) => void;

class MemoryService {
  private state: NovaMemoryState = structuredClone(EMPTY_MEMORY_STATE);
  private snapshot: NovaMemoryState = structuredClone(EMPTY_MEMORY_STATE);
  private _manifest: MemoryManifest = { ...DEFAULT_MANIFEST };
  private loaded = false;
  private loading: Promise<NovaMemoryState> | null = null;
  private listeners = new Set<MemoryListener>();

  private updateSnapshot() {
    this.snapshot = structuredClone(this.state);
  }

  async load(): Promise<NovaMemoryState> {
    if (this.loaded) return this.getState();
    if (this.loading) return this.loading;

    this.loading = this.performLoad();
    try {
      return await this.loading;
    } finally {
      this.loading = null;
    }
  }

  private async performLoad(): Promise<NovaMemoryState> {
    if (window.nova?.memory) {
      const result = await window.nova.memory.loadAll();
      this.state = result.state;
      this._manifest = result.manifest;
    } else {
      const [notes, tasks, preferences, episodic, semantic] = await Promise.all([
        this.readLocal<Note[]>('notes', []),
        this.readLocal<Task[]>('tasks', []),
        this.readLocal<AppSettings>('settings', EMPTY_MEMORY_STATE.preferences),
        this.readLocal<NovaMemoryState['episodic']>('conversations', []),
        this.readLocal<SemanticMemoryEntry[]>('semantic', []),
      ]);
      this.state = { notes, tasks, preferences, episodic, semantic };
    }

    this.loaded = true;
    this.updateSnapshot();
    this.notify();
    return this.getState();
  }

  private async readLocal<T>(key: string, fallback: T): Promise<T> {
    const stored = localStorage.getItem(`nova_${key}`);
    if (!stored) return fallback;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  }

  private async writeLocal(key: string, data: unknown): Promise<void> {
    localStorage.setItem(`nova_${key}`, JSON.stringify(data));
  }

  getManifest(): MemoryManifest {
    return { ...this._manifest };
  }

  getState(): NovaMemoryState {
    return this.snapshot;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  subscribe(listener: MemoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  async saveSection<K extends MemorySection>(
    section: K,
    data: NovaMemoryState[K]
  ): Promise<NovaMemoryState> {
    if (!this.loaded) await this.load();

    this.state[section] = structuredClone(data) as NovaMemoryState[K];

    if (window.nova?.memory) {
      await window.nova.memory.saveSection(section, data);
    } else {
      const keyMap: Record<MemorySection, string> = {
        notes: 'notes',
        tasks: 'tasks',
        preferences: 'settings',
        episodic: 'conversations',
        semantic: 'semantic',
      };
      await this.writeLocal(keyMap[section], data);
    }

    this.updateSnapshot();
    this.notify();
    return this.getState();
  }

  async saveNotes(notes: Note[]) {
    return this.saveSection('notes', notes);
  }

  async saveTasks(tasks: Task[]) {
    return this.saveSection('tasks', tasks);
  }

  async savePreferences(preferences: AppSettings) {
    return this.saveSection('preferences', preferences);
  }

  /** Future: AI semantic memory */
  async addSemanticEntry(entry: Omit<SemanticMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.loaded) await this.load();

    const now = new Date().toISOString();
    const newEntry: SemanticMemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    const semantic = [...this.state.semantic, newEntry];
    return this.saveSection('semantic', semantic);
  }

  /** Future: context for AI prompts */
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
}

export const memoryService = new MemoryService();
