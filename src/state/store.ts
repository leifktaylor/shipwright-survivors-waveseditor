import { create } from 'zustand';
import type {
  WavesDoc,
  WaveJSON,
  WaveShipEntryJSON,
  WaveIncidentEntryJSON,
} from '@/types/WaveJSON';
import type { EditorState, UIState } from '@/types/EditorState';
import { reorder } from '@/utils/dragDrop';

function defaultWave(): WaveJSON {
  return { mods: [], ships: [], spawnDistribution: 'aroundPlayer', sustainMode: true };
}
function defaultShip(): WaveShipEntryJSON {
  return { shipId: '', count: 1, hunter: true };
}
function defaultIncident(): WaveIncidentEntryJSON {
  return { spawnChance: 1.0, script: '' };
}

const initialDoc: WavesDoc = { version: 1, affixes: {}, behaviors: {}, waves: [] };

type Actions = {
  // doc / selection
  setDoc: (doc: WavesDoc) => void;
  setDirty: (v: boolean) => void;
  selectWave: (idx: number | null) => void;

  // waves (CRUD + fields)
  addWave: () => void;
  deleteWave: (idx: number) => void;
  reorderWaves: (from: number, to: number) => void;
  updateWave: (idx: number, patch: Partial<WaveJSON>) => void;

  // wave settings convenience
  setWaveSustain: (idx: number, v: boolean) => void;
  setWaveDuration: (idx: number, v: number | 'Infinity' | undefined) => void;
  setWaveSpawnDistribution: (idx: number, v: NonNullable<WaveJSON['spawnDistribution']>) => void;
  setWaveAtCoords: (idx: number, coords: WaveJSON['atCoords']) => void;
  setWaveSpawnDelay: (idx: number, v: number | undefined) => void;
  setWaveIsBoss: (idx: number, v: boolean | undefined) => void;

  // ships (within wave)
  addShip: (wi: number) => void;
  deleteShip: (wi: number, si: number) => void;
  duplicateShip: (wi: number, si: number) => void;
  reorderShips: (wi: number, from: number, to: number) => void;
  updateShip: (wi: number, si: number, patch: Partial<WaveShipEntryJSON>) => void;

  // incidents (within wave)
  addIncident: (wi: number) => void;
  deleteIncident: (wi: number, ii: number) => void;
  duplicateIncident: (wi: number, ii: number) => void;
  reorderIncidents: (wi: number, from: number, to: number) => void;
  updateIncident: (wi: number, ii: number, patch: Partial<WaveIncidentEntryJSON>) => void;

  // registries (basic CRUD; rename/cascade later)
  upsertAffix: (id: string, value: NonNullable<WaveShipEntryJSON['affixes']>) => void;
  removeAffix: (id: string) => void;
  upsertBehavior: (id: string, value: NonNullable<WaveShipEntryJSON['behavior']>) => void;
  removeBehavior: (id: string) => void;

  // registry maintenance (rename/delete with cascade)
  renameAffix: (oldId: string, newId: string) => void;
  deleteAffixWithReplace: (oldId: string, replacementId: string | '') => void;
  renameBehavior: (oldId: string, newId: string) => void;
  deleteBehaviorWithReplace: (oldId: string, replacementId: string | '') => void;

  // modals
  openAffixesModal: () => void;
  closeAffixesModal: () => void;
  openBehaviorsModal: () => void;
  closeBehaviorsModal: () => void;

  openIncidentsModal: (wi: number, ii: number | null) => void;
  closeIncidentsModal: () => void;
  showIncidentsModal: boolean;
  incidentModalTarget: { wi: number; ii: number | null } | null;

  // ship picker modal
  openShipPicker: (wi: number, si: number) => void;
  closeShipPicker: () => void;
  setShipId: (wi: number, si: number, shipId: string) => void;

  // ui flags
  showAffixesModal: boolean;
  showBehaviorsModal: boolean;
  showShipPicker: boolean;
  shipPickerTarget: { wi: number; si: number } | null;

  // selection
  selectedWaveIdx: number | null;
};

type Store = EditorState & UIState & Actions;

