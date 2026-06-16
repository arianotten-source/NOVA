import { useEffect, useMemo, useState } from 'react';
import { useMemory } from '@/context/MemoryContext';
import { useSensors } from '@/hooks/useSensors';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useSettings } from '@/hooks/useSettings';
import { readStorage } from '@/lib/storage';
import { eventsForDay } from '@/lib/calendarUtils';
import { getSensorStats } from '@/lib/sensorUtils';
import type { CalendarEvent } from '@/types';

export function useDashboardData() {
  const { state, loaded: memoryLoaded } = useMemory();
  const { settings } = useSettings();
  const stats = useSystemStats();
  const { devices, alerts, loading: sensorsLoading } = useSensors();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useEffect(() => {
    readStorage<CalendarEvent[]>('events', []).then((data) => {
      setEvents(data);
      setEventsLoaded(true);
    });
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayEvents = useMemo(() => eventsForDay(events, today), [events, today]);

  const openTasks = useMemo(
    () => state.tasks.filter((t) => t.status !== 'completed'),
    [state.tasks]
  );

  const completedTasks = useMemo(
    () => state.tasks.filter((t) => t.status === 'completed'),
    [state.tasks]
  );

  const remindersToday = useMemo(
    () => todayEvents.filter((e) => e.reminder),
    [todayEvents]
  );

  const sensorStats = useMemo(() => getSensorStats(devices), [devices]);
  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.level !== 'green').length,
    [alerts]
  );

  const recentNotes = useMemo(
    () =>
      [...state.notes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [state.notes]
  );

  const recentConversations = useMemo(
    () =>
      [...state.episodic]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [state.episodic]
  );

  const overview = useMemo(
    () => ({
      agendaToday: todayEvents.length,
      notes: state.notes.length,
      openTasks: openTasks.length,
      reminders: remindersToday.length,
      systemOk: stats.network.online && stats.cpu < 90,
      cpu: stats.cpu,
      networkOnline: stats.network.online,
    }),
    [todayEvents.length, state.notes.length, openTasks.length, remindersToday.length, stats]
  );

  const intelligence = useMemo(
    () => ({
      memoryEntries: state.notes.length + state.tasks.length + state.semantic.length,
      semanticCount: state.semantic.length,
      conversations: state.episodic.length,
      sensorsOnline: `${sensorStats.onlineCount}/${sensorStats.totalCount}`,
      sensorsLoading,
      activeAlerts,
      aiProvider: settings.aiProvider,
      voiceEnabled: settings.voiceEnabled,
      completedTasks: completedTasks.length,
      totalTasks: state.tasks.length,
    }),
    [
      state,
      sensorStats,
      sensorsLoading,
      activeAlerts,
      settings,
      completedTasks.length,
    ]
  );

  return {
    loaded: memoryLoaded && eventsLoaded,
    settings,
    stats,
    todayEvents,
    recentNotes,
    openTasks,
    recentConversations,
    devices,
    alerts,
    overview,
    intelligence,
  };
}
