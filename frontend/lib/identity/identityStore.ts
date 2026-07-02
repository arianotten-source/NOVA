import { readStorage, writeStorage } from '@/lib/storage';
import { decryptPayload, encryptPayload } from './cryptoStorage';
import type { IdentityStoreState, PersonProfile } from './types';
import { DEFAULT_IDENTITY_SETTINGS } from './types';

const COLLECTION = 'identity_care_v1';

const EMPTY: IdentityStoreState = {
  persons: [],
  visitorLog: [],
  emergencyContacts: [],
  care: {
    medications: [],
    appointments: [],
    visitSchedule: [],
    diet: [],
    allergies: [],
    dailyPlan: [],
    sleepRhythm: [],
    moodNotes: [],
    sensorNotes: [],
    updatedAt: Date.now(),
  },
  settings: DEFAULT_IDENTITY_SETTINGS,
};

let cache: IdentityStoreState | null = null;

export async function loadIdentityStore(): Promise<IdentityStoreState> {
  if (cache) return cache;

  const raw = await readStorage<string | IdentityStoreState>(COLLECTION, EMPTY);

  if (typeof raw === 'string') {
    try {
      const json = await decryptPayload(raw);
      cache = { ...EMPTY, ...JSON.parse(json) };
      return cache!;
    } catch {
      cache = { ...EMPTY };
      return cache;
    }
  }

  cache = { ...EMPTY, ...raw };
  return cache;
}

export async function saveIdentityStore(state: IdentityStoreState): Promise<void> {
  cache = state;
  if (state.settings.encryptedStorage) {
    const encrypted = await encryptPayload(JSON.stringify(state));
    await writeStorage(COLLECTION, encrypted);
  } else {
    await writeStorage(COLLECTION, state);
  }
}

export async function upsertPerson(person: PersonProfile): Promise<void> {
  const store = await loadIdentityStore();
  const idx = store.persons.findIndex((p) => p.id === person.id);
  if (idx >= 0) store.persons[idx] = person;
  else store.persons.push(person);
  await saveIdentityStore(store);
}

export async function deletePerson(personId: string): Promise<void> {
  const store = await loadIdentityStore();
  store.persons = store.persons.filter((p) => p.id !== personId);
  await saveIdentityStore(store);
}

export async function getPerson(personId: string): Promise<PersonProfile | null> {
  const store = await loadIdentityStore();
  return store.persons.find((p) => p.id === personId) ?? null;
}

export async function updateIdentitySettings(
  partial: Partial<IdentityStoreState['settings']>
): Promise<void> {
  const store = await loadIdentityStore();
  store.settings = { ...store.settings, ...partial };
  await saveIdentityStore(store);
}

export function clearIdentityCache() {
  cache = null;
}
