import { Trash2, Bell, BellOff } from 'lucide-react';
import { eventsForDay, format } from '@/lib/calendarUtils';
import type { CalendarEvent } from '@/types';
import { nl } from 'date-fns/locale';

interface EventSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDelete: (id: string) => void;
}

export default function EventSidebar({ selectedDate, events, onDelete }: EventSidebarProps) {
  const dayEvents = eventsForDay(events, selectedDate);

  return (
    <aside className="hidden xl:flex w-72 lg:w-80 flex-shrink-0 border-l border-nova-border bg-nova-dark flex-col min-h-0">
      <div className="p-4 border-b border-nova-border flex-shrink-0">
        <p className="text-[10px] text-nova-muted uppercase tracking-wider">Geselecteerde dag</p>
        <h2 className="text-sm font-semibold capitalize text-gray-100 mt-0.5">
          {format(selectedDate, 'EEEE d MMMM', { locale: nl })}
        </h2>
        <p className="text-xs text-nova-muted mt-1">
          {dayEvents.length} {dayEvents.length === 1 ? 'afspraak' : 'afspraken'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {dayEvents.length === 0 ? (
          <p className="text-nova-muted text-xs text-center py-8">Geen afspraken op deze dag</p>
        ) : (
          dayEvents.map((event) => (
            <div key={event.id} className="nova-panel p-3 flex items-start gap-2 min-w-0">
              <div className="w-1 self-stretch rounded-full bg-nova-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-nova-cyan font-mono">{event.time}</p>
                {event.description && (
                  <p className="text-xs text-nova-muted mt-1 line-clamp-3">{event.description}</p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                {event.reminder ? (
                  <Bell className="w-3 h-3 text-nova-blue" />
                ) : (
                  <BellOff className="w-3 h-3 text-nova-muted" />
                )}
                <button
                  onClick={() => onDelete(event.id)}
                  className="text-nova-muted hover:text-red-400 p-0.5"
                  title="Verwijderen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
