import type { PersonProfile, PersonRelationship } from './types';

const RELATION_LABELS: Record<PersonRelationship, string> = {
  gebruiker: 'gebruiker',
  partner: 'partner',
  kind: 'zoon/dochter',
  kleinkind: 'kleinkind',
  familie: 'familielid',
  vriend: 'vriend',
  mantelzorger: 'mantelzorger',
  zorgmedewerker: 'zorgmedewerker',
  verpleegkundige: 'verpleegkundige',
  arts: 'arts',
  begeleider: 'begeleider',
  fysiotherapeut: 'fysiotherapeut',
  wijkverpleegkundige: 'wijkverpleegkundige',
  buren: 'buur',
  vrijwilliger: 'vrijwilliger',
  onbekend: 'bezoeker',
  overig: 'bezoeker',
};

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

export function buildGreeting(person: PersonProfile): string {
  if (person.favoriteGreeting) return person.favoriteGreeting;
  const tod = timeOfDayGreeting();
  const name = person.firstName || person.displayName;

  if (person.relationship === 'arts') {
    const title = person.lastName ? `dokter ${person.lastName}` : `dokter ${name}`;
    return `${tod} ${title}.`;
  }

  return `${tod} ${name}.`;
}

export function buildUnknownGreeting(): string {
  return 'Hallo, ik ken u nog niet. Mag ik vragen wie u bent?';
}

export function buildConsentPrompt(): string {
  return 'Mag ik je leren kennen?';
}

export function buildRelationAnnouncement(person: PersonProfile): string {
  const label = RELATION_LABELS[person.relationship] ?? 'bezoeker';
  const name = person.displayName;

  switch (person.relationship) {
    case 'partner':
      return `Je partner ${name} is thuis.`;
    case 'arts':
      return person.lastName
        ? `Je huisarts dokter ${person.lastName} is gearriveerd.`
        : `Je arts ${name} is gearriveerd.`;
    case 'mantelzorger':
      return `Je mantelzorger ${name} is binnen.`;
    case 'zorgmedewerker':
    case 'verpleegkundige':
    case 'wijkverpleegkundige':
      return `Zorgmedewerker ${name} is gearriveerd.`;
    case 'kind':
      return `Je ${label} ${name} is er.`;
    default:
      return `${name} (${label}) is gearriveerd.`;
  }
}

export function buildPersonalityContext(person: PersonProfile | null): string {
  if (!person) return '';
  const prefs = Object.entries(person.preferences)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return `Huidige persoon: ${person.displayName}, relatie: ${person.relationship}.${prefs ? ` Voorkeuren: ${prefs}.` : ''}`;
}

export function formatLastVisit(lastVisitAt?: number): string {
  if (!lastVisitAt) return 'Nog niet eerder';
  const days = Math.floor((Date.now() - lastVisitAt) / 86400000);
  if (days === 0) return 'Vandaag';
  if (days === 1) return 'Gisteren';
  return `${days} dagen geleden`;
}
