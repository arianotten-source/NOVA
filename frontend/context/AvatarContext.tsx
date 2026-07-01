import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { avatarService } from '@/services/avatarService';
import { avatarEngine } from '@/lib/avatar/engine/AvatarEngine';
import { avatarEventBus } from '@/lib/avatar/engine/eventBus';
import { buildRenderPose } from '@/lib/avatar/engine/EmotionEngine';
import { cameraEngine } from '@/lib/avatar/engine/CameraEngine';
import type { AvatarEngineSnapshot, CameraSignals, SystemSignals, VoiceSignals } from '@/lib/avatar/engine/types';
import type { ContextEventType } from '@/lib/avatar/engine/types';
import { useSensors } from '@/hooks/useSensors';
import { useSystemStats } from '@/hooks/useSystemStats';
import type {
  AvatarAnimationId,
  AvatarExpressionId,
  AvatarSettings,
  AvatarStatus,
  AutoEmotionId,
} from '@/types/avatar';
import { getExpressionById } from '@/lib/avatar/catalog';
import {
  loadPresenceProfile,
  savePresenceProfile,
  recordInteraction,
  adaptVoicePace,
} from '@/lib/avatar/presence/PresenceMemory';
import type { PresenceProfile, PresenceSettings, EnvironmentContext } from '@/lib/avatar/presence/types';
import { DEFAULT_PRESENCE_PROFILE, DEFAULT_PRESENCE_SETTINGS } from '@/lib/avatar/presence/types';
import { readStorage } from '@/lib/storage';
import { eventsForDay, parseEventDate, parseEventTime } from '@/lib/calendarUtils';
import type { CalendarEvent } from '@/types';
import type { PresenceSnapshot } from '@/lib/avatar/presence/types';

interface AvatarContextValue {
  status: AvatarStatus | null;
  loading: boolean;
  engineSnapshot: AvatarEngineSnapshot | null;
  voiceSignals: VoiceSignals;
  cameraSignals: CameraSignals;
  systemSignals: SystemSignals;
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
  dispatchContextEvent: (type: ContextEventType) => void;
  setVoiceSignals: (partial: Partial<VoiceSignals>) => void;
  setThinking: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  enableCamera: () => Promise<void>;
  disableCamera: () => void;
  presenceSnapshot: PresenceSnapshot | null;
  presenceProfile: PresenceProfile;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

const DEFAULT_VOICE: VoiceSignals = {
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  speechEnergy: 0.5,
  userTalking: false,
};

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AvatarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [engineSnapshot, setEngineSnapshot] = useState<AvatarEngineSnapshot | null>(null);
  const [voiceSignals, setVoiceSignalsState] = useState<VoiceSignals>(DEFAULT_VOICE);
  const [cameraSignals, setCameraSignals] = useState<CameraSignals>(cameraEngine.getSignals());
  const [manualExpressionId, setManualExpressionId] = useState<AvatarExpressionId | null>(null);
  const [manualAnimationId, setManualAnimationId] = useState<AvatarAnimationId | null>(null);
  const [presenceProfile, setPresenceProfile] = useState<PresenceProfile>(DEFAULT_PRESENCE_PROFILE);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const lastActivityRef = useRef(Date.now());
  const rafRef = useRef(0);

