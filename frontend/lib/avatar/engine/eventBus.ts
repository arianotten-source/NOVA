import type { ContextEventType } from './types';

type Listener = (type: ContextEventType) => void;

class AvatarEventBus {
  private listeners = new Set<Listener>();

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(type: ContextEventType) {
    this.listeners.forEach((fn) => fn(type));
  }
}

export const avatarEventBus = new AvatarEventBus();

/** Future hooks: OpenAI, Calendar, Home Assistant, etc. */
export const avatarHooks = {
  onOpenAIThinking: () => avatarEventBus.emit('new_chat'),
  onTaskCompleted: () => avatarEventBus.emit('task_completed'),
  onSensorAlert: () => avatarEventBus.emit('sensor_warning'),
  onAgendaReminder: () => avatarEventBus.emit('agenda_reminder'),
  onNetworkOffline: () => avatarEventBus.emit('internet_offline'),
};
