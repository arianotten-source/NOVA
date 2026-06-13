import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useMemory } from '@/context/MemoryContext';
import { generateId, cn } from '@/lib/utils';
import type { Task } from '@/types';

const STATUS_LABELS: Record<Task['status'], string> = {
  open: 'Open',
  in_progress: 'Bezig',
  completed: 'Voltooid',
};

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Laag',
  medium: 'Normaal',
  high: 'Hoog',
};

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'text-gray-400',
  medium: 'text-nova-blue',
  high: 'text-red-400',
};

export default function Tasks() {
  const { state, loaded, saveTasks } = useMemory();
  const tasks = state.tasks;
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  async function handleAdd() {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    await saveTasks([...tasks, task]);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setShowForm(false);
  }

  async function updateStatus(id: string, status: Task['status']) {
    const next = tasks.map((t) =>
      t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
    );
    await saveTasks(next);
  }

  async function handleDelete(id: string) {
    await saveTasks(tasks.filter((t) => t.id !== id));
  }

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-nova-muted text-sm">
        Geheugen laden...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 w-full min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Taken</h1>
          <button onClick={() => setShowForm(!showForm)} className="nova-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nieuwe taak
          </button>
        </div>

        <div className="flex gap-2">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === s ? 'bg-nova-blue/10 text-nova-cyan border border-nova-blue/20' : 'text-nova-muted hover:text-gray-300'
              )}
            >
              {s === 'all' ? 'Alle' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="nova-panel p-5 space-y-4">
            <input className="nova-input" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="nova-input resize-none h-20" placeholder="Omschrijving" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select className="nova-input" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              <option value="low">Laag</option>
              <option value="medium">Normaal</option>
              <option value="high">Hoog</option>
            </select>
            <button onClick={handleAdd} className="nova-btn-primary">Toevoegen</button>
          </div>
        )}

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-nova-muted text-sm text-center py-8">Geen taken gevonden</p>}
          {filtered.map((task) => (
            <div key={task.id} className="nova-card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn('font-medium', task.status === 'completed' && 'line-through text-nova-muted')}>
                    {task.title}
                  </h3>
                  <span className={cn('text-[10px] font-medium', PRIORITY_COLORS[task.priority])}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                {task.description && <p className="text-sm text-nova-muted">{task.description}</p>}
              </div>
              <select
                className="nova-input w-auto text-xs py-1.5"
                value={task.status}
                onChange={(e) => updateStatus(task.id, e.target.value as Task['status'])}
              >
                <option value="open">Open</option>
                <option value="in_progress">Bezig</option>
                <option value="completed">Voltooid</option>
              </select>
              <button onClick={() => handleDelete(task.id)} className="p-2 text-nova-muted hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
