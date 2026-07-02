import type { VisitorLogEntry, PersonProfile } from './types';
import { loadIdentityStore, saveIdentityStore } from './identityStore';

function uid() {
  return `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function startVisit(
  person: PersonProfile | null,
  unknownName = 'Onbekende bezoeker'
): Promise<VisitorLogEntry> {
  const store = await loadIdentityStore();
  const entry: VisitorLogEntry = {
    id: uid(),
    personId: person?.id ?? null,
    personName: person?.displayName ?? unknownName,
    relationship: person?.relationship,
    arrivedAt: Date.now(),
  };
  if (store.settings.storeVisitorLog) {
    store.visitorLog.unshift(entry);
    if (store.visitorLog.length > 200) store.visitorLog.length = 200;
    await saveIdentityStore(store);
  }
  return entry;
}

export async function endVisit(visitId: string, notes?: string): Promise<VisitorLogEntry | null> {
  const store = await loadIdentityStore();
  const entry = store.visitorLog.find((v) => v.id === visitId && !v.leftAt);
  if (!entry) return null;

  entry.leftAt = Date.now();
  entry.durationMs = entry.leftAt - entry.arrivedAt;
  if (notes) entry.notes = notes;

  const time = new Date(entry.leftAt).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  console.log(`[VisitorLog] ${time} ${entry.personName} vertrokken.`);

  await saveIdentityStore(store);
  return entry;
}

export function formatVisitLogLine(entry: VisitorLogEntry, kind: 'arrive' | 'leave'): string {
  const t = new Date(kind === 'arrive' ? entry.arrivedAt : (entry.leftAt ?? Date.now()));
  const time = t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (kind === 'arrive') return `${time} ${entry.personName} gearriveerd.`;
  return `${time} ${entry.personName} vertrokken.`;
}

export async function getRecentVisits(limit = 20): Promise<VisitorLogEntry[]> {
  const store = await loadIdentityStore();
  return store.visitorLog.slice(0, limit);
}
