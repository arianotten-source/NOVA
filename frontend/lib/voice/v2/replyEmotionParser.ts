import type { ResponseEmotion } from '@/lib/thinking/thinkingEmotions';
import { moodForEmotion } from '@/lib/thinking/thinkingEmotions';
import type { MoodBlend } from '@/lib/avatar/engine/types';
import type { AvatarStateId } from '@/lib/avatar/engine/types';

export interface ReplyEmotionResult {
  emotion: ResponseEmotion;
  mood: MoodBlend;
  avatarState: AvatarStateId | null;
  emoji: string;
}

const PATTERNS: { emotion: ResponseEmotion; re: RegExp; avatarState: AvatarStateId | null; emoji: string }[] = [
  { emotion: 'grappig', re: /😁|😂|🤣|grappig|mop|lol|haha/i, avatarState: 'happy', emoji: '😁' },
  { emotion: 'bezorgd', re: /😟|😔|spijt|helaas|jammer|slecht nieuws|vervelend/i, avatarState: 'concerned', emoji: '😟' },
  { emotion: 'blij', re: /😊|🙂|compliment|goed gedaan|mooi zo|fijn/i, avatarState: 'happy', emoji: '😊' },
  { emotion: 'grappig', re: /😮|wow|verrass|onverwacht/i, avatarState: 'surprised', emoji: '😮' },
  { emotion: 'blij', re: /🥰|lief|hartelijk|dankjewel|fijn dat/i, avatarState: 'love', emoji: '🥰' },
  { emotion: 'rustig', re: /😴|slaap|rustig|ontspan/i, avatarState: 'sleeping', emoji: '😴' },
  { emotion: 'bezorgd', re: /alarm|waarschuwing|gevaar|urgent/i, avatarState: 'surprised', emoji: '😮' },
];

export function parseReplyEmotion(text: string): ReplyEmotionResult {
  const hit = PATTERNS.find((p) => p.re.test(text));
  const emotion = hit?.emotion ?? 'rustig';
  return {
    emotion,
    mood: moodForEmotion(emotion),
    avatarState: hit?.avatarState ?? null,
    emoji: hit?.emoji ?? '🙂',
  };
}
