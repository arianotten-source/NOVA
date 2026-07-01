import type {
  AvatarAnimation,
  AvatarExpression,
  AutoEmotionId,
  AvatarExpressionId,
} from '@/types/avatar';

export const AVATAR_EXPRESSIONS: AvatarExpression[] = [
  { id: 'blij', emoji: '😊', name: 'Blij', description: 'Normale glimlach' },
  { id: 'heel_blij', emoji: '🤩', name: 'Heel blij', description: 'Grote glimlach · Ogen dicht' },
  { id: 'tevreden', emoji: '☺️', name: 'Tevreden', description: 'Rustige glimlach' },
  { id: 'knipoog', emoji: '😉', name: 'Knipoog', description: 'Linkeroog dicht' },
  { id: 'neutraal', emoji: '😐', name: 'Neutraal', description: 'Geen emotie' },
  { id: 'verrast', emoji: '😮', name: 'Verrast', description: 'Ronde mond · Grote ogen' },
  { id: 'nieuwsgierig', emoji: '🤔', name: 'Nieuwsgierig', description: 'Schuin mondje' },
  { id: 'verdrietig', emoji: '😢', name: 'Verdrietig', description: 'Hangende mond' },
  { id: 'bezorgd', emoji: '😟', name: 'Bezorgd', description: 'Wenkbrauwen omlaag' },
  { id: 'enthousiast', emoji: '😆', name: 'Enthousiast', description: 'Lachende ogen' },
  { id: 'slaperig', emoji: '😴', name: 'Slaperig', description: 'Half gesloten ogen' },
  { id: 'liefdevol', emoji: '😍', name: 'Liefdevol', description: 'Hartjes ogen' },
];

export const AVATAR_ANIMATIONS: AvatarAnimation[] = [
  { id: 'idle', name: 'Idle', description: 'Rustige stand-by animatie' },
  { id: 'knipperen', name: 'Knipperen', description: 'Ogen knipperen' },
  { id: 'praten', name: 'Praten', description: 'Mond beweegt subtiel' },
  { id: 'denken', name: 'Denken', description: 'Blik omhoog' },
  { id: 'luisteren', name: 'Luisteren', description: 'Aandachtige houding' },
  { id: 'lachen', name: 'Lachen', description: 'Vrolijke beweging' },
  { id: 'slapen', name: 'Slapen', description: 'Langzaam ademen' },
  { id: 'opstarten', name: 'Opstarten', description: 'Opstart sequentie' },
  { id: 'verbinden', name: 'Verbinden', description: 'Verbindingspuls' },
  { id: 'offline', name: 'Offline', description: 'Slapend scherm' },
  { id: 'blij', name: 'Blij', description: 'Positieve puls' },
  { id: 'verdrietig', name: 'Verdrietig', description: 'Zachte neerwaartse beweging' },
];

export const AUTO_EMOTION_ITEMS: { id: AutoEmotionId; label: string }[] = [
  { id: 'begroeting', label: 'Begroeting' },
  { id: 'denken', label: 'Denken' },
  { id: 'luisteren', label: 'Luisteren' },
  { id: 'praten', label: 'Praten' },
  { id: 'blij_antwoord', label: 'Blij antwoord' },
  { id: 'verrast_antwoord', label: 'Verrast antwoord' },
  { id: 'foutmelding', label: 'Foutmelding' },
  { id: 'offline', label: 'Offline' },
  { id: 'slaapstand', label: 'Slaapstand' },
  { id: 'wachten', label: 'Wachten' },
  { id: 'verbinden', label: 'Verbinden' },
  { id: 'internet_weg', label: 'Internet weg' },
  { id: 'sensor_actief', label: 'Sensor actief' },
  { id: 'agenda_melding', label: 'Agenda melding' },
  { id: 'nieuwe_taak', label: 'Nieuwe taak' },
  { id: 'timer_afgelopen', label: 'Timer afgelopen' },
  { id: 'waarschuwing', label: 'Waarschuwing' },
];

export const FUTURE_AVATAR_FEATURES = [
  'Lip-sync',
  'Pupil beweging',
  'Servo ogen',
  'Servo mond',
  'Servo wenkbrauwen',
  'Robot hoofd',
  'ESP32',
  'ESP32-CAM',
  'Microfoon',
  'Camera',
  'AI Emotie Engine',
  'Gezichtsherkenning',
  'Stemherkenning',
  'Persoonlijkheid Engine',
  'Mood Engine',
  'Conversation Engine',
];

export const DEFAULT_AUTO_EMOTIONS: Record<AutoEmotionId, boolean> = {
  begroeting: true,
  denken: true,
  luisteren: true,
  praten: true,
  blij_antwoord: true,
  verrast_antwoord: true,
  foutmelding: true,
  offline: true,
  slaapstand: true,
  wachten: true,
  verbinden: true,
  internet_weg: true,
  sensor_actief: true,
  agenda_melding: true,
  nieuwe_taak: true,
  timer_afgelopen: true,
  waarschuwing: true,
};

export const DEFAULT_AVATAR_SETTINGS = {
  name: 'N.O.V.A.',
  voice: 'Vrouw',
  personality: 'Vriendelijk',
  animationSpeed: 'normal' as const,
  blinkFrequency: 'normal' as const,
  expressionIntensity: 'normal' as const,
  theme: 'classic' as const,
};

export function getExpressionById(id: AvatarExpressionId) {
  return AVATAR_EXPRESSIONS.find((e) => e.id === id) ?? AVATAR_EXPRESSIONS[0];
}

export function randomExpressionId(): AvatarExpressionId {
  const idx = Math.floor(Math.random() * AVATAR_EXPRESSIONS.length);
  return AVATAR_EXPRESSIONS[idx].id;
}
