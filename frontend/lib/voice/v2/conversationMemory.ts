export interface ConversationTurn {
  user: string;
  assistant: string;
  timestamp: number;
}

const MAX_TURNS = 10;
const turns: ConversationTurn[] = [];

export const conversationMemory = {
  add(user: string, assistant: string) {
    turns.push({ user, assistant, timestamp: Date.now() });
    while (turns.length > MAX_TURNS) turns.shift();
  },

  getHistory(): ConversationTurn[] {
    return [...turns];
  },

  size(): number {
    return turns.length;
  },

  buildContextPrompt(): string {
    if (turns.length === 0) return '';
    const lines = turns.map((t) => `Gebruiker: ${t.user}\nNova: ${t.assistant}`);
    return `Eerdere gesprekken:\n${lines.join('\n')}\n`;
  },

  findRelevantMemory(query: string): string | null {
    const q = query.toLowerCase();
    if (q.includes('hoe voel') || q.includes('hoe ging') || q.includes('herinner')) {
      const last = turns[turns.length - 1];
      if (last) return `Je vertelde eerder: "${last.user}".`;
    }
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      const words = t.user.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      if (words.some((w) => q.includes(w))) {
        return `Je vertelde eerder: "${t.user}".`;
      }
    }
    return null;
  },
};
