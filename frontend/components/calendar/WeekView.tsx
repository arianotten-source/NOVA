import { cn } from '@/lib/utils';
import {
  buildWeekDays,
  eventsForDay,
  isSameDay,
  isToday,
  format,
  HOURS,
  parseEventTime,
} from '@/lib/calendarUtils';
import type { CalendarEvent } from '@/types';
import { nl } from 'date-fns/locale';

interface WeekViewProps {
  focusDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const SLOT_H = 48;

export default function WeekView({
  focusDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
}: WeekViewProps) {
  const weekDays = buildWeekDays(focusDate);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-nova-border flex-shrink-0">
        <div />
        {weekDays.map((day) => {
          const today = isToday(day);
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'py-2 text-center border-l border-nova-border/50 transition-colors min-w-0',
                selected && 'bg-nova-blue/10',
                !selected && 'hover:bg-nova-panel/40'
              )}
            >
              <p className="text-[10px] text-nova-muted capitalize">
                {format(day, 'EEE', { locale: nl })}
              </p>
              <p
                className={cn(
                  'text-sm font-medium mx-auto w-7 h-7 flex items-center justify-center rounded-full',
                  today && 'bg-nova-cyan text-nova-black',
                  !today && selected && 'text-nova-cyan',
                  !today && !selected && 'text-gray-200'
                )}
              >
                {format(day, 'd')}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))]" style={{ height: HOURS.length * SLOT_H }}>
          <div className="relative border-r border-nova-border/50">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-1 text-[10px] text-nova-muted -translate-y-1/2"
                style={{ top: hour * SLOT_H }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dayEvents = eventsForDay(events, day);
            const selected = isSameDay(day, selectedDate);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative border-l border-nova-border/50',
                  selected && 'bg-nova-blue/5'
                )}
              >
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
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] text-left bg-nova-blue/20 border border-nova-blue/30 text-nova-cyan hover:bg-nova-blue/30 z-10 truncate"
                      style={{ top: top + 1, height: SLOT_H - 2 }}
                    >
                      <span className="font-medium">{event.time}</span> {event.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
