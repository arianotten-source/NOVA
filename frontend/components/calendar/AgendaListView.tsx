import { Bell, BellOff, Trash2 } from 'lucide-react';
import {
  sortedEventsInMonth,
  parseEventDate,
  isSameDay,
  isToday,
  format,
} from '@/lib/calendarUtils';
import type { CalendarEvent } from '@/types';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AgendaListViewProps {
  focusDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onDelete: (id: string) => void;
}

export default function AgendaListView({
  focusDate,
  selectedDate,
  events,
  onSelectDate,
  onDelete,
}: AgendaListViewProps) {
  const monthEvents = sortedEventsInMonth(events, focusDate);

  let lastDayKey = '';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      {monthEvents.length === 0 ? (
        <p className="text-nova-muted text-sm text-center py-12 px-4">Geen afspraken deze maand</p>
      ) : (
        <div className="divide-y divide-nova-border/50">
          {monthEvents.map((event) => {
            const eventDate = parseEventDate(event);
            const dayKey = format(eventDate, 'yyyy-MM-dd');
            const showHeader = dayKey !== lastDayKey;
            lastDayKey = dayKey;
            const selected = isSameDay(eventDate, selectedDate);
            const today = isToday(eventDate);

            return (
              <div key={event.id}>
                {showHeader && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(eventDate)}
                    className={cn(
                      'w-full text-left px-4 py-3 bg-nova-dark/80 sticky top-0 z-10 border-b border-nova-border/30',
                      selected && 'bg-nova-blue/10'
                    )}
                  >
                    <p className={cn('text-sm font-semibold capitalize', today && 'text-nova-cyan')}>
                      {format(eventDate, 'EEEE d MMMM', { locale: nl })}
                    </p>
                  </button>
                )}
                <div className="flex items-start gap-3 px-4 py-3 min-w-0">
                  <div className="w-1 self-stretch rounded-full bg-nova-blue flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-nova-cyan font-mono">{event.time}</p>
                    {event.description && (
                      <p className="text-xs text-nova-muted mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {event.reminder ? (
                      <Bell className="w-3 h-3 text-nova-blue" />
                    ) : (
                      <BellOff className="w-3 h-3 text-nova-muted" />
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(event.id)}
                      className="text-nova-muted hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
