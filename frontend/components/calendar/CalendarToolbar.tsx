import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarView } from '@/lib/calendarUtils';

interface CalendarToolbarProps {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
}

const DESKTOP_VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'list', label: 'Lijst' },
  { id: 'day', label: 'Dag' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Maand' },
];

const MOBILE_VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'list', label: 'Lijst' },
  { id: 'month', label: 'Maand' },
];

export default function CalendarToolbar({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewEvent,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-3 flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 min-w-0">
        <button onClick={onPrev} className="nova-btn-ghost p-2 flex-shrink-0" aria-label="Vorige">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onNext} className="nova-btn-ghost p-2 flex-shrink-0" aria-label="Volgende">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onToday} className="nova-btn-ghost px-2 sm:px-3 text-xs flex-shrink-0">
          Vandaag
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-100 truncate ml-1 min-w-0">{title}</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg border border-nova-border overflow-hidden">
          {MOBILE_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium transition-colors xl:hidden',
                view === id
                  ? 'bg-nova-blue/15 text-nova-cyan'
                  : 'text-nova-muted hover:text-gray-300 hover:bg-nova-panel'
              )}
            >
              {label}
            </button>
          ))}
          {DESKTOP_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={cn(
                'hidden xl:block px-3 py-1.5 text-xs font-medium transition-colors',
                view === id
                  ? 'bg-nova-blue/15 text-nova-cyan'
                  : 'text-nova-muted hover:text-gray-300 hover:bg-nova-panel'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={onNewEvent}
          className="nova-btn-primary flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-3"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nieuwe afspraak</span>
          <span className="sm:hidden">Nieuw</span>
        </button>
      </div>
    </div>
  );
}
