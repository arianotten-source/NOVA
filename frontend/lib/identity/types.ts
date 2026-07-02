/** Relatie tot de primaire gebruiker */
export type PersonRelationship =
  | 'gebruiker'
  | 'partner'
  | 'kind'
  | 'kleinkind'
  | 'familie'
  | 'vriend'
  | 'mantelzorger'
  | 'zorgmedewerker'
  | 'verpleegkundige'
  | 'arts'
  | 'begeleider'
  | 'fysiotherapeut'
  | 'wijkverpleegkundige'
  | 'buren'
  | 'vrijwilliger'
  | 'onbekend'
  | 'overig';

export const RELATIONSHIP_OPTIONS: { value: PersonRelationship; label: string }[] = [
  { value: 'gebruiker', label: 'Gebruiker' },
  { value: 'partner', label: 'Partner' },
  { value: 'kind', label: 'Kind' },
  { value: 'kleinkind', label: 'Kleinkind' },
  { value: 'familie', label: 'Familie' },
  { value: 'vriend', label: 'Vriend' },
  { value: 'mantelzorger', label: 'Mantelzorger' },
  { value: 'zorgmedewerker', label: 'Zorgmedewerker' },
  { value: 'verpleegkundige', label: 'Verpleegkundige' },
  { value: 'arts', label: 'Arts' },
  { value: 'begeleider', label: 'Begeleider' },
  { value: 'fysiotherapeut', label: 'Fysiotherapeut' },
  { value: 'wijkverpleegkundige', label: 'Wijkverpleegkundige' },
  { value: 'buren', label: 'Buren' },
  { value: 'vrijwilliger', label: 'Vrijwilliger' },
  { value: 'onbekend', label: 'Onbekend' },
  { value: 'overig', label: 'Overig' },
];

export type ContactMethodType =
  | 'mobiel'
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'videobellen'
  | 'signal'
  | 'telegram'
  | 'teams'
  | 'meet'
  | 'overig';

export interface ContactMethod {
  type: ContactMethodType;
  value: string;
  label?: string;
  primary?: boolean;
}

export interface PersonProfile {
  id: string;
  firstName: string;
  lastName?: string;
  displayName: string;
  relationship: PersonRelationship;
  faceDescriptor: number[];
  favoriteGreeting?: string;
  usualVisitDay?: string;
  lastVisitAt?: number;
  visitCount: number;
  contacts: ContactMethod[];
  preferences: Record<string, string>;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  consentGiven: boolean;
}

export interface VisitorLogEntry {
  id: string;
  personId: string | null;
  personName: string;
  relationship?: PersonRelationship;
  arrivedAt: number;
  leftAt?: number;
  durationMs?: number;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  label: string;
  personId?: string;
  contact: ContactMethod;
  priority: number;
  autoCallOnEmergency?: boolean;
}

export interface CareProfile {
  medications: string[];
  appointments: string[];
  visitSchedule: string[];
  diet: string[];
  allergies: string[];
  dailyPlan: string[];
  sleepRhythm: string[];
  moodNotes: string[];
  waterIntakeMl?: number;
  lastTemperature?: number;
  lastHumidity?: number;
  sensorNotes: string[];
  updatedAt: number;
}

export interface IdentitySettings {
  faceRecognitionEnabled: boolean;
  autoGreetKnown: boolean;
  askBeforeEnroll: boolean;
  storeVisitorLog: boolean;
  encryptedStorage: boolean;
}

export interface IdentitySnapshot {
  currentPersonId: string | null;
  currentPersonName: string | null;
  isKnown: boolean;
  isUnknown: boolean;
  greeting: string | null;
  enrollmentPrompt: string | null;
  activeVisitId: string | null;
  lastMatchConfidence: number;
}

export const DEFAULT_IDENTITY_SETTINGS: IdentitySettings = {
  faceRecognitionEnabled: true,
  autoGreetKnown: true,
  askBeforeEnroll: true,
  storeVisitorLog: true,
  encryptedStorage: true,
};

export interface IdentityStoreState {
  persons: PersonProfile[];
  visitorLog: VisitorLogEntry[];
  emergencyContacts: EmergencyContact[];
  care: CareProfile;
  settings: IdentitySettings;
}
