import type { RenderPose } from './types';

export type HardwareTarget = 'web' | 'oled' | 'led_matrix' | 'robot_head' | 'android';

export interface HardwareFrame {
  pose: RenderPose;
  timestamp: number;
  target: HardwareTarget;
}

export class HardwareBridge {
  private target: HardwareTarget = 'web';
  private lastFrame: HardwareFrame | null = null;
  private subscribers = new Set<(frame: HardwareFrame) => void>();

  setTarget(target: HardwareTarget) {
    this.target = target;
  }

  publish(pose: RenderPose, timestamp: number) {
    const frame: HardwareFrame = { pose, timestamp, target: this.target };
    this.lastFrame = frame;
    this.subscribers.forEach((fn) => fn(frame));
  }

  subscribe(fn: (frame: HardwareFrame) => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getLastFrame() {
    return this.lastFrame;
  }

  /** Future: serialize for ESP32 OLED over HTTP/WebSocket */
  serializeForOled(pose: RenderPose): string {
    return JSON.stringify({
      expr: pose.expressionId,
      mouth: Math.round(pose.mouthOpen * 100),
      eyes: [pose.eyeOffsetX, pose.eyeOffsetY],
      blink: pose.isBlinking ? 1 : 0,
    });
  }
}

export const hardwareBridge = new HardwareBridge();
