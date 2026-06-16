import { Link } from 'react-router-dom';
import { StickyNote, CheckSquare } from 'lucide-react';
import type { Note, Task } from '@/types';

interface NovaQuickListsProps {
  notes: Note[];
  tasks: Task[];
}

export default function NovaQuickLists({ notes, tasks }: NovaQuickListsProps) {
  const topTasks = tasks.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <section className="nova-panel p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-nova-cyan flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5" />
            Recente notities
          </h3>
          <Link to="/notes" className="text-[10px] text-nova-blue hover:text-nova-cyan">
            Alles →
          </Link>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-nova-muted py-2">Geen notities.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="p-2 rounded-lg bg-nova-dark border border-nova-border">
                <p className="text-sm font-medium truncate">{note.title || 'Zonder titel'}</p>
                <p className="text-xs text-nova-muted truncate">{note.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="nova-panel p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-nova-cyan flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5" />
            Open taken
          </h3>
          <Link to="/tasks" className="text-[10px] text-nova-blue hover:text-nova-cyan">
            Alles →
          </Link>
        </div>
        {topTasks.length === 0 ? (
          <p className="text-sm text-nova-muted py-2">Geen open taken.</p>
        ) : (
          <ul className="space-y-2">
            {topTasks.map((task) => (
              <li key={task.id} className="p-2 rounded-lg bg-nova-dark border border-nova-border flex items-center justify-between gap-2 min-h-[44px]">
                <span className="text-sm truncate">{task.title}</span>
                <span className="text-[10px] text-nova-muted uppercase shrink-0">{task.priority}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
