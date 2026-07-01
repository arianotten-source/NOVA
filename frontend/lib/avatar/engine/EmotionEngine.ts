import type { AvatarExpressionId } from '@/types/avatar';
import type { MoodBlend, RenderPose } from './types';
import { moodToLabel } from './MoodBlend';

export function moodToExpression(mood: MoodBlend): AvatarExpressionId {
  const top = moodToLabel(mood);
  const map: Record<string, AvatarExpressionId> = {
    happy: 'blij',
    curious: 'nieuwsgierig',
    sleepy: 'slaperig',
    sad: 'verdrietig',
    concerned: 'bezorgd',
    excited: 'enthousiast',
    love: 'liefdevol',
    neutral: 'tevreden',
    surprised: 'verrast',
  };
  if (mood.excited > 0.65) return 'heel_blij';
  if (mood.happy > 0.7 && mood.excited > 0.2) return 'enthousiast';
  if (mood.happy > 0.55) return 'blij';
  return map[top] ?? 'tevreden';
}

export function moodToPoseChannels(mood: MoodBlend) {
  return {
    smileAmount:
      mood.happy * 0.85 +
      mood.excited * 0.95 +
      mood.love * 0.7 +
      mood.curious * 0.25 -
      mood.sad * 0.6 -
      mood.concerned * 0.35,
    browRaise:
      mood.surprised * 0.8 +
      mood.curious * 0.35 +
      mood.concerned * -0.45 -
      mood.sad * 0.3,
    eyeScale: 1 + mood.surprised * 0.18 + mood.excited * 0.08 - mood.sleepy * 0.15,
    eyeOpen: 1 - mood.sleepy * 0.55 - mood.sad * 0.1,
  };
}

export function buildRenderPose(
  mood: MoodBlend,
  partial: Partial<RenderPose> = {}
): RenderPose {
  const channels = moodToPoseChannels(mood);
  return {
    expressionId: moodToExpression(mood),
    moodBlend: mood,
    eyeOffsetX: 0,
    eyeOffsetY: 0,
    pupilOffsetX: 0,
    pupilOffsetY: 0,
    headTilt: 0,
    headNod: 0,
    mouthOpen: 0,
    blinkAmount: 0,
    browRaise: channels.browRaise,
    eyeScale: channels.eyeScale,
    smileAmount: channels.smileAmount,
    glowPulse: 0,
    transitionProgress: 1,
    activeAnimation: 'idle',
    isBlinking: false,
    ...partial,
  };
}
