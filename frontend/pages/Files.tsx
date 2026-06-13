import { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ArrowLeft } from 'lucide-react';
import { listFiles } from '@/lib/storage';
import { formatBytes } from '@/lib/utils';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
}

export default function Files() {
  const [currentDir, setCurrentDir] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [content, setContent] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadDir(currentDir);
  }, [currentDir]);

  async function loadDir(dir: string) {
    const data = await listFiles(dir);
    setEntries(data.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    }));
    setContent(null);
    setSelectedFile(null);
  }

  async function handleClick(entry: FileEntry) {
    if (entry.isDirectory) {
      setCurrentDir(entry.path);
    } else {
      setSelectedFile(entry.path);
      if (window.nova?.files) {
        const text = await window.nova.files.read(entry.path);
        setContent(text);
      } else {
        setContent('Bestanden bekijken is alleen beschikbaar in de Electron app.');
      }
    }
  }

  function goUp() {
    const parts = currentDir.split('/').filter(Boolean);
    parts.pop();
    setCurrentDir(parts.join('/'));
  }

  const breadcrumbs = currentDir ? currentDir.split('/') : [];

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-80 border-r border-nova-border bg-nova-dark flex flex-col">
        <div className="p-4 border-b border-nova-border">
          <h2 className="text-sm font-semibold mb-2">Bestanden</h2>
          <div className="flex items-center gap-1 text-xs text-nova-muted">
            {currentDir && (
              <button onClick={goUp} className="hover:text-nova-cyan p-1">
                <ArrowLeft className="w-3 h-3" />
              </button>
            )}
            <span className="text-nova-cyan">data</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                {crumb}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {entries.map((entry) => (
            <button
              key={entry.path}
              onClick={() => handleClick(entry)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                selectedFile === entry.path ? 'bg-nova-blue/10 text-nova-cyan' : 'text-gray-400 hover:bg-nova-panel'
              }`}
            >
              {entry.isDirectory ? <Folder className="w-4 h-4 text-nova-blue flex-shrink-0" /> : <File className="w-4 h-4 text-nova-muted flex-shrink-0" />}
              <span className="flex-1 truncate">{entry.name}</span>
              {!entry.isDirectory && <span className="text-[10px] text-nova-muted">{formatBytes(entry.size)}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {content !== null ? (
          <pre className="nova-panel p-5 text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {content}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-nova-muted">
            <p>Selecteer een bestand om te bekijken</p>
          </div>
        )}
      </div>
    </div>
  );
}
