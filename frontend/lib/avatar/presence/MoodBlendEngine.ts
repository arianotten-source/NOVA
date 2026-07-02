import type { MoodBlend } from '../engine/types';
import type { MoodVector } from './types';
import { moodBlendToVector, lerpMoodVector, vectorToMoodBlend } from './MoodEngine';
import { normalizeBlend, lerpMood } from '../engine/MoodBlend';
import type { ResponseEmotion } from '@/lib/thinking/thinkingEmotions';
import { moodForEmotion } from '@/lib/thinking/thinkingEmotions';
import { moodVectorLabel } from './MoodEngine';

export class MoodBlendEngine {
  private smooth = moodBlendToVector({
    happy: 0.2,
    curious: 0.15,
    sleepy: 0.05,
    sad: 0,
    concerned: 0,
    excited: 0.05,
    love: 0.05,
    neutral: 0.5,
    surprised: 0,
  });

  tick(
    baseMood: MoodBlend,
    replyEmotion: string | null,
    dt: number
  ): { mood: MoodBlend; vector: MoodVector; label: string } {
    let target = baseMood;

    if (replyEmotion && replyEmotion !== 'neutral' && replyEmotion !== 'rustig') {
      target = normalizeBlend(
        lerpMood(baseMood, moodForEmotion(replyEmotion as ResponseEmotion), 0.35)
      );
    }

    const targetVector = moodBlendToVector(target);
    const speed = Math.min(0.08, (dt / 16) * 0.05);
    this.smooth = lerpMoodVector(this.smooth, targetVector, speed);

    return {
      mood: vectorToMoodBlend(this.smooth),
      vector: this.smooth,
      label: moodVectorLabel(this.smooth),
    };
  }
}

export const moodBlendEngine = new MoodBlendEngine();
