import { voiceLog } from '@/lib/voice/voiceLogger';

function getLocalResponse(input: string): string {
  const lower = input.toLowerCase().trim();

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
    return 'Ik kan je helpen met notities, taken, agenda en sensoren. Wat wil je weten?';
  }
  if (lower.includes('dank')) {
    return 'Graag gedaan!';
  }

  return `Ik heb je gehoord. Je zei: ${input}. Volledige cloud-AI komt later; ik reageer lokaal voor nu.`;
}

const API_BASE = import.meta.env.DEV ? '' : '';

export async function sendAiMessage(text: string): Promise<{ reply: string; connected: boolean }> {
  voiceLog.emit('AI request verzonden', text.slice(0, 80));

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as { reply?: string };
      if (data.reply) {
        voiceLog.emit('AI antwoord ontvangen');
        return { reply: data.reply, connected: true };
      }
    }
  } catch {
    /* local fallback */
  }

  const reply = getLocalResponse(text);
  voiceLog.emit('AI antwoord ontvangen', '(lokaal)');
  return { reply, connected: false };
}
