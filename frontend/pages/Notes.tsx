import { useState } from 'react';
import { Plus, Search, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useMemory } from '@/context/MemoryContext';
import { generateId, cn } from '@/lib/utils';
import type { Note } from '@/types';

export default function Notes() {
  const { state, loaded, saveNotes } = useMemory();
  const notes = state.notes;
  const [selected, setSelected] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mobileEditing, setMobileEditing] = useState(false);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  function selectNote(note: Note) {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
    setMobileEditing(true);
  }

  function handleNew() {
    const note: Note = {
      id: generateId(),
      title: 'Nieuwe notitie',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelected(note);
    setTitle(note.title);
    setContent('');
    setMobileEditing(true);
  }

  function closeEditor() {
    setMobileEditing(false);
    setSelected(null);
    setTitle('');
    setContent('');
  }

  async function handleSave() {
    if (!selected) return;
    const now = new Date().toISOString();
    const updated: Note = { ...selected, title, content, updatedAt: now };
    const exists = notes.find((n) => n.id === selected.id);
    const next = exists ? notes.map((n) => (n.id === selected.id ? updated : n)) : [...notes, updated];
    setSelected(updated);
    await saveNotes(next);
  }

  async function handleDelete(id: string) {
    const next = notes.filter((n) => n.id !== id);
    if (selected?.id === id) closeEditor();
    await saveNotes(next);
  }

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-nova-muted text-sm">
        Geheugen laden...
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden min-w-0">
      {/* Lijst — volledige breedte op mobiel */}
      <div
        className={cn(
          'flex flex-col bg-nova-dark min-w-0 overflow-hidden',
          'w-full md:w-72 md:border-r md:border-nova-border',
          mobileEditing && selected && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b border-nova-border space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Notities</h2>
            <button onClick={handleNew} className="nova-btn-ghost p-1.5">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nova-muted" />
            <input
              className="nova-input pl-9 text-sm py-2"
              placeholder="Zoeken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 min-h-0">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer text-sm min-w-0',
                selected?.id === note.id ? 'bg-nova-blue/10 text-nova-cyan' : 'text-gray-400 hover:bg-nova-panel'
              )}
              onClick={() => selectNote(note)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{note.title}</p>
                <p className="text-[10px] text-nova-muted truncate">{note.content || 'Leeg'}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                className="p-1 hover:text-red-400 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor — fullscreen op mobiel */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 min-h-0',
          !selected && 'hidden md:flex',
          mobileEditing && selected && 'fixed inset-0 z-50 md:relative md:inset-auto flex bg-nova-black md:bg-transparent'
        )}
      >
        {selected ? (
          <>
            <div className="flex items-center gap-2 p-3 md:p-0 md:mb-4 md:pt-6 md:px-6 border-b md:border-0 border-nova-border flex-shrink-0">
              <button
                type="button"
                onClick={closeEditor}
                className="md:hidden nova-btn-ghost p-2 -ml-1 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                className="text-lg md:text-xl font-semibold bg-transparent border-none outline-none text-gray-100 flex-1 min-w-0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={handleSave} className="nova-btn-primary flex items-center gap-2 flex-shrink-0 text-sm">
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Opslaan</span>
              </button>
            </div>
            <textarea
              className="flex-1 nova-input resize-none leading-relaxed m-3 md:m-0 md:mx-6 md:mb-6 border-0 md:border rounded-none md:rounded-lg min-h-0"
              placeholder="Schrijf je notitie..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </>
        ) : (
          <div className="hidden md:flex items-center justify-center h-full text-nova-muted p-6">
            <p>Selecteer een notitie of maak een nieuwe aan</p>
          </div>
        )}
      </div>
    </div>
  );
}
