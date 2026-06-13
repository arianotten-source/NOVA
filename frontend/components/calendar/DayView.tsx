import { cn } from '@/lib/utils';
import {
  eventsForDay,
  isToday,
  format,
  HOURS,
  parseEventTime,
} from '@/lib/calendarUtils';
import type { CalendarEvent } from '@/types';
import { nl } from 'date-fns/locale';

interface DayViewProps {
  focusDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const SLOT_H = 56;

export default function DayView({ focusDate, events, onEventClick }: DayViewProps) {
  const dayEvents = eventsForDay(events, focusDate);
  const today = isToday(focusDate);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 py-3 px-4 border-b border-nova-border">
        <p className="text-[10px] text-nova-muted capitalize">
          {format(focusDate, 'EEEE', { locale: nl })}
        </p>
        <p className={cn('text-2xl font-semibold', today ? 'text-nova-cyan' : 'text-gray-100')}>
          {format(focusDate, 'd MMMM yyyy', { locale: nl })}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[52px_1fr]" style={{ minHeight: HOURS.length * SLOT_H }}>
          <div className="relative border-r border-nova-border/50">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 text-[10px] text-nova-muted -translate-y-1/2"
                style={{ top: hour * SLOT_H }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-nova-border/20"
                style={{ top: hour * SLOT_H, height: SLOT_H }}
              />
            ))}
            {dayEvents.map((event) => {
              const top = (parseEventTime(event) / 60) * SLOT_H;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className="absolute left-2 right-2 rounded-lg px-3 py-2 text-left bg-nova-blue/15 border border-nova-blue/30 hover:bg-nova-blue/25 z-10"
                  style={{ top: top + 2, minHeight: SLOT_H - 4 }}
                >
                  <p className="text-sm font-medium text-nova-cyan">{event.title}</p>
                  <p className="text-xs text-nova-muted">{event.time}</p>
                  {event.description && (
                    <p className="text-xs text-nova-muted mt-1 line-clamp-2">{event.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
