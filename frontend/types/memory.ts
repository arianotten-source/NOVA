import type { Note, Task, AppSettings, Conversation } from './index';

export interface MemoryManifest {
  version: number;
  updatedAt: string;
  sections: MemorySections;
}

export interface MemorySections {
  notes: string;
  tasks: string;
  preferences: string;
  episodic: string;
  semantic: string;
}

export interface SemanticMemoryEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  source: 'user' | 'ai' | 'system';
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface NovaMemoryState {
  notes: Note[];
  tasks: Task[];
  preferences: AppSettings;
  episodic: Conversation[];
  semantic: SemanticMemoryEntry[];
}

export type MemorySection = keyof NovaMemoryState;

export const MEMORY_VERSION = 1;

export const DEFAULT_MANIFEST: MemoryManifest = {
  version: MEMORY_VERSION,
  updatedAt: new Date().toISOString(),
  sections: {
    notes: 'notes/notes.json',
    tasks: 'notes/tasks.json',
    preferences: 'settings/settings.json',
    episodic: 'memory/conversations.json',
    semantic: 'memory/semantic.json',
  },
};

export const EMPTY_MEMORY_STATE: NovaMemoryState = {
  notes: [],
  tasks: [],
  preferences: {
    userName: 'Gebruiker',
    language: 'nl',
    theme: 'dark',
    aiProvider: 'none',
    aiModel: 'local',
    voiceEnabled: true,
  },
  episodic: [],
  semantic: [],
};
