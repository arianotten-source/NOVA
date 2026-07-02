import type {
  AvatarEngineSnapshot,
  AvatarStateId,
  EngineInput,
  RenderPose,
} from './types';
import { AnimationEngine } from './AnimationEngine';
import { ContextEngine } from './ContextEngine';
import { VoiceEngine } from './VoiceEngine';
import { IdleEngine } from './IdleEngine';
import { buildRenderPose } from './EmotionEngine';
import { emptyMood, lerpMood, addNoise, normalizeBlend } from './MoodBlend';
import { getStateDef, normalizeMood } from './stateMachine';
import { resolvePersonality } from './personalities';
import { hardwareBridge } from './HardwareBridge';
import { presenceEngine } from '../presence/PresenceEngine';
import { thinkingEngine } from '@/lib/thinking/ThinkingEngine';
import { lipSyncEngine } from '@/lib/voice/v2/lipSync';
import {
  DEFAULT_PRESENCE_PROFILE,
  DEFAULT_PRESENCE_SETTINGS,
} from '../presence/types';

export class AvatarEngine {
  private context = new ContextEngine();
  private voice = new VoiceEngine();
  private idle = new IdleEngine();
  private animation = new AnimationEngine();

  private currentState: AvatarStateId = 'idle';
  private stateEnteredAt = 0;
  private mood = emptyMood();
  private targetMood = emptyMood();
  private transitionProgress = 1;
  private transitionFrom: AvatarStateId = 'idle';
  private lastNow = 0;
  private fps = 60;
  private frameCount = 0;
  private fpsAccum = 0;
  private autonomous = true;

  pushContext(type: Parameters<ContextEngine['push']>[0], now: number, priority?: number) {
    this.context.push(type, now, priority);
  }

  setAutonomous(enabled: boolean) {
    this.autonomous = enabled;
  }

  touchActivity(_now: number) {
    // reserved for external activity pings
  }

  tick(input: EngineInput): AvatarEngineSnapshot {
    const dt = this.lastNow ? Math.min(64, input.now - this.lastNow) : 16;
    this.lastNow = input.now;
    this.autonomous = input.autonomous;

    this.frameCount += 1;
    this.fpsAccum += dt;
    if (this.fpsAccum >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsAccum);
      this.frameCount = 0;
      this.fpsAccum = 0;
    }

    const personality = resolvePersonality(input.personality);
    const inactiveMs = input.now - input.lastActivityAt;

    if (inactiveMs > 120000 && input.autonomous) {
      this.context.push('inactivity', input.now);
    }
    if (!input.system.networkOnline && input.autonomous) {
      this.context.push('internet_offline', input.now);
    }
    if (input.system.sensorAlerts > 0 && input.autonomous) {
      this.context.push('sensor_warning', input.now);
    }
    if (input.system.batteryLevel != null && input.system.batteryLevel < 15 && input.autonomous) {
      this.context.push('low_battery', input.now);
    }

    const contextActive = this.context.update(input.now);
    const voiceInput = input.voice.isSpeaking
      ? { ...input.voice, viseme: lipSyncEngine.tick(dt, input.voice.speechEnergy) }
      : input.voice;
    const voiceOut = this.voice.evaluate(voiceInput, dt);

    let desiredState: AvatarStateId = 'idle';
    let desiredPriority = 10;

    if (input.autonomous) {
      if (voiceOut.state) {
        const def = getStateDef(voiceOut.state);
        desiredState = voiceOut.state;
        desiredPriority = def.priority;
      } else if (contextActive) {
        desiredState = contextActive.state;
        desiredPriority = contextActive.priority;
      } else if (input.camera.userLooking && input.camera.faceDetected) {
        desiredState = 'curious';
        desiredPriority = 36;
      }
    }

    if (!input.autonomous && input.manualExpressionId) {
      desiredState = 'idle';
    }

    const currentDef = getStateDef(this.currentState);
    const desiredDef = getStateDef(desiredState);

    if (
      desiredState !== this.currentState &&
      (desiredDef.priority >= currentDef.priority || input.now - this.stateEnteredAt > currentDef.defaultDurationMs)
    ) {
      this.transitionFrom = this.currentState;
      this.currentState = desiredState;
      this.stateEnteredAt = input.now;
      this.transitionProgress = 0;
      this.targetMood = normalizeMood({
        ...desiredDef.targetMood,
        happy: (desiredDef.targetMood.happy ?? 0) + personality.smileBias,
      });
      this.animation.setClip(desiredDef.animation, input.now);
    }

    const blendSpeed = (dt / desiredDef.transitionMs) * personality.reactionSpeedMul;
    this.transitionProgress = Math.min(1, this.transitionProgress + blendSpeed);

    if (input.voice.isThinking) {
      const thinkMood = thinkingEngine.getTargetMood();
      if (thinkMood) {
        this.targetMood = thinkMood;
      }
    }

    this.mood = lerpMood(this.mood, this.targetMood, blendSpeed * 0.85);
    if (input.autonomous && this.currentState === 'idle') {
      this.mood = addNoise(this.mood, 0.02);
    }
    this.mood = normalizeBlend(this.mood);

