import { X } from 'lucide-react';
import { format } from '@/lib/calendarUtils';
import { nl } from 'date-fns/locale';

interface EventFormModalProps {
  open: boolean;
  date: Date;
  title: string;
  description: string;
  time: string;
  reminder: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onReminderChange: (v: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EventFormModal({
  open,
  date,
  title,
  description,
  time,
  reminder,
  onTitleChange,
  onDescriptionChange,
  onTimeChange,
  onReminderChange,
  onSave,
  onClose,
}: EventFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="nova-panel w-full max-w-md p-5 space-y-4 shadow-neon-strong"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-nova-cyan">Nieuwe afspraak</h2>
            <p className="text-xs text-nova-muted capitalize mt-0.5">
              {format(date, 'EEEE d MMMM yyyy', { locale: nl })}
            </p>
          </div>
          <button onClick={onClose} className="nova-btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          className="nova-input text-sm"
          placeholder="Titel"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          autoFocus
        />
        <textarea
          className="nova-input text-sm resize-none h-20"
          placeholder="Omschrijving (optioneel)"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        <input
          type="time"
          className="nova-input text-sm"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={reminder}
            onChange={(e) => onReminderChange(e.target.checked)}
            className="accent-nova-blue"
          />
          Herinnering
        </label>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="nova-btn-ghost flex-1 text-sm">Annuleren</button>
          <button onClick={onSave} className="nova-btn-primary flex-1 text-sm" disabled={!title.trim()}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}
