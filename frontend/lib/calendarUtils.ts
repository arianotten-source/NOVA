import {
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';

export type CalendarView = 'list' | 'month' | 'week' | 'day';

export const WEEKDAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function capitalizeNl(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatViewTitle(date: Date, view: CalendarView): string {
  switch (view) {
    case 'list':
      return capitalizeNl(format(date, 'MMMM yyyy', { locale: nl }));
    case 'month':
      return capitalizeNl(format(date, 'MMMM yyyy', { locale: nl }));
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return capitalizeNl(
          `${format(start, 'd', { locale: nl })} – ${format(end, 'd MMMM yyyy', { locale: nl })}`
        );
      }
      return capitalizeNl(
        `${format(start, 'd MMM', { locale: nl })} – ${format(end, 'd MMM yyyy', { locale: nl })}`
      );
    }
    case 'day':
      return capitalizeNl(format(date, 'EEEE d MMMM yyyy', { locale: nl }));
  }
}

export function buildMonthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function buildWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function navigateDate(date: Date, view: CalendarView, direction: -1 | 1): Date {
  switch (view) {
    case 'list':
    case 'month':
      return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
    case 'week':
      return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case 'day':
      return addDays(date, direction);
  }
}

export function parseEventDate(event: CalendarEvent): Date {
  return parseISO(event.date);
}

export function parseEventTime(event: CalendarEvent): number {
  const [h, m] = event.time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((e) => isSameDay(parseEventDate(e), day))
    .sort((a, b) => parseEventTime(a) - parseEventTime(b));
}

export function sortedEventsInMonth(events: CalendarEvent[], month: Date): CalendarEvent[] {
  return events
    .filter((e) => isSameMonth(parseEventDate(e), month))
    .sort((a, b) => {
      const dayDiff = parseEventDate(a).getTime() - parseEventDate(b).getTime();
      if (dayDiff !== 0) return dayDiff;
      return parseEventTime(a) - parseEventTime(b);
    });
}

export function isCurrentMonth(day: Date, month: Date): boolean {
  return isSameMonth(day, month);
}

export { isSameDay, isToday, format };
