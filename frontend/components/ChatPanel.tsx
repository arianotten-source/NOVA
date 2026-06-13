import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Mic, MicOff, Plus, Maximize2 } from 'lucide-react';
import { readStorage, writeStorage } from '@/lib/storage';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { generateId } from '@/lib/utils';
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
    return 'Ik kan je helpen met notities, taken, agenda en systeeminformatie. Gebruik de sidebar om te navigeren. AI-integratie komt binnenkort beschikbaar.';
  }

  return 'Ik begrijp je vraag. Volledige AI-integratie (OpenAI / lokale LLM) wordt binnenkort toegevoegd. Voor nu kun je notities, taken en agenda beheren via de sidebar.';
}

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, toggleListening, clearTranscript } = useSpeechRecognition();

  useEffect(() => {
    loadLatestConversation();
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

  async function loadLatestConversation() {
    const conversations = await readStorage<Conversation[]>('conversations', []);
    if (conversations.length > 0) {
      const latest = conversations[conversations.length - 1];
      setConversationId(latest.id);
      setMessages(latest.messages);
    }
  }

  async function saveConversation(msgs: ChatMessage[], convId: string) {
    const conversations = await readStorage<Conversation[]>('conversations', []);
    const idx = conversations.findIndex((c) => c.id === convId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      conversations[idx].messages = msgs;
      conversations[idx].updatedAt = now;
    } else {
      conversations.push({
        id: convId,
        title: msgs[0]?.content.slice(0, 40) || 'Nieuw gesprek',
        messages: msgs,
        createdAt: now,
        updatedAt: now,
      });
    }

    await writeStorage('conversations', conversations);
  }

  async function handleSend() {
    if (!input.trim()) return;

    const convId = conversationId || generateId();
    if (!conversationId) setConversationId(convId);

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
    await saveConversation(newMessages, convId);
  }

  async function handleNewConversation() {
    setMessages([]);
    setConversationId(null);
    setInput('');
  }

  return (
    <aside className="w-80 flex-shrink-0 bg-nova-dark border-l border-nova-border flex flex-col">
      <div className="p-4 border-b border-nova-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-nova-cyan">N.O.V.A. Chat</h2>
          <p className="text-[10px] text-nova-muted">Snelle assistent</p>
        </div>
        <div className="flex gap-1">
          <button onClick={handleNewConversation} className="nova-btn-ghost p-2" title="Nieuw gesprek">
            <Plus className="w-4 h-4" />
          </button>
          <Link to="/chat" className="nova-btn-ghost p-2" title="Volledig scherm">
            <Maximize2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-nova-muted text-sm">Stel een vraag aan N.O.V.A.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-nova-blue/10 border border-nova-blue/20 ml-4'
                : 'bg-nova-panel border border-nova-border mr-4'
            }`}
          >
            <p className="text-[10px] text-nova-muted mb-1">
              {msg.role === 'user' ? 'Jij' : 'N.O.V.A.'}
            </p>
            <p className="text-gray-200 leading-relaxed">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-nova-border">
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-nova-panel border-nova-border text-gray-400 hover:text-nova-cyan'
            }`}
            title="Spraak invoer"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            className="nova-input flex-1 text-sm py-2"
            placeholder="Typ een bericht..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="nova-btn-primary p-2.5" title="Versturen">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
