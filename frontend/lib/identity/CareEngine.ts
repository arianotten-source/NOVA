import type { CareProfile } from './types';
import { loadIdentityStore, saveIdentityStore } from './identityStore';

export async function getCareProfile(): Promise<CareProfile> {
  const store = await loadIdentityStore();
  return store.care;
}

export async function updateCareProfile(partial: Partial<CareProfile>): Promise<CareProfile> {
  const store = await loadIdentityStore();
  store.care = { ...store.care, ...partial, updatedAt: Date.now() };
  await saveIdentityStore(store);
  return store.care;
}

export async function addCareNote(category: keyof CareProfile, note: string): Promise<void> {
  const store = await loadIdentityStore();
  const arr = store.care[category];
  if (Array.isArray(arr)) {
    (arr as string[]).unshift(note);
    if ((arr as string[]).length > 50) (arr as string[]).length = 50;
  }
  store.care.updatedAt = Date.now();
  await saveIdentityStore(store);
}

export function buildCareContext(care: CareProfile): string {
  const parts: string[] = [];
  if (care.medications.length) parts.push(`Medicatie: ${care.medications.join(', ')}`);
  if (care.allergies.length) parts.push(`Allergieën: ${care.allergies.join(', ')}`);
  if (care.appointments.length) parts.push(`Afspraken: ${care.appointments.slice(0, 3).join('; ')}`);
  if (care.diet.length) parts.push(`Dieet: ${care.diet.join(', ')}`);
  if (care.moodNotes.length) parts.push(`Stemming: ${care.moodNotes[0]}`);
  return parts.join('. ');
}

/** Detect missed regular visit pattern */
export function detectMissedVisit(
  personName: string,
  usualDay: string,
  lastVisitAt?: number
): string | null {
  const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long' }).toLowerCase();
  const usual = usualDay.toLowerCase();
  if (!today.includes(usual.slice(0, 3)) && usual.includes(today.slice(0, 3))) {
    if (!lastVisitAt || Date.now() - lastVisitAt > 86400000 * 6) {
      return `${personName} is vandaag nog niet geweest.`;
    }
  }
  return null;
}

/** Inactivity alert */
export function detectStillnessAlert(inactiveMs: number): string | null {
  if (inactiveMs > 300000) return 'Gaat alles goed?';
  return null;
}