  const stats = useSystemStats();
  const { alerts, devices } = useSensors(30000);
  const [battery, setBattery] = useState<{ level: number | null; charging: boolean }>({
    level: null,
    charging: false,
  });

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, fn: () => void) => void;
        removeEventListener: (type: string, fn: () => void) => void;
      }>;
    };
    nav.getBattery?.().then((b) => {
      const update = () =>
        setBattery({ level: Math.round(b.level * 100), charging: b.charging });
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = cameraEngine.subscribe(setCameraSignals);
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    loadPresenceProfile().then(setPresenceProfile);
    readStorage<CalendarEvent[]>('events', []).then(setCalendarEvents);
  }, []);

  useEffect(() => {
    if (status?.settings.cameraEnabled && cameraSignals.permission === 'prompt') {
      cameraEngine.requestAccess();
    }
    if (status?.settings.cameraEnabled === false && cameraSignals.available) {
      cameraEngine.stop();
    }
  }, [status?.settings.cameraEnabled, cameraSignals.permission, cameraSignals.available]);

  const refresh = useCallback(async () => {
    const next = await avatarService.getStatus();
    if (!next.settings.autonomousAvatar && next.settings.autonomousAvatar !== false) {
      next.settings.autonomousAvatar = true;
    }
    setStatus(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (type: ContextEventType) => {
      avatarEngine.pushContext(type, Date.now());
      lastActivityRef.current = Date.now();
    };
    const unsub = avatarEventBus.on(handler);
    return () => {
      unsub();
    };
  }, []);

  const systemSignals: SystemSignals = useMemo(
    () => ({
      cpu: stats.cpu,
      batteryLevel: battery.level,
      batteryCharging: battery.charging,
      networkOnline: stats.network.online,
      sensorAlerts: alerts.filter((a) => a.level !== 'green').length,
      microphoneActive: voiceSignals.isListening,
    }),
    [stats, battery, alerts, voiceSignals.isListening]
  );

  const environment: EnvironmentContext = useMemo(() => {
    const todayEvents = eventsForDay(calendarEvents, new Date());
    const now = Date.now();
    const nextEvent = todayEvents
      .map((e) => ({
        event: e,
        start: parseEventDate(e).getTime() + parseEventTime(e) * 60000,
      }))
      .filter((e) => e.start > now)
      .sort((a, b) => a.start - b.start)[0];
    const agendaMinutesUntil = nextEvent
      ? Math.round((nextEvent.start - now) / 60000)
      : null;

    const avgTemp =
      devices.length > 0
        ? devices.reduce((sum, d) => sum + d.temperature, 0) / devices.length
        : null;
    const avgHumidity =
      devices.length > 0
        ? devices.reduce((sum, d) => sum + d.humidity, 0) / devices.length
        : null;

    return {
      temperature: avgTemp,
      humidity: avgHumidity,
      agendaMinutesUntil,
      weatherMood: 'unknown' as const,
    };
  }, [calendarEvents, devices]);

  const presenceSettings: PresenceSettings = useMemo(
    () => ({
      cameraEnabled: status?.settings.cameraEnabled ?? DEFAULT_PRESENCE_SETTINGS.cameraEnabled,
      presenceMemoryEnabled:
        status?.settings.presenceMemoryEnabled ?? DEFAULT_PRESENCE_SETTINGS.presenceMemoryEnabled,
      initiativeEnabled: status?.settings.initiativeEnabled ?? DEFAULT_PRESENCE_SETTINGS.initiativeEnabled,
      localProcessingOnly:
        status?.settings.localProcessingOnly ?? DEFAULT_PRESENCE_SETTINGS.localProcessingOnly,
    }),
    [status?.settings]
  );

  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      const settings = status?.settings;
      const autonomous = settings?.autonomousAvatar ?? true;

      const snapshot = avatarEngine.tick({
        autonomous,
        personality: settings?.personalityId ?? 'friendly',
        theme: settings?.theme ?? 'classic',
        voice: voiceSignals,
        camera: cameraSignals,
        system: systemSignals,
        manualExpressionId: autonomous ? null : manualExpressionId,
        manualAnimationId: autonomous ? null : manualAnimationId,
        lastActivityAt: lastActivityRef.current,
        now,
        presenceProfile: presenceSettings.presenceMemoryEnabled ? presenceProfile : DEFAULT_PRESENCE_PROFILE,
        presenceSettings,
        environment,
      });

      setEngineSnapshot(snapshot);

      if (status && autonomous) {
        const expr = getExpressionById(snapshot.pose.expressionId);
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                activeExpressionId: snapshot.pose.expressionId,
                expressionLabel: expr.name,
                activeAnimationId: (snapshot.pose.activeAnimation as AvatarAnimationId) || prev.activeAnimationId,
                animationLabel: snapshot.pose.activeAnimation,
              }
            : prev
        );
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    status?.settings,
    voiceSignals,
    cameraSignals,
    systemSignals,
    manualExpressionId,
    manualAnimationId,
    presenceProfile,
    presenceSettings,
    environment,
  ]);

  const setVoiceSignals = useCallback((partial: Partial<VoiceSignals>) => {
    setVoiceSignalsState((prev) => {
      const next = { ...prev, ...partial };
      if (partial.userTalking || partial.isListening) {
        const updated = recordInteraction(presenceProfile);
        const adapted = adaptVoicePace(updated, partial.speechEnergy ?? 0.5);
        if (presenceSettings.presenceMemoryEnabled) {
          setPresenceProfile(adapted);
          savePresenceProfile(adapted).catch(() => {});
        }
      }
      return next;
    });
    lastActivityRef.current = Date.now();
  }, [presenceProfile, presenceSettings.presenceMemoryEnabled]);

  const setThinking = useCallback((v: boolean) => {
    setVoiceSignals({ isThinking: v, isSpeaking: false });
  }, [setVoiceSignals]);

  const setSpeaking = useCallback((v: boolean) => {
    setVoiceSignals({ isSpeaking: v, isThinking: false, speechEnergy: v ? 0.7 : 0 });
  }, [setVoiceSignals]);

  const dispatchContextEvent = useCallback((type: ContextEventType) => {
    avatarEngine.pushContext(type, Date.now());
    lastActivityRef.current = Date.now();
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AvatarSettings>) => {
    const next = await avatarService.updateSettings(partial);
    setStatus(next);
    if (partial.autonomousAvatar === true) {
      setManualExpressionId(null);
      setManualAnimationId(null);
    }
  }, []);

  const setExpression = useCallback(
    async (id: AvatarExpressionId) => {
      lastActivityRef.current = Date.now();
      if (status?.settings.autonomousAvatar !== false) {
        await updateSettings({ autonomousAvatar: false });
      }
      setManualExpressionId(id);
      const next = await avatarService.play({ type: 'expression', id });
      setStatus(next);
    },
    [status?.settings.autonomousAvatar, updateSettings]
  );

  const setAnimation = useCallback(async (id: AvatarAnimationId) => {
    lastActivityRef.current = Date.now();
    if (status?.settings.autonomousAvatar !== false) {
      await updateSettings({ autonomousAvatar: false });
    }
    setManualAnimationId(id);
    const next = await avatarService.playAnimation(id);
    setStatus(next);
  }, [status?.settings.autonomousAvatar, updateSettings]);

  const reset = useCallback(async () => {
    setStatus(await avatarService.reset());
    setManualExpressionId(null);
    setManualAnimationId(null);
    avatarEngine.pushContext('user_returned', Date.now());
  }, []);

  const clearOled = useCallback(async () => {
    setStatus(await avatarService.clearOled());
  }, []);

  const testConnection = useCallback(async () => {
    const result = await avatarService.testConnection();
    await refresh();
    return result.message;
  }, [refresh]);

  const testExpression = useCallback(async () => {
    dispatchContextEvent('alarm');
    window.setTimeout(() => dispatchContextEvent('new_chat'), 1400);
  }, [dispatchContextEvent]);

  const testAnimation = useCallback(async () => {
    setVoiceSignals({ isSpeaking: true, speechEnergy: 0.8 });
    window.setTimeout(() => setVoiceSignals(DEFAULT_VOICE), 2000);
  }, [setVoiceSignals]);

  const randomEmotion = useCallback(async () => {
    const payload = avatarService.randomExpression();
    await setExpression(payload.id as AvatarExpressionId);
  }, [setExpression]);

  const toggleAutoEmotion = useCallback(async (id: AutoEmotionId, enabled: boolean) => {
    setStatus(await avatarService.updateAutoEmotions({ [id]: enabled }));
  }, []);

  const enableCamera = useCallback(async () => {
    await updateSettings({ cameraEnabled: true });
    await cameraEngine.requestAccess();
  }, [updateSettings]);

  const disableCamera = useCallback(() => {
    updateSettings({ cameraEnabled: false });
    cameraEngine.stop();
  }, [updateSettings]);

  const presenceSnapshot = engineSnapshot?.presence ?? null;

  const value = useMemo(
    () => ({
      status,
      loading,
      engineSnapshot,
      voiceSignals,
      cameraSignals,
      systemSignals,
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
      dispatchContextEvent,
      setVoiceSignals,
      setThinking,
      setSpeaking,
      enableCamera,
      disableCamera,
      presenceSnapshot,
      presenceProfile,
    }),
    [
      status,
      loading,
      engineSnapshot,
      voiceSignals,
      cameraSignals,
      systemSignals,
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
      dispatchContextEvent,
      setVoiceSignals,
      setThinking,
      setSpeaking,
      enableCamera,
      disableCamera,
      presenceSnapshot,
      presenceProfile,
    ]
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider');
  return ctx;
}

export function useAvatarPoseFallback(expressionId: AvatarExpressionId) {
  return buildRenderPose({
    happy: 0.4,
    curious: 0.1,
    sleepy: 0,
    sad: 0,
    concerned: 0,
    excited: 0.1,
    love: 0.05,
    neutral: 0.35,
    surprised: 0,
  }, { expressionId });
}
