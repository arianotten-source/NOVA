import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { memoryService } from '@/services/memoryService';
import type { NovaMemoryState } from '@/types/memory';
import type { AppSettings, Note, Task } from '@/types';

interface MemoryContextValue {
  state: NovaMemoryState;
  loaded: boolean;
  saveNotes: (notes: Note[]) => Promise<void>;
  saveTasks: (tasks: Task[]) => Promise<void>;
  savePreferences: (preferences: AppSettings) => Promise<void>;
  buildAIContext: () => string;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NovaMemoryState>(() => memoryService.getState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    return memoryService.subscribe(setState);
  }, []);

  useEffect(() => {
    memoryService.load().then(() => setLoaded(true));
  }, []);

  const saveNotes = useCallback(async (notes: Note[]) => {
    await memoryService.saveNotes(notes);
  }, []);

  const saveTasks = useCallback(async (tasks: Task[]) => {
    await memoryService.saveTasks(tasks);
  }, []);

  const savePreferences = useCallback(async (preferences: AppSettings) => {
    await memoryService.savePreferences(preferences);
  }, []);

  const buildAIContext = useCallback(() => memoryService.buildAIContext(), []);

  return (
    <MemoryContext.Provider value={{ state, loaded, saveNotes, saveTasks, savePreferences, buildAIContext }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemory must be used within MemoryProvider');
  return ctx;
}
