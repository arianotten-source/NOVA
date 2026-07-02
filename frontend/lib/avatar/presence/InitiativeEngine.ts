import type { PresenceInput } from './types';
import type { DayPhase } from './types';
import { dayPhaseGreeting } from './DayRhythm';
import { trustInitiativeChance } from './PresenceMemory';

interface InitiativeCandidate {
  message: string;
  priority: number;
  cooldownMs: number;
}

const lastSpoken = new Map<string, number>();

function canSpeak(key: string, cooldownMs: number, now: number): boolean {
  const last = lastSpoken.get(key) ?? 0;
  if (now - last < cooldownMs) return false;
  lastSpoken.set(key, now);
  return true;
}

export function evaluateInitiative(input: PresenceInput, dayPhase: DayPhase): {
  whisper: string | null;
  priority: number;
} {
  if (!input.settings.initiativeEnabled) return { whisper: null, priority: 0 };

  const { now, inactiveMs, system, environment, profile, voice, camera } = input;
  const trustChance = trustInitiativeChance(profile.trustLevel);
  const candidates: InitiativeCandidate[] = [];

  if (inactiveMs > 60000 && inactiveMs < 90000) {
    candidates.push({ message: 'Kan ik ergens mee helpen?', priority: 35, cooldownMs: 300000 });
  }

  if (inactiveMs > 90000 && inactiveMs < 120000) {
    candidates.push({ message: 'Ik ben hier.', priority: 30, cooldownMs: 300000 });
  }

  if (inactiveMs > 180000) {
    candidates.push({ message: 'Ik wacht rustig.', priority: 25, cooldownMs: 600000 });
  }

  if (
    environment.agendaMinutesUntil != null &&
    environment.agendaMinutesUntil <= 20 &&
    environment.agendaMinutesUntil > 0
  ) {
    candidates.push({
      message: `Over ${environment.agendaMinutesUntil} minuten heb je een afspraak.`,
      priority: 70,
      cooldownMs: 1200000,
    });
  }

  if (system.batteryLevel != null && system.batteryLevel < 20 && !system.batteryCharging) {
    candidates.push({
      message: 'Misschien moet je mij straks even opladen.',
      priority: 55,
      cooldownMs: 3600000,
    });
  }

  if (environment.weatherMood === 'rain') {
    candidates.push({ message: 'Vandaag voelt rustig.', priority: 20, cooldownMs: 7200000 });
  }

  if (environment.weatherMood === 'sunny') {
    candidates.push({ message: 'Mooi licht vandaag.', priority: 20, cooldownMs: 7200000 });
  }

  if (environment.temperature != null && environment.temperature > 26) {
    candidates.push({ message: 'Het wordt warm in huis.', priority: 45, cooldownMs: 3600000 });
  }

  if (environment.humidity != null && environment.humidity < 35) {
    candidates.push({ message: 'Misschien is ventileren verstandig.', priority: 40, cooldownMs: 3600000 });
  }

  if (camera.faceDetected && !voice.isListening && !voice.isSpeaking && inactiveMs < 5000) {
    const greeting = dayPhaseGreeting(dayPhase, profile.preferredGreeting);
    if (greeting) {
      candidates.push({ message: greeting, priority: 60, cooldownMs: 14400000 });
    }
    candidates.push({ message: 'Welkom terug.', priority: 58, cooldownMs: 300000 });
  }

  candidates.sort((a, b) => b.priority - a.priority);

  for (const c of candidates) {
    if (Math.random() > trustChance && c.priority < 50) continue;
    const key = c.message.slice(0, 24);
    if (canSpeak(key, c.cooldownMs, now)) {
      return { whisper: c.message, priority: c.priority };
    }
  }

  return { whisper: null, priority: 0 };
}
