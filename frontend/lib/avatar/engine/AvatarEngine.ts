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
    const voiceOut = this.voice.evaluate(input.voice, dt);

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

    if (input.camera.userLooking) {
      idleOut.eyeOffsetX += input.camera.faceX * 0.15;
      idleOut.eyeOffsetY += input.camera.faceY * 0.1;
    }

    const basePose = buildRenderPose(this.mood, {
      activeAnimation: this.animation.getClipId(),
      transitionProgress: this.transitionProgress,
    });

    const pose: RenderPose = {
      ...basePose,
      eyeOffsetX: basePose.eyeOffsetX + idleOut.eyeOffsetX + (animFrame.headTilt ?? 0) * 0.1,
      eyeOffsetY: basePose.eyeOffsetY + idleOut.eyeOffsetY + (animFrame.eyeOffsetY ?? 0),
      pupilOffsetX: idleOut.pupilOffsetX + input.camera.faceX * 0.2,
      pupilOffsetY: idleOut.pupilOffsetY + input.camera.faceY * 0.15,
      headTilt: basePose.headTilt + idleOut.headTilt + (animFrame.headTilt ?? 0),
      headNod: (animFrame.headNod ?? 0) + (idleOut.action === 'yawn' ? 3 : 0),
      mouthOpen: Math.max(voiceOut.mouthOpen, animFrame.mouthOpen ?? 0),
      blinkAmount: idleOut.isBlinking ? 1 : 0,
      browRaise: basePose.browRaise + voiceOut.browRaise,
      eyeScale: basePose.eyeScale + voiceOut.eyeScaleBoost,
      smileAmount: Math.min(1, Math.max(-0.5, basePose.smileAmount + idleOut.smileBoost + (animFrame.smileAmount ?? 0) * 0.3)),
      glowPulse: animFrame.glowPulse ?? (this.currentState === 'thinking' ? 0.35 : 0),
      isBlinking: idleOut.isBlinking,
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
    };
  }

  getSnapshot(): AvatarEngineSnapshot | null {
    return null;
  }
}

export const avatarEngine = new AvatarEngine();
