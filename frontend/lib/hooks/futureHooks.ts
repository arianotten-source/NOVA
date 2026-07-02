/**
 * Modular hooks for future N.O.V.A. hardware integrations.
 * Implementations can be swapped without changing Voice/Avatar engines.
 */

export interface WakeWordProvider {
  readonly id: string;
  start(onDetected: () => void): Promise<void>;
  stop(): void;
  isSupported(): boolean;
}

export interface RealtimeVoiceProvider {
  readonly id: string;
  connect(): Promise<void>;
  disconnect(): void;
  sendAudio?(chunk: ArrayBuffer): void;
}

export interface HardwareActuator {
  readonly id: string;
  publish(channel: string, value: number): void;
}

export interface RobotHeadBridge {
  setEyePosition(x: number, y: number): void;
  setMouthOpen(amount: number): void;
  setEyelid(left: number, right: number): void;
}

export interface HomeAssistantBridge {
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<void>;
}

/** Stubs — wire real providers when hardware/SDK is available */
export const futureHooks = {
  wakeWord: null as WakeWordProvider | null,
  realtimeVoice: null as RealtimeVoiceProvider | null,
  oled: null as HardwareActuator | null,
  robotHead: null as RobotHeadBridge | null,
  homeAssistant: null as HomeAssistantBridge | null,

  registerWakeWord(provider: WakeWordProvider) {
    this.wakeWord = provider;
  },
  registerRealtimeVoice(provider: RealtimeVoiceProvider) {
    this.realtimeVoice = provider;
  },
  registerRobotHead(bridge: RobotHeadBridge) {
    this.robotHead = bridge;
  },
};
