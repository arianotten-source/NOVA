const WAKE_PATTERNS = [
  /\bhey\s*nova\b/i,
  /\bh[ae]i\s*nova\b/i,
  /\bn\.?\s*o\.?\s*v\.?\s*a\.?\b/i,
  /\bnova\b/i,
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
