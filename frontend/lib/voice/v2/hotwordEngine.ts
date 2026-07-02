const WAKE_PATTERNS = [
  /\bhey\s+nova\b/i,
  /\bh[éeèeë]i\s+nova\b/i,
  /\bhé\s+nova\b/i,
  /\bn\.?\s*o\.?\s*v\.?\s*a\.?\b/i,
];

const STOP_PATTERNS = [
  /^(stop|hou op|klaar|bedankt|dankjewel|dank je)(\s+nova)?[.!]?$/i,
  /\bstop\s+nova\b/i,
  /\bhou\s+op\b/i,
];

export function containsWakeWord(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return WAKE_PATTERNS.some((p) => p.test(t));
}

export function stripWakeWord(text: string): string {
  let out = text.trim();
  for (const p of WAKE_PATTERNS) {
    out = out.replace(p, '').trim();
  }
  return out.replace(/^[,.!\s]+/, '').trim();
}

export function isStopCommand(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return STOP_PATTERNS.some((p) => p.test(t));
}
