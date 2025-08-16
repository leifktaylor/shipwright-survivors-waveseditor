// src/modals/AffixesModal.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { getAffixIds, collectAffixUsage } from '@/state/selectors';
import type { ShipAffixes } from '@/types/WaveJSON';
import { AFFIX_PRESETS } from './presets';

const FIELDS: (keyof ShipAffixes)[] = [
  'thrustPowerMulti', 'turnPowerMulti', 'fireRateMulti',
  'projectileSpeedMulti', 'projectileLifetimeMulti',
  'blockDurabilityMulti', 'blockDropRateMulti',
];

function nextId(base: string, existing: Set<string>): string {
  const b = base.replace(/\s+/g, '_').toUpperCase();
  if (!existing.has(b)) return b;
  for (let i = 2; i < 9999; i++) {
    const cand = `${b}_${i}`;
    if (!existing.has(cand)) return cand;
  }
  return `${b}_${Date.now()}`;
}

export default function AffixesModal({ onClose }: { onClose: () => void }) {
  const {
    doc, upsertAffix, renameAffix, deleteAffixWithReplace,
  } = useStore();

  const ids = useMemo(() => getAffixIds(doc), [doc]);
  const idSet = useMemo(() => new Set(ids), [ids]);
  const usage = useMemo(() => collectAffixUsage(doc), [doc]);

  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(ids[0] ?? null);
  const [idDraft, setIdDraft] = useState<string>(selected ?? '');
  const [model, setModel] = useState<ShipAffixes>(selected ? { ...doc.affixes[selected] } : {});
  const idInputRef = useRef<HTMLInputElement>(null);

  // Keep local editor in sync when changing selection
  function selectId(id: string) {
    setSelected(id);
    setIdDraft(id);
    setModel({ ...(doc.affixes[id] ?? {}) });
  }

  // Start a new (unsaved) affix draft
  function onNew() {
    const base = filter.trim() ? filter.trim() : 'NEW_AFFIX';
    const newId = nextId(base, idSet);
    setSelected(null);
    setIdDraft(newId);
    setModel({});
    // focus id field on next paint
    setTimeout(() => idInputRef.current?.select(), 0);
  }

  // Create from preset (draft; user still confirms with Save)
  function addFromPreset(key: string) {
    const base = key;
    const newId = nextId(base, idSet);
    setSelected(null);
    setIdDraft(newId);
    setModel({ ...AFFIX_PRESETS[key] });
    setTimeout(() => idInputRef.current?.select(), 0);
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? ids.filter(k => k.toLowerCase().includes(q)) : ids;
  }, [ids, filter]);

  function onSave() {
    const id = idDraft.trim();
    if (!id) { alert('Enter an identifier'); return; }

    // rename if needed
    if (selected && id !== selected) {
      if (idSet.has(id)) { alert(`Affix "${id}" already exists`); return; }
      try {
        renameAffix(selected, id);
      } catch (e) {
        alert((e as Error).message);
        return;
      }
    }

    upsertAffix(id, model);
    setSelected(id);
  }

  function onDelete() {
    const id = selected;
    if (!id) return;
    const count = usage[id] ?? 0;
    if (count > 0) {
      const choice = prompt(`"${id}" is used ${count} time(s).\nEnter replacement id or leave blank to clear references:`);
      try {
        deleteAffixWithReplace(id, (choice ?? '').trim());
      } catch (e) {
        alert((e as Error).message);
        return;
      }
    } else {
      deleteAffixWithReplace(id, '');
    }
    // Clear editor after delete
    setSelected(null);
    setIdDraft('');
    setModel({});
  }

  function onClearFields() {
    setModel({});
  }

  function setField<K extends keyof ShipAffixes>(k: K, v: string) {
    const num = v.trim() === '' ? undefined : Number(v);
    setModel(m => ({ ...m, [k]: num as any }));
  }

  // When modal mounts or doc changes, ensure editor points to a valid selection
  useEffect(() => {
    if (selected && !doc.affixes[selected]) {
      const fallback = getAffixIds(doc)[0] ?? null;
      setSelected(fallback);
      setIdDraft(fallback ?? '');
      setModel(fallback ? { ...doc.affixes[fallback] } : {});
    }
  }, [doc, selected]);

  return (
    <>
      <div className="modal-header">
        <h3>Affixes Editor</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="row" style={{ gap: 12, alignItems: 'stretch', minHeight: 0 }}>
        {/* Left: registry list */}
        <div className="panel" style={{ width: 320, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <strong>All Affixes</strong>
            <span className="pill">{ids.length}</span>
            <div className="spacer" />
            <button onClick={onNew} title="Create a new affix">+ New</button>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <input
              type="search"
              placeholder="Filter…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="palette-search"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
            {filtered.length === 0 && <div className="muted small">No matches.</div>}

            <div className="col" style={{ gap: 6 }}>
              {filtered.map(id => (
                <button
                  key={id}
                  className={`wave-item ${selected === id ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                  onClick={() => selectId(id)}
                  title={id}
                >
                  <div className="title ellipsis" style={{ maxWidth: 200 }}>{id}</div>
                  <span className="pill" title="Usage count">{usage[id] ?? 0} use(s)</span>
                </button>
              ))}
            </div>
          </div>

          <div className="col" style={{ gap: 6 }}>
            <div className="muted tiny">Presets</div>
            <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.keys(AFFIX_PRESETS).map(k => (
                <button key={k} className="chip" onClick={() => addFromPreset(k)} title={`Start from ${k}`}>
                  {k}
                </button>
              ))}
            </div>
            <div className="muted tiny">Pick a preset, tweak values on the right, then <strong>Save</strong>.</div>
          </div>
        </div>

        {/* Right: editor form */}
        <div className="panel" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <label>Id</label>
            <input
              ref={idInputRef}
              type="text"
              value={idDraft}
              onChange={e => setIdDraft(e.target.value)}
              placeholder="NEW_AFFIX"
              style={{ minWidth: 260, flex: '0 0 auto' }}
            />
            <div className="spacer" />
            {selected && (
              <span className="pill" title="Current usage in waves">
                {usage[selected] ?? 0} used
              </span>
            )}
            <button onClick={onSave} title="Save changes">Save</button>
            <button className="btn-ghost" onClick={onClearFields} title="Clear all fields">Clear</button>
            <button className="btn-danger" onClick={onDelete} disabled={!selected} title="Delete affix">Delete</button>
          </div>

          <div className="col" style={{ gap: 10, overflow: 'auto', minHeight: 0, paddingRight: 4 }}>
            {FIELDS.map(k => (
              <label key={k} className="row" style={{ gap: 10 }}>
                <span style={{ width: 220 }} className="muted">{k}</span>
                <input
                  type="number"
                  step="0.1"
                  value={model[k] ?? ''}
                  onChange={e => setField(k, e.target.value)}
                  placeholder="—"
                  style={{ width: 140 }}
                />
              </label>
            ))}
            <div className="muted tiny">
              Empty fields are omitted from JSON. Values are multipliers (e.g. <code className="code">2.0</code> = 2×).
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
