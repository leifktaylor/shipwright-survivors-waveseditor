// src/state/selectors.ts


import type { WavesDoc } from '@/types/WaveJSON';

export function collectAffixUsage(doc: WavesDoc): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of doc.waves) {
    for (const s of w.ships) {
      const k = s.affixesRef;
      if (!k) continue;
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  return counts;
}

export function collectBehaviorUsage(doc: WavesDoc): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of doc.waves) {
    for (const s of w.ships) {
      const k = s.behaviorRef;
      if (!k) continue;
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  return counts;
}

export function getAffixIds(doc: WavesDoc): string[] {
  return Object.keys(doc.affixes ?? {}).sort();
}

export function getBehaviorIds(doc: WavesDoc): string[] {
  return Object.keys(doc.behaviors ?? {}).sort();
}