    const animFrame = this.animation.update(input.now);
    let idleOut = {
      action: null as string | null,
      eyeOffsetX: 0,
      eyeOffsetY: 0,
      pupilOffsetX: 0,
      pupilOffsetY: 0,
      headTilt: 0,
      smileBoost: 0,
      isBlinking: false,
    };

    if (input.autonomous && this.currentState === 'idle' && !voiceOut.state) {
      idleOut = this.idle.update(input.now, personality, inactiveMs);
      if (idleOut.isBlinking) this.animation.playOneShot('blink', input.now);
    }

    const presenceInput = {
      now: input.now,
      mood: this.mood,
      targetMood: this.targetMood,
      state: this.currentState,
      voice: input.voice,
      camera: input.camera,
      system: input.system,
      personality,
      inactiveMs,
      profile: input.presenceProfile ?? DEFAULT_PRESENCE_PROFILE,
      settings: input.presenceSettings ?? DEFAULT_PRESENCE_SETTINGS,
      environment: input.environment ?? {},
      idleAction: idleOut.action,
    };

    const presence = presenceEngine.tick(presenceInput);
    if (input.autonomous) {
      this.mood = presenceEngine.applyMoodModifiers(this.mood, presence.moodModifiers);
    }

    if (presence.mode === 'sleeping' && input.autonomous && !voiceOut.state) {
      this.currentState = 'sleeping';
    }

    if (input.camera.userLooking && input.camera.permission === 'granted') {
      idleOut.eyeOffsetX += input.camera.faceX * 0.15;
      idleOut.eyeOffsetY += input.camera.faceY * 0.1;
    }

    const basePose = buildRenderPose(this.mood, {
      activeAnimation: this.animation.getClipId(),
      transitionProgress: this.transitionProgress,
    });

    const micro = presence.microAnim;
    const thinkPose = input.voice.isThinking ? thinkingEngine.tick(input.now) : null;

    const pose: RenderPose = {
      ...basePose,
      eyeOffsetX:
        basePose.eyeOffsetX +
        idleOut.eyeOffsetX +
        (animFrame.headTilt ?? 0) * 0.1 +
        micro.lookX * 0.05 +
        (thinkPose?.eyeOffsetX ?? 0),
      eyeOffsetY:
        basePose.eyeOffsetY +
        idleOut.eyeOffsetY +
        (animFrame.eyeOffsetY ?? 0) +
        micro.lookY * 0.05 +
        micro.floatY * 0.02 +
        (thinkPose?.eyeOffsetY ?? 0),
      pupilOffsetX: idleOut.pupilOffsetX + input.camera.faceX * 0.2 + micro.lookX * 0.08 + (thinkPose?.pupilOffsetX ?? 0),
      pupilOffsetY: idleOut.pupilOffsetY + input.camera.faceY * 0.15 + micro.lookY * 0.08 + (thinkPose?.pupilOffsetY ?? 0),
      headTilt: basePose.headTilt + idleOut.headTilt + (animFrame.headTilt ?? 0),
      headNod: (animFrame.headNod ?? 0) + (idleOut.action === 'yawn' ? 3 : 0) + micro.yawnAmount * 2,
      mouthOpen: Math.max(voiceOut.mouthOpen, animFrame.mouthOpen ?? 0) + micro.sighAmount * 0.1,
      blinkAmount: idleOut.isBlinking ? 1 : 0,
      browRaise:
        basePose.browRaise +
        voiceOut.browRaise +
        (thinkPose?.browRaise ?? 0) -
        (micro.browLeftY + micro.browRightY) * 0.02 -
        (thinkPose?.furrow ?? 0) * 0.3,
      eyeScale: basePose.eyeScale + voiceOut.eyeScaleBoost + (micro.pupilScale - 1) * 0.5,
      smileAmount: Math.min(
        1,
        Math.max(
          -0.5,
          basePose.smileAmount +
            idleOut.smileBoost +
            voiceOut.smileBoost +
            (animFrame.smileAmount ?? 0) * 0.3 +
            micro.mouthCornerLeft * 0.2 +
            micro.mouthCornerRight * 0.2 +
            micro.asymmetricSmile * 0.15 +
            (thinkPose?.smileAmount ?? 0)
        )
      ),
      glowPulse: Math.max(
        animFrame.glowPulse ?? 0,
        micro.glowIntensity,
        thinkPose?.glowPulse ?? 0,
        this.currentState === 'thinking' ? 0.35 : 0
      ),
      isBlinking: idleOut.isBlinking || micro.eyeOpenLeft < 0.2,
      microAnim: micro,
    };

    if (!input.autonomous && input.manualExpressionId) {
      pose.expressionId = input.manualExpressionId;
    }

    hardwareBridge.publish(pose, input.now);

    return {
      state: this.currentState,
      previousState: this.transitionFrom,
      targetState: desiredState,
      stateEnteredAt: this.stateEnteredAt,
      statePriority: desiredPriority,
      pose,
      moodBlend: this.mood,
      targetMood: this.targetMood,
      fps: this.fps,
      lastContextEvent: this.context.lastEvent,
      idleAction: idleOut.action,
      autonomous: this.autonomous,
      presence,
    };
  }

  getSnapshot(): AvatarEngineSnapshot | null {
    return null;
  }
}

export const avatarEngine = new AvatarEngine();
