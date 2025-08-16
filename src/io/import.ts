// src/io/import.ts

import type { WavesDoc, WavesFileJSON } from '@/types/WaveJSON';
import { normalizeIn } from './normalize';

export async function importFromFile(file: File): Promise<WavesDoc> {
  const text = await file.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Not valid JSON'); }
  const doc = parsed as Partial<WavesFileJSON>;
  if (doc == null || (doc as any).version !== 1) {
    throw new Error('Unsupported or missing "version" (expected 1)');
  }
  return normalizeIn(doc as WavesFileJSON);
}
