import type { PresenceProfile } from './types';

const GREET_COOLDOWN_MS = 120000;

export class GreetingEngine {
  private lastGreetAt = 0;
  private greetedThisSession = false;

  evaluate(
    now: number,
    userAppeared: boolean,
    profile: PresenceProfile,
    personName: string | null
  ): string | null {
    if (!userAppeared) return null;
    if (now - this.lastGreetAt < GREET_COOLDOWN_MS && this.greetedThisSession) return null;

    this.lastGreetAt = now;
    this.greetedThisSession = true;

    if (profile.preferredGreeting) return profile.preferredGreeting;

    const name = personName?.split(' ')[0];
    if (name) return `Hoi ${name}.`;
    return 'Welkom terug.';
  }

  resetSession() {
    this.greetedThisSession = false;
  }
}

export const greetingEngine = new GreetingEngine();
