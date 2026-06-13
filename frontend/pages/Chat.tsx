import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { readStorage, writeStorage } from '@/lib/storage';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { generateId, cn } from '@/lib/utils';
import type { Conversation, ChatMessage } from '@/types';

function getAssistantResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('hallo') || lower.includes('hoi') || lower.includes('hey')) {
    return 'Hallo! Ik ben N.O.V.A., je persoonlijke assistent. Hoe kan ik je helpen?';
  }
  if (lower.includes('tijd') || lower.includes('hoe laat')) {
    return `Het is nu ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}.`;
  }
  if (lower.includes('datum') || lower.includes('welke dag')) {
    return `Vandaag is het ${new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
  }
  if (lower.includes('help') || lower.includes('helpen')) {
    return 'Ik kan je helpen met notities, taken, agenda en systeeminformatie. AI-integratie komt binnenkort beschikbaar.';
  }

  return 'Ik begrijp je vraag. Volledige AI-integratie (OpenAI / lokale LLM) wordt binnenkort toegevoegd.';
}

type MobileScreen = 'list' | 'chat';

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, toggleListening, clearTranscript } = useSpeechRecognition();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    const data = await readStorage<Conversation[]>('conversations', []);
    setConversations(data);
  }

  async function saveConversation(msgs: ChatMessage[], convId: string) {
    const all = await readStorage<Conversation[]>('conversations', []);
    const idx = all.findIndex((c) => c.id === convId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      all[idx].messages = msgs;
      all[idx].updatedAt = now;
    } else {
      all.push({
        id: convId,
        title: msgs[0]?.content.slice(0, 40) || 'Nieuw gesprek',
        messages: msgs,
        createdAt: now,
        updatedAt: now,
      });
    }

    await writeStorage('conversations', all);
    setConversations(all);
  }

  async function handleSend() {
    if (!input.trim()) return;

    const convId = activeId || generateId();
    if (!activeId) setActiveId(convId);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: getAssistantResponse(input),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setInput('');
    setMobileScreen('chat');
    await saveConversation(newMessages, convId);
  }

  function handleNewConversation() {
    setMessages([]);
    setActiveId(null);
    setInput('');
    setMobileScreen('chat');
  }

  function selectConversation(conv: Conversation) {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setMobileScreen('chat');
  }

  async function deleteConversation(id: string) {
    const all = conversations.filter((c) => c.id !== id);
    await writeStorage('conversations', all);
    setConversations(all);
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
      setMobileScreen('list');
    }
  }

  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? 'Nieuw gesprek';

  return (
    <div className="flex-1 flex overflow-hidden min-w-0 h-full">
      {/* Gesprekkenlijst — WhatsApp-stijl op mobiel */}
      <div
        className={cn(
          'flex flex-col bg-nova-dark border-r border-nova-border min-w-0',
          'w-full xl:w-64 xl:flex-shrink-0',
          mobileScreen === 'chat' && 'hidden xl:flex'
        )}
      >
        <div className="p-4 border-b border-nova-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold">Gesprekken</h2>
          <button onClick={handleNewConversation} className="nova-btn-ghost p-1.5" title="Nieuw gesprek">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 min-h-0">
          {conversations.length === 0 && (
            <p className="text-nova-muted text-xs text-center py-8">Geen gesprekken</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer text-sm transition-colors min-w-0',
                activeId === conv.id ? 'bg-nova-blue/10 text-nova-cyan' : 'text-gray-400 hover:bg-nova-panel'
              )}
              onClick={() => selectConversation(conv)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{conv.title}</p>
                <p className="text-[10px] text-nova-muted truncate">
                  {conv.messages[conv.messages.length - 1]?.content ?? 'Leeg gesprek'}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-100 xl:opacity-0 xl:group-hover:opacity-100 p-1 hover:text-red-400 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat — volledig scherm op mobiel */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 min-h-0',
          mobileScreen === 'list' && 'hidden xl:flex'
        )}
      >
        <div className="xl:hidden flex-shrink-0 flex items-center gap-3 px-3 py-3 border-b border-nova-border bg-nova-dark">
          <button
            type="button"
            onClick={() => setMobileScreen('list')}
            className="nova-btn-ghost p-2 -ml-1"
            aria-label="Terug"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold truncate flex-1">{activeTitle}</h2>
          <button onClick={handleNewConversation} className="nova-btn-ghost p-1.5">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center px-4">
                <h2 className="text-xl font-semibold text-nova-cyan mb-2">N.O.V.A. Chat</h2>
                <p className="text-nova-muted text-sm">Stel een vraag of gebruik spraak invoer</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={cn(
                  'max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-nova-blue/10 border border-nova-blue/20 text-gray-100'
                    : 'bg-nova-panel border border-nova-border text-gray-200'
                )}
              >
                <p className="text-[10px] text-nova-muted mb-1.5">
                  {msg.role === 'user' ? 'Jij' : 'N.O.V.A.'} ·{' '}
                  {new Date(msg.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-nova-border bg-nova-dark/80">
          <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3 min-w-0">
            <button
              onClick={toggleListening}
              className={cn(
                'p-2.5 sm:p-3 rounded-xl border transition-all flex-shrink-0',
                isListening
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-nova-panel border-nova-border text-gray-400 hover:text-nova-cyan'
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              className="nova-input flex-1 min-w-0 text-sm sm:text-base"
              placeholder="Typ een bericht..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <button onClick={handleSend} className="nova-btn-primary px-3 sm:px-5 flex-shrink-0">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
