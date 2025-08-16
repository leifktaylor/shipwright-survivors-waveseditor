// src/io/normalize.ts

import type { WavesFileJSON, WavesDoc, WaveJSON } from '@/types/WaveJSON';

export function normalizeIn(doc: WavesFileJSON): WavesDoc {
  const waves = (doc.waves ?? []).map(applyWaveDefaults);
  return {
    version: 1,
    affixes: doc.affixes ?? {},
    behaviors: doc.behaviors ?? {},
    waves,
  };
}

/** Emit a JSON file conforming to runtime format; registries are included (possibly empty). */
export function normalizeOut(doc: WavesDoc): WavesFileJSON {
  const waves = doc.waves.map(w => {
    const out: WaveJSON = { ...w };
    if (!out.mods) out.mods = [];
    return out;
  });
  return { version: 1, affixes: doc.affixes, behaviors: doc.behaviors, waves };
}

function applyWaveDefaults(w: WaveJSON): WaveJSON {
  return {
    mods: w.mods ?? [],
    ships: w.ships ?? [],
    incidents: w.incidents,
    formations: w.formations,
    music: w.music,
    lightingSettings: w.lightingSettings,
    duration: w.duration,
    spawnDistribution: w.spawnDistribution ?? 'aroundPlayer',
    atCoords: w.atCoords,
    isBoss: w.isBoss,
    sustainMode: w.sustainMode ?? true,
    spawnDelay: w.spawnDelay,
  };
}
