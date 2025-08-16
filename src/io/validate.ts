// src/io/validate.ts

import type { WavesFileJSON } from '@/types/WaveJSON';

export type Severity = 'error' | 'warning';
export interface ValidationIssue { path: string; message: string; severity: Severity; }

export function validate(doc: WavesFileJSON): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  doc.waves.forEach((w, wi) => {
    if (!Array.isArray(w.ships)) {
      issues.push({ path: `waves[${wi}].ships`, message: 'Must be an array', severity: 'error' });
      return;
    }
    w.ships.forEach((s, si) => {
      if (!s.shipId || typeof s.shipId !== 'string') {
        issues.push({ path: `waves[${wi}].ships[${si}].shipId`, message: 'Required', severity: 'error' });
      }
      if (!Number.isInteger(s.count) || s.count < 1) {
        issues.push({ path: `waves[${wi}].ships[${si}].count`, message: 'Integer ≥ 1', severity: 'error' });
      }
    });
    (w.incidents ?? []).forEach((inc, ii) => {
      if (typeof inc.spawnChance !== 'number' || inc.spawnChance < 0 || inc.spawnChance > 1) {
        issues.push({ path: `waves[${wi}].incidents[${ii}].spawnChance`, message: '0..1', severity: 'error' });
      }
      if (!inc.script) {
        issues.push({ path: `waves[${wi}].incidents[${ii}].script`, message: 'Required', severity: 'error' });
      }
    });
  });
  return issues;
}
