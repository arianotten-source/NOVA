/** Key landmark indices for lightweight face matching */
const KEY_INDICES = [
  1, 33, 133, 263, 61, 291, 199, 168, 5, 4, 234, 454, 10, 152, 376, 148,
];

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export function landmarksToDescriptor(landmarks: LandmarkPoint[]): number[] {
  if (!landmarks.length) return [];

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of landmarks) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const scale = Math.max(0.01, Math.max(maxX - minX, maxY - minY));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const descriptor: number[] = [];
  for (const idx of KEY_INDICES) {
    const p = landmarks[idx];
    if (!p) continue;
    descriptor.push((p.x - cx) / scale, (p.y - cy) / scale);
  }
  return descriptor;
}

function euclideanSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  const dist = Math.sqrt(sum / a.length);
  return Math.max(0, 1 - dist * 2.5);
}

export function matchFaceDescriptor(
  probe: number[],
  candidates: { id: string; descriptor: number[] }[],
  threshold = 0.72
): { id: string; confidence: number } | null {
  let best: { id: string; confidence: number } | null = null;
  for (const c of candidates) {
    const confidence = euclideanSimilarity(probe, c.descriptor);
    if (confidence >= threshold && (!best || confidence > best.confidence)) {
      best = { id: c.id, confidence };
    }
  }
  return best;
}
