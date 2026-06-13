import { useCallback } from 'react';
import { useMemory } from '@/context/MemoryContext';
import type { AppSettings } from '@/types';

export function useSettings() {
  const { state, loaded, savePreferences } = useMemory();

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const next = { ...state.preferences, ...updates };
      await savePreferences(next);
    },
    [state.preferences, savePreferences]
  );

  return { settings: state.preferences, loaded, updateSettings };
}
