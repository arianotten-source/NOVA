export type QuestionCategory =
  | 'algemeen'
  | 'technisch'
  | 'persoonlijk'
  | 'domotica'
  | 'sensoren'
  | 'agenda'
  | 'crypto'
  | 'routeledger'
  | 'humanphase'
  | 'zorg';

export interface QuestionAnalysis {
  category: QuestionCategory;
  complexity: number;
  wordCount: number;
  isComplex: boolean;
}

const RULES: { category: QuestionCategory; patterns: RegExp[] }[] = [
  { category: 'domotica', patterns: [/lamp|licht|rolluik|thermostaat|smarthome|hue|zigbee|domotica/i] },
  { category: 'sensoren', patterns: [/sensor|temperatuur|luchtvochtigheid|co2|beweging|rook|alarm/i] },
  { category: 'agenda', patterns: [/agenda|afspraak|kalender|planning|wanneer|herinner/i] },
  { category: 'crypto', patterns: [/crypto|bitcoin|ethereum|wallet|blockchain|token/i] },
  { category: 'routeledger', patterns: [/routeledger|route ledger|kilometer|rit|logboek/i] },
  { category: 'humanphase', patterns: [/humanphase|human phase|cyclus|fase/i] },
  { category: 'zorg', patterns: [/zorg|medicijn|gezondheid|pijn|dokter|verpleeg/i] },
  { category: 'technisch', patterns: [/code|api|server|bug|fout|systeem|netwerk|install/i] },
  { category: 'persoonlijk', patterns: [/ik voel|mijn dag|hoe gaat het|verveel|eenzaam|moe ben/i] },
];

const COMPLEX_HINTS = [/waarom|hoe werkt|vergelijk|uitleg|analyseer|bereken|stappenplan|verschil/i];

export function classifyQuestion(text: string): QuestionAnalysis {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let category: QuestionCategory = 'algemeen';
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(lower))) {
      category = rule.category;
      break;
    }
  }

  const complexHints = COMPLEX_HINTS.some((p) => p.test(lower));
  const complexity = Math.min(
    1,
    wordCount / 18 + (complexHints ? 0.35 : 0) + (trimmed.includes('?') ? 0.08 : 0)
  );

  return {
    category,
    complexity,
    wordCount,
    isComplex: complexity > 0.45 || wordCount > 12,
  };
}
