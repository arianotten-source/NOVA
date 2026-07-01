import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { avatarService } from '@/services/avatarService';
import type {
  AvatarAnimationId,
  AvatarExpressionId,
  AvatarSettings,
  AvatarStatus,
  AutoEmotionId,
} from '@/types/avatar';

interface AvatarContextValue {
  status: AvatarStatus | null;
  loading: boolean;
  pulseKey: number;
  setExpression: (id: AvatarExpressionId) => Promise<void>;
  setAnimation: (id: AvatarAnimationId) => Promise<void>;
  reset: () => Promise<void>;
  clearOled: () => Promise<void>;
  testConnection: () => Promise<string>;
  testExpression: () => Promise<void>;
  testAnimation: () => Promise<void>;
  randomEmotion: () => Promise<void>;
  updateSettings: (partial: Partial<AvatarSettings>) => Promise<void>;
  toggleAutoEmotion: (id: AutoEmotionId, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AvatarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);

  const refresh = useCallback(async () => {
    const next = await avatarService.getStatus();
    setStatus(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bump = useCallback(() => setPulseKey((k) => k + 1), []);

  const setExpression = useCallback(
    async (id: AvatarExpressionId) => {
      const next = await avatarService.play({ type: 'expression', id });
      setStatus(next);
      bump();
    },
    [bump]
  );

  const setAnimation = useCallback(
    async (id: AvatarAnimationId) => {
      const next = await avatarService.playAnimation(id);
      setStatus(next);
      bump();
    },
    [bump]
  );

  const reset = useCallback(async () => {
    setStatus(await avatarService.reset());
    bump();
  }, [bump]);

  const clearOled = useCallback(async () => {
    setStatus(await avatarService.clearOled());
  }, []);

  const testConnection = useCallback(async () => {
    const result = await avatarService.testConnection();
    await refresh();
    return result.message;
  }, [refresh]);

  const testExpression = useCallback(async () => {
    await setExpression('verrast');
    window.setTimeout(() => setExpression('blij'), 1200);
  }, [setExpression]);

  const testAnimation = useCallback(async () => {
    await setAnimation('knipperen');
    window.setTimeout(() => setAnimation('idle'), 1500);
  }, [setAnimation]);

  const randomEmotion = useCallback(async () => {
    const payload = avatarService.randomExpression();
    const next = await avatarService.play(payload);
    setStatus(next);
    bump();
  }, [bump]);

  const updateSettings = useCallback(async (partial: Partial<AvatarSettings>) => {
    setStatus(await avatarService.updateSettings(partial));
  }, []);

  const toggleAutoEmotion = useCallback(async (id: AutoEmotionId, enabled: boolean) => {
    setStatus(await avatarService.updateAutoEmotions({ [id]: enabled }));
  }, []);

  const value = useMemo(
    () => ({
      status,
      loading,
      pulseKey,
      setExpression,
      setAnimation,
      reset,
      clearOled,
      testConnection,
      testExpression,
      testAnimation,
      randomEmotion,
      updateSettings,
      toggleAutoEmotion,
      refresh,
    }),
    [
      status,
      loading,
      pulseKey,
      setExpression,
      setAnimation,
      reset,
      clearOled,
      testConnection,
      testExpression,
      testAnimation,
      randomEmotion,
      updateSettings,
      toggleAutoEmotion,
      refresh,
    ]
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider');
  return ctx;
}
