import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar } from 'lucide-react';
import type { CalendarEvent } from '@/types';

const TOP_N = 5;

interface NovaTodayAgendaProps {
  events: CalendarEvent[];
}

export default function NovaTodayAgenda({ events }: NovaTodayAgendaProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? events : events.slice(0, TOP_N);
  const hasMore = events.length > TOP_N;

  return (
    <section className="nova-panel p-4 space-y-3" aria-label="Agenda vandaag">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-nova-cyan">Agenda vandaag</h3>
        <span className="text-xs text-nova-muted px-2 py-0.5 rounded-full bg-nova-dark border border-nova-border">
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-nova-muted text-center py-4">Geen afspraken vandaag.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-nova-dark border border-nova-border min-h-[48px]"
            >
              <span className="text-sm font-mono text-nova-cyan w-12 shrink-0">{event.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                {event.description ? (
                  <p className="text-xs text-nova-muted truncate">{event.description}</p>
                ) : null}
              </div>
              {event.reminder ? (
                <Bell className="w-4 h-4 text-nova-blue shrink-0" aria-label="Herinnering" />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <button
          type="button"
          className="w-full min-h-[44px] rounded-lg border border-dashed border-nova-blue/30 bg-nova-blue/5 text-nova-cyan text-sm font-semibold touch-manipulation"
          onClick={() => setShowAll((p) => !p)}
        >
          {showAll ? 'Toon minder' : 'Toon alle afspraken'}
        </button>
      ) : null}

      <Link
        to="/agenda"
        className="flex items-center justify-center gap-2 min-h-[44px] text-sm text-nova-blue hover:text-nova-cyan transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Open agenda
      </Link>
    </section>
  );
}
