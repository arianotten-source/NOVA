import type { PresenceInput, PresenceSnapshot, MicroAnimChannels, PresenceMode } from './types';
import { EMPTY_MICRO_ANIM } from './types';
import {
  getDayPhase,
  dayPhaseMoodModifiers,
  dayPhaseEnergy,
  dayPhaseMotionMul,
  dayPhaseBlinkMul,
} from './DayRhythm';
import { moodBlendToVector, lerpMoodVector } from './MoodEngine';
import { evaluateInitiative } from './InitiativeEngine';
import { trustMotionRelaxation } from './PresenceMemory';
import {
  MICRO_ANIMATION_LIBRARY,
  pickWeightedAnimation,
  sampleMicroAnimation,
  getAnimationsByCategory,
} from './MicroAnimationLibrary';
import { lerpMood, normalizeBlend } from '../engine/MoodBlend';
import type { MoodBlend } from '../engine/types';

const SLEEP_AFTER_MS = 600000;
const DROWSY_AFTER_MS = 300000;
const USER_LEFT_MS = 30000;

export class PresenceEngine {
  private currentAnim = pickWeightedAnimation(MICRO_ANIMATION_LIBRARY);
  private animStartedAt = 0;
  private lastAnimId = '';
  private nextAnimAt = 0;
  private mode: PresenceMode = 'awake';
  private modeEnteredAt = 0;
  private userWasPresent = false;
  private userLeftAt = 0;
  private gazeFollowX = 0;
  private gazeFollowY = 0;
  private curiosityBoost = 0;
  private smoothMoodVector = moodBlendToVector({
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
  private lastWhisper: string | null = null;
  private whisperUntil = 0;

  tick(input: PresenceInput): PresenceSnapshot {
    const date = new Date(input.now);
    const dayPhase = getDayPhase(date.getHours());
    const phaseEnergy = dayPhaseEnergy(dayPhase);
    const phaseMotion = dayPhaseMotionMul(dayPhase);
    const phaseBlink = dayPhaseBlinkMul(dayPhase);

    this.updatePresenceMode(input);

    const targetVector = moodBlendToVector(
      normalizeBlend({
        ...input.mood,
        ...this.mergePhaseMood(dayPhase, input),
      })
    );
    this.smoothMoodVector = lerpMoodVector(this.smoothMoodVector, targetVector, 0.04);

    const energy = this.computeEnergy(input, phaseEnergy);
    const curiosity = this.computeCuriosity(input);
    const attention = this.computeAttention(input);

    const microAnim = this.updateMicroAnimation(input, energy, curiosity);
    const moodModifiers = this.buildMoodModifiers(input, dayPhase, energy);

    const initiative = evaluateInitiative(input, dayPhase);
    if (initiative.whisper && initiative.priority >= (this.lastWhisper ? 40 : 20)) {
      this.lastWhisper = initiative.whisper;
      this.whisperUntil = input.now + 5000;
    }

    const whisper = input.now < this.whisperUntil ? this.lastWhisper : null;
    const trustRelax = trustMotionRelaxation(input.profile.trustLevel);

    return {
      mode: this.mode,
      dayPhase,
      energy,
      curiosity,
      attention,
      trustLevel: input.profile.trustLevel,
      moodVector: this.smoothMoodVector,
      moodModifiers,
      microAnim,
      motionSpeedMul: phaseMotion * trustRelax * (0.6 + energy * 0.4),
      blinkIntervalMul: phaseBlink * (this.mode === 'sleeping' ? 2.2 : 1),
      whisper,
      whisperPriority: initiative.priority,
      voicePaceMul: input.profile.voicePace === 'slow' ? 0.82 : input.profile.voicePace === 'fast' ? 1.15 : 1,
      healthConcern: input.system.sensorAlerts > 0,
    };
  }

  private updatePresenceMode(input: PresenceInput) {
    const { now, inactiveMs, camera, voice } = input;
    const facePresent = camera.faceDetected && camera.permission === 'granted';

    if (facePresent) {
      if (!this.userWasPresent && this.userLeftAt > 0 && now - this.userLeftAt > USER_LEFT_MS) {
        this.setMode('welcome_home', now);
      }
      this.userWasPresent = true;
      this.userLeftAt = 0;
    } else if (this.userWasPresent) {
      this.userLeftAt = this.userLeftAt || now;
      if (now - this.userLeftAt > USER_LEFT_MS) {
        this.userWasPresent = false;
      }
    }

    if (voice.isListening || voice.isSpeaking || voice.isThinking) {
      if (this.mode === 'sleeping' || this.mode === 'drowsy') {
        this.setMode('waking', now);
      } else if (this.mode !== 'health_alert') {
        this.setMode('awake', now);
      }
      return;
    }

    if (inactiveMs > SLEEP_AFTER_MS && this.mode !== 'waking') {
      this.setMode('sleeping', now);
    } else if (inactiveMs > DROWSY_AFTER_MS && this.mode === 'awake') {
      this.setMode('drowsy', now);
    } else if (this.mode === 'welcome_home' && now - this.modeEnteredAt > 4000) {
      this.setMode('awake', now);
    } else if (this.mode === 'waking' && now - this.modeEnteredAt > 2500) {
      this.setMode('awake', now);
    }

    if (input.system.sensorAlerts > 0) {
      this.setMode('health_alert', now);
    } else if (this.mode === 'health_alert' && input.system.sensorAlerts === 0) {
      this.setMode('awake', now);
    }
  }

  private setMode(mode: PresenceMode, now: number) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.modeEnteredAt = now;
    if (mode === 'welcome_home') {
      this.lastWhisper = 'Welkom terug.';
      this.whisperUntil = now + 4500;
    }
    if (mode === 'waking') {
      this.lastWhisper = 'Hallo.';
      this.whisperUntil = now + 3500;
    }
  }

  private mergePhaseMood(dayPhase: ReturnType<typeof getDayPhase>, input: PresenceInput): Partial<MoodBlend> {
    const phase = dayPhaseMoodModifiers(dayPhase);
    const weight = this.mode === 'sleeping' ? 0.35 : 0.15;
    const merged: Partial<MoodBlend> = {};
    for (const [k, v] of Object.entries(phase) as [keyof MoodBlend, number][]) {
      merged[k] = (input.targetMood[k] ?? 0) * (1 - weight) + v * weight;
    }
    if (this.mode === 'sleeping') merged.sleepy = 0.65;
    if (this.mode === 'drowsy') merged.sleepy = 0.4;
    if (this.mode === 'health_alert') merged.concerned = 0.5;
    return merged;
  }

  private computeEnergy(input: PresenceInput, phaseEnergy: number): number {
    let e = phaseEnergy;
    if (input.voice.isSpeaking) e = Math.min(1, e + 0.2);
    if (this.mode === 'sleeping') e *= 0.25;
    if (this.mode === 'drowsy') e *= 0.55;
    if (input.inactiveMs > 120000) e *= 0.7;
    return Math.max(0.1, Math.min(1, e));
  }

  private computeCuriosity(input: PresenceInput): number {
    let c = input.mood.curious + input.mood.surprised * 0.3;
    if (input.camera.faceDetected && input.camera.permission === 'granted') {
      c += 0.25 + this.curiosityBoost;
      this.curiosityBoost = Math.min(0.3, this.curiosityBoost + 0.002);
    } else {
      this.curiosityBoost *= 0.98;
    }
    if (input.voice.isListening) c += 0.2;
    return Math.min(1, c);
  }

  private computeAttention(input: PresenceInput): number {
    if (input.voice.isListening) return 0.9;
    if (input.voice.isSpeaking) return 0.85;
    if (input.camera.userLooking) return 0.75;
    if (this.mode === 'sleeping') return 0.15;
    return 0.4 + input.mood.curious * 0.3;
  }

  private buildMoodModifiers(
    input: PresenceInput,
    dayPhase: ReturnType<typeof getDayPhase>,
    energy: number
  ): Partial<MoodBlend> {
    const base = dayPhaseMoodModifiers(dayPhase);
    const out: Partial<MoodBlend> = { ...base };

    if (this.mode === 'sleeping') {
      out.sleepy = 0.7;
      out.neutral = 0.2;
    }
    if (input.camera.faceDetected && input.camera.permission === 'granted') {
      out.curious = (out.curious ?? 0) + 0.1;
      out.happy = (out.happy ?? 0) + 0.05 * energy;
    }
    if (input.system.sensorAlerts > 0) {
      out.concerned = 0.45;
      out.happy = 0.05;
    }

    return out;
  }

  private updateMicroAnimation(
    input: PresenceInput,
    energy: number,
    curiosity: number
  ): MicroAnimChannels {
    const { now, camera, voice, idleAction } = input;

    if (now >= this.nextAnimAt) {
      const pool =
        this.mode === 'sleeping'
          ? getAnimationsByCategory('blink')
          : voice.isListening
            ? getAnimationsByCategory('gaze')
            : curiosity > 0.5
              ? [...getAnimationsByCategory('react'), ...getAnimationsByCategory('gaze')]
              : MICRO_ANIMATION_LIBRARY;

      this.currentAnim = pickWeightedAnimation(pool.length ? pool : MICRO_ANIMATION_LIBRARY, new Set([this.lastAnimId]));
      this.lastAnimId = this.currentAnim.id;
      this.animStartedAt = now;
      this.nextAnimAt = now + this.currentAnim.durationMs + (4000 + Math.random() * 8000) / (energy + 0.3);
    }

    const progress = (now - this.animStartedAt) / this.currentAnim.durationMs;
    let channels = sampleMicroAnimation(this.currentAnim, progress);

    if (idleAction === 'yawn') channels = { ...channels, yawnAmount: 0.7 };
    if (idleAction === 'blink') channels = { ...channels, eyeOpenLeft: 0.06, eyeOpenRight: 0.06 };

    if (this.mode === 'sleeping') {
      channels.eyeOpenLeft = Math.min(channels.eyeOpenLeft, 0.2);
      channels.eyeOpenRight = Math.min(channels.eyeOpenRight, 0.2);
      channels.glowIntensity = 0.06;
    }

    if (this.mode === 'waking') {
      const wakeT = Math.min(1, (now - this.modeEnteredAt) / 2500);
      channels.eyeOpenLeft = 0.15 + wakeT * 0.85;
      channels.eyeOpenRight = 0.15 + wakeT * 0.85;
      channels.mouthCornerLeft = wakeT * 0.12;
      channels.mouthCornerRight = wakeT * 0.12;
    }

    if (camera.faceDetected && camera.permission === 'granted') {
      this.gazeFollowX += (camera.faceX * 6 - this.gazeFollowX) * 0.06;
      this.gazeFollowY += (camera.faceY * 4 - this.gazeFollowY) * 0.06;
      channels.lookX += this.gazeFollowX;
      channels.lookY += this.gazeFollowY;
      channels.pupilScale = 1 + curiosity * 0.12;
      channels.mouthCornerLeft += 0.06 * curiosity;
      channels.mouthCornerRight += 0.06 * curiosity;
    } else if (!camera.faceDetected && this.userLeftAt > 0) {
      const away = Math.min(1, (now - this.userLeftAt) / 2000);
      channels.lookX += away * 8;
    }

    channels.floatY += Math.sin(now / 2200) * 1.5 * energy;
    channels.glowIntensity = 0.08 + energy * 0.12 + (voice.isListening ? 0.08 : 0);

    return { ...EMPTY_MICRO_ANIM, ...channels, animId: this.currentAnim.id };
  }

  applyMoodModifiers(mood: MoodBlend, modifiers: Partial<MoodBlend>, strength = 0.12): MoodBlend {
    const target = { ...mood };
    for (const [k, v] of Object.entries(modifiers) as [keyof MoodBlend, number][]) {
      target[k] = target[k] + (v - target[k]) * strength;
    }
    return normalizeBlend(lerpMood(mood, target, strength));
  }
}

export const presenceEngine = new PresenceEngine();
