import type { ContactMethod, EmergencyContact, PersonProfile } from './types';
import { loadIdentityStore, saveIdentityStore } from './identityStore';

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  const store = await loadIdentityStore();
  return [...store.emergencyContacts].sort((a, b) => a.priority - b.priority);
}

export async function setEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
  const store = await loadIdentityStore();
  store.emergencyContacts = contacts;
  await saveIdentityStore(store);
}

export function getPrimaryContact(person: PersonProfile): ContactMethod | null {
  return person.contacts.find((c) => c.primary) ?? person.contacts[0] ?? null;
}

export interface SmartCallRequest {
  personName: string;
  method: ContactMethod;
  message?: string;
  confirmed: boolean;
}

export async function requestSmartCall(
  query: string,
  persons: PersonProfile[],
  onConfirm: (req: SmartCallRequest) => Promise<boolean>
): Promise<{ status: 'pending' | 'confirmed' | 'cancelled' | 'not_found'; message: string }> {
  const lower = query.toLowerCase();

  let target: PersonProfile | null = null;
  if (lower.includes('zoon') || lower.includes('dochter') || lower.includes('kind')) {
    target = persons.find((p) => p.relationship === 'kind') ?? null;
  } else if (lower.includes('huisarts') || lower.includes('arts')) {
    target = persons.find((p) => p.relationship === 'arts') ?? null;
  } else if (lower.includes('partner')) {
    target = persons.find((p) => p.relationship === 'partner') ?? null;
  } else if (lower.includes('mantelzorger')) {
    target = persons.find((p) => p.relationship === 'mantelzorger') ?? null;
  } else {
    target =
      persons.find((p) => lower.includes(p.firstName.toLowerCase())) ??
      persons.find((p) => lower.includes(p.displayName.toLowerCase())) ??
      null;
  }

  if (!target) {
    return { status: 'not_found', message: 'Ik kon geen contact vinden voor dat verzoek.' };
  }

  const contact = getPrimaryContact(target);
  if (!contact) {
    return { status: 'not_found', message: `${target.displayName} heeft nog geen contactgegevens.` };
  }

  const isMessage = lower.includes('bericht') || lower.includes('laat weten') || lower.includes('stuur');
  const confirmMsg = isMessage
    ? `Wil je dat ik een bericht stuur naar ${target.displayName}?`
    : `Wil je dat ik ${target.displayName} bel?`;

  const confirmed = await onConfirm({
    personName: target.displayName,
    method: contact,
    message: isMessage ? query : undefined,
    confirmed: false,
  });

  if (!confirmed) {
    return { status: 'cancelled', message: confirmMsg };
  }

  if (contact.type === 'mobiel' || contact.type === 'whatsapp') {
    const url =
      contact.type === 'whatsapp'
        ? `https://wa.me/${contact.value.replace(/\D/g, '')}`
        : `tel:${contact.value}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  } else if (contact.type === 'email') {
    window.open(`mailto:${contact.value}`, '_blank');
  }

  return {
    status: 'confirmed',
    message: isMessage
      ? `Bericht naar ${target.displayName} wordt voorbereid.`
      : `${target.displayName} wordt gebeld.`,
  };
}

export function executeSmartCall(req: SmartCallRequest): void {
  const contact = req.method;
  if (contact.type === 'mobiel') {
    window.open(`tel:${contact.value}`, '_blank', 'noopener,noreferrer');
  } else if (contact.type === 'whatsapp') {
    window.open(`https://wa.me/${contact.value.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
  } else if (contact.type === 'email') {
    window.open(`mailto:${contact.value}`, '_blank');
  } else if (contact.type === 'sms') {
    window.open(`sms:${contact.value}`, '_blank');
  }
}
