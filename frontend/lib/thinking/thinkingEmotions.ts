import type { MoodBlend } from '@/lib/avatar/engine/types';
import type { QuestionCategory } from './questionClassifier';
import { emptyMood, normalizeBlend } from '@/lib/avatar/engine/MoodBlend';

export type ResponseEmotion =
  | 'blij'
  | 'nieuwsgierig'
  | 'bezorgd'
  | 'grappig'
  | 'serieus'
  | 'rustig';

const CATEGORY_EMOTION: Record<QuestionCategory, ResponseEmotion> = {
  algemeen: 'rustig',
  technisch: 'serieus',
  persoonlijk: 'nieuwsgierig',
  domotica: 'nieuwsgierig',
  sensoren: 'serieus',
  agenda: 'rustig',
  crypto: 'serieus',
  routeledger: 'rustig',
  humanphase: 'bezorgd',
  zorg: 'bezorgd',
};

export function emotionForCategory(category: QuestionCategory): ResponseEmotion {
  return CATEGORY_EMOTION[category];
}

export function moodForEmotion(emotion: ResponseEmotion): MoodBlend {
  const base = emptyMood();
  switch (emotion) {
    case 'blij':
      return normalizeBlend({ ...base, happy: 0.65, excited: 0.2, neutral: 0.15 });
    case 'nieuwsgierig':
      return normalizeBlend({ ...base, curious: 0.6, neutral: 0.25, happy: 0.1 });
    case 'bezorgd':
      return normalizeBlend({ ...base, concerned: 0.5, neutral: 0.35, sad: 0.05 });
    case 'grappig':
      return normalizeBlend({ ...base, happy: 0.5, excited: 0.35, neutral: 0.1 });
    case 'serieus':
      return normalizeBlend({ ...base, neutral: 0.55, concerned: 0.15, curious: 0.2 });
    case 'rustig':
    default:
      return normalizeBlend({ ...base, neutral: 0.6, happy: 0.15, curious: 0.1 });
  }
}

export function ttsModifiersForEmotion(emotion: ResponseEmotion): { rate: number; pitch: number } {
  switch (emotion) {
    case 'blij':
      return { rate: 1.05, pitch: 1.08 };
    case 'nieuwsgierig':
      return { rate: 1.02, pitch: 1.05 };
    case 'bezorgd':
      return { rate: 0.94, pitch: 0.96 };
    case 'grappig':
      return { rate: 1.08, pitch: 1.1 };
    case 'serieus':
      return { rate: 0.96, pitch: 0.98 };
    case 'rustig':
    default:
      return { rate: 1, pitch: 1 };
  }
}