export const useStore = create<Store>((set, get) => ({
  doc: initialDoc,
  selectedWaveIdx: null,
  dirty: false,

  showAffixesModal: false,
  showBehaviorsModal: false,

  // ship picker UI
  showShipPicker: false,
  shipPickerTarget: null,

  setDoc: (doc) => set({ doc, selectedWaveIdx: doc.waves.length ? 0 : null, dirty: false }),
  setDirty: (v) => set({ dirty: v }),
  selectWave: (idx) => set({ selectedWaveIdx: idx }),

  showIncidentsModal: false,
  incidentModalTarget: null,

  openIncidentsModal: (wi, ii) => set({ showIncidentsModal: true, incidentModalTarget: { wi, ii } }),
  closeIncidentsModal: () => set({ showIncidentsModal: false, incidentModalTarget: null }),

  addWave: () => {
    const doc = structuredClone(get().doc);
    doc.waves.push(defaultWave());
    set({ doc, selectedWaveIdx: doc.waves.length - 1, dirty: true });
  },
  deleteWave: (idx) => {
    const doc = structuredClone(get().doc);
    if (idx < 0 || idx >= doc.waves.length) return;
    doc.waves.splice(idx, 1);
    const nextSel = doc.waves.length ? Math.min(idx, doc.waves.length - 1) : null;
    set({ doc, selectedWaveIdx: nextSel, dirty: true });
  },
  reorderWaves: (from, to) => {
    const { doc, selectedWaveIdx } = get();
    if (from === to || from < 0 || to < 0 || from >= doc.waves.length || to >= doc.waves.length) return;
    const waves = reorder(doc.waves, from, to);

    let sel = selectedWaveIdx;
    if (sel === from) sel = to;
    else if (sel != null) {
      if (from < sel && to >= sel) sel = sel - 1;
      else if (from > sel && to <= sel) sel = sel + 1;
    }
    set({ doc: { ...doc, waves }, selectedWaveIdx: sel, dirty: true });
  },
  updateWave: (idx, patch) => {
    const doc = structuredClone(get().doc);
    Object.assign(doc.waves[idx], patch);
    set({ doc, dirty: true });
  },

  setWaveSustain: (idx, v) => get().updateWave(idx, { sustainMode: v }),
  setWaveDuration: (idx, v) => get().updateWave(idx, { duration: v }),
  setWaveSpawnDistribution: (idx, v) => {
    // Keep atCoords even if switching away from 'at' (harmless); could clear if desired
    get().updateWave(idx, { spawnDistribution: v });
  },
  setWaveAtCoords: (idx, coords) => get().updateWave(idx, { atCoords: coords }),
  setWaveSpawnDelay: (idx, v) => get().updateWave(idx, { spawnDelay: v }),
  setWaveIsBoss: (idx, v) => get().updateWave(idx, { isBoss: v }),

  addShip: (wi) => {
    const doc = structuredClone(get().doc);
    doc.waves[wi].ships.push(defaultShip());
    set({ doc, dirty: true });
  },
  deleteShip: (wi, si) => {
    const doc = structuredClone(get().doc);
    doc.waves[wi].ships.splice(si, 1);
    set({ doc, dirty: true });
  },
  duplicateShip: (wi, si) => {
    const doc = structuredClone(get().doc);
    const copy = structuredClone(doc.waves[wi].ships[si]);
    doc.waves[wi].ships.splice(si + 1, 0, copy);
    set({ doc, dirty: true });
  },
  reorderShips: (wi, from, to) => {
    const doc = structuredClone(get().doc);
    const arr = doc.waves[wi].ships;
    doc.waves[wi].ships = reorder(arr, from, to);
    set({ doc, dirty: true });
  },
  updateShip: (wi, si, patch) => {
    const doc = structuredClone(get().doc);
    Object.assign(doc.waves[wi].ships[si], patch);
    set({ doc, dirty: true });
  },

  addIncident: (wi) => {
    const doc = structuredClone(get().doc);
    (doc.waves[wi].incidents ??= []).push(defaultIncident());
    set({ doc, dirty: true });
  },
  deleteIncident: (wi, ii) => {
    const doc = structuredClone(get().doc);
    if (!doc.waves[wi].incidents) return;
    doc.waves[wi].incidents!.splice(ii, 1);
    set({ doc, dirty: true });
  },
  duplicateIncident: (wi, ii) => {
    const doc = structuredClone(get().doc);
    if (!doc.waves[wi].incidents) doc.waves[wi].incidents = [];
    const copy = structuredClone(doc.waves[wi].incidents![ii]);
    doc.waves[wi].incidents!.splice(ii + 1, 0, copy);
    set({ doc, dirty: true });
  },
  reorderIncidents: (wi, from, to) => {
    const doc = structuredClone(get().doc);
    const arr = (doc.waves[wi].incidents ??= []);
    doc.waves[wi].incidents = reorder(arr, from, to);
    set({ doc, dirty: true });
  },
  updateIncident: (wi, ii, patch) => {
    const doc = structuredClone(get().doc);
    if (!doc.waves[wi].incidents) doc.waves[wi].incidents = [];
    Object.assign(doc.waves[wi].incidents![ii], patch);
    set({ doc, dirty: true });
  },

  openAffixesModal: () => set({ showAffixesModal: true }),
  closeAffixesModal: () => set({ showAffixesModal: false }),
  openBehaviorsModal: () => set({ showBehaviorsModal: true }),
  closeBehaviorsModal: () => set({ showBehaviorsModal: false }),

  // --- Ship Picker modal ---
  openShipPicker: (wi, si) => set({ showShipPicker: true, shipPickerTarget: { wi, si } }),
  closeShipPicker: () => set({ showShipPicker: false, shipPickerTarget: null }),
  setShipId: (wi, si, shipId) => {
    const { doc } = get();
    const waves = [...doc.waves];
    const wave = { ...waves[wi] };
    const ships = wave.ships.map((s, idx) => (idx === si ? { ...s, shipId } : s));
    wave.ships = ships;
    waves[wi] = wave;
    set({ doc: { ...doc, waves }, showShipPicker: false, shipPickerTarget: null, dirty: true });
  },

  // --- Registry ops ---
  upsertAffix: (id, value) => {
    const doc = structuredClone(get().doc);
    doc.affixes[id] = { ...(value ?? {}) };
    set({ doc, dirty: true });
  },
  removeAffix: (id) => {
    const doc = structuredClone(get().doc);
    delete doc.affixes[id];
    set({ doc, dirty: true });
  },
  upsertBehavior: (id, value) => {
    const doc = structuredClone(get().doc);
    doc.behaviors[id] = { ...(value ?? {}) };
    set({ doc, dirty: true });
  },
  removeBehavior: (id) => {
    const doc = structuredClone(get().doc);
    delete doc.behaviors[id];
    set({ doc, dirty: true });
  },

  renameAffix: (oldId: string, newId: string) => {
    const doc = structuredClone(get().doc);
    if (!doc.affixes[oldId]) return;
    if (doc.affixes[newId]) throw new Error(`Affix "${newId}" already exists.`);
    doc.affixes[newId] = doc.affixes[oldId];
    delete doc.affixes[oldId];
    for (const w of doc.waves) for (const s of w.ships) if (s.affixesRef === oldId) s.affixesRef = newId;
    set({ doc, dirty: true });
  },
  deleteAffixWithReplace: (oldId: string, replacementId: string | '') => {
    const doc = structuredClone(get().doc);
    if (replacementId && !doc.affixes[replacementId]) throw new Error(`Replacement "${replacementId}" not found`);
    for (const w of doc.waves) {
      for (const s of w.ships) {
        if (s.affixesRef === oldId) s.affixesRef = replacementId || undefined;
      }
    }
    delete doc.affixes[oldId];
    set({ doc, dirty: true });
  },

  renameBehavior: (oldId: string, newId: string) => {
    const doc = structuredClone(get().doc);
    if (!doc.behaviors[oldId]) return;
    if (doc.behaviors[newId]) throw new Error(`Behavior "${newId}" already exists.`);
    doc.behaviors[newId] = doc.behaviors[oldId];
    delete doc.behaviors[oldId];
    for (const w of doc.waves) for (const s of w.ships) if (s.behaviorRef === oldId) s.behaviorRef = newId;
    set({ doc, dirty: true });
  },
  deleteBehaviorWithReplace: (oldId: string, replacementId: string | '') => {
    const doc = structuredClone(get().doc);
    if (replacementId && !doc.behaviors[replacementId]) throw new Error(`Replacement "${replacementId}" not found`);
    for (const w of doc.waves) {
      for (const s of w.ships) {
        if (s.behaviorRef === oldId) s.behaviorRef = replacementId || undefined;
      }
    }
    delete doc.behaviors[oldId];
    set({ doc, dirty: true });
  },
}));
