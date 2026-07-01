import type { AvatarStateId, ContextEvent, ContextEventType } from './types';

const EVENT_STATE_MAP: Record<ContextEventType, { state: AvatarStateId; durationMs: number; priority: number }> = {
  new_chat: { state: 'happy', durationMs: 3500, priority: 68 },
  task_completed: { state: 'excited', durationMs: 4000, priority: 72 },
  alarm: { state: 'surprised', durationMs: 2800, priority: 78 },
  internet_offline: { state: 'concerned', durationMs: 6000, priority: 58 },
  sensor_warning: { state: 'concerned', durationMs: 5000, priority: 62 },
  agenda_reminder: { state: 'happy', durationMs: 3500, priority: 55 },
  inactivity: { state: 'sleeping', durationMs: 30000, priority: 42 },
  low_battery: { state: 'concerned', durationMs: 5000, priority: 57 },
  user_returned: { state: 'happy', durationMs: 3000, priority: 52 },
  user_left: { state: 'idle', durationMs: 2000, priority: 30 },
};

export interface ActiveContextState {
  state: AvatarStateId;
  until: number;
  priority: number;
  event: ContextEvent;
}

export class ContextEngine {
  private queue: ContextEvent[] = [];
  private active: ActiveContextState | null = null;
  lastEvent: ContextEvent | null = null;

  push(type: ContextEventType, now: number, priority?: number) {
    this.queue.push({ type, timestamp: now, priority });
  }

  update(now: number): ActiveContextState | null {
    while (this.queue.length) {
      const ev = this.queue.shift()!;
      const mapped = EVENT_STATE_MAP[ev.type];
      if (!mapped) continue;
      const pr = ev.priority ?? mapped.priority;
      if (!this.active || pr >= this.active.priority || now >= this.active.until) {
        this.active = {
          state: mapped.state,
          until: now + mapped.durationMs,
          priority: pr,
          event: ev,
        };
        this.lastEvent = ev;
      }
    }

    if (this.active && now >= this.active.until) {
      this.active = null;
    }

    return this.active;
  }

  clear() {
    this.queue = [];
    this.active = null;
  }
}
