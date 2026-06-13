import { cn } from '@/lib/utils';
import {
  buildMonthGrid,
  eventsForDay,
  isCurrentMonth,
  isSameDay,
  isToday,
  format,
  WEEKDAYS_SHORT,
} from '@/lib/calendarUtils';
import type { CalendarEvent } from '@/types';

interface MonthViewProps {
  focusDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function MonthView({
  focusDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
}: MonthViewProps) {
  const days = buildMonthGrid(focusDate);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="grid grid-cols-7 border-b border-nova-border flex-shrink-0">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-medium text-nova-muted uppercase">
            {d}
          </div>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 grid grid-cols-7"
        style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
      >
        {days.map((day) => {
          const inMonth = isCurrentMonth(day, focusDate);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const dayEvents = eventsForDay(events, day);

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(day)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectDate(day)}
              className={cn(
                'border-b border-r border-nova-border/50 p-1 min-h-0 min-w-0 cursor-pointer',
                'flex flex-col overflow-hidden',
                !inMonth && 'bg-nova-black/50',
                selected && 'bg-nova-blue/8 ring-1 ring-inset ring-nova-blue/30',
                inMonth && !selected && 'hover:bg-nova-panel/40'
              )}
            >
              <div className="flex justify-end flex-shrink-0 mb-0.5">
                <span
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-xs',
                    !inMonth && 'text-nova-muted/50',
                    inMonth && !today && 'text-gray-300',
                    today && 'bg-nova-cyan text-nova-black font-bold',
                    selected && !today && 'text-nova-cyan font-semibold'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className="w-full text-left truncate rounded px-1 py-px text-[10px] leading-tight bg-nova-blue/15 text-nova-blue border border-nova-blue/20 hover:bg-nova-blue/25"
                    title={`${event.time} ${event.title}`}
                  >
                    <span className="font-medium">{event.time}</span> {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[9px] text-nova-muted px-1">+{dayEvents.length - 3} meer</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
