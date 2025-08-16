// src/modals/BehaviorsModal.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { getBehaviorIds, collectBehaviorUsage } from '@/state/selectors';
import type { BehaviorJSON } from '@/types/WaveJSON';
import { BEHAVIOR_PRESETS } from './presets';

function nextId(base: string, existing: Set<string>): string {
  const b = (base || 'NEW_BEHAVIOR').replace(/\s+/g, '_').toUpperCase();
  if (!existing.has(b)) return b;
  for (let i = 2; i < 9999; i++) {
    const cand = `${b}_${i}`;
    if (!existing.has(cand)) return cand;
  }
  return `${b}_${Date.now()}`;
}

function getNum(o: any, k: string): number | undefined {
  const v = o?.[k];
  return typeof v === 'number' ? v : undefined;
}

export default function BehaviorsModal({ onClose }: { onClose: () => void }) {
  const {
    doc, upsertBehavior, renameBehavior, deleteBehaviorWithReplace,
  } = useStore();

  const ids = useMemo(() => getBehaviorIds(doc), [doc]);
  const idSet = useMemo(() => new Set(ids), [ids]);
  const usage = useMemo(() => collectBehaviorUsage(doc), [doc]);

  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(ids[0] ?? null);
  const [idDraft, setIdDraft] = useState<string>(selected ?? '');
  const [presetName, setPresetName] = useState<string>(() => doc.behaviors[selected ?? '']?.preset ?? 'siege');

  // Params JSON + common trio (kept in sync on selection/change)
  const [paramsJson, setParamsJson] = useState<string>(() => {
    const bj = selected ? doc.behaviors[selected] : undefined;
    return bj?.params ? JSON.stringify(bj.params, null, 2) : '';
  });
  const [er, setEr] = useState<number | ''>(() => getNum(doc.behaviors[selected ?? '']?.params, 'engagementRange') ?? '');
  const [dr, setDr] = useState<number | ''>(() => getNum(doc.behaviors[selected ?? '']?.params, 'disengageRange') ?? '');
  const [sr, setSr] = useState<number | ''>(() => getNum(doc.behaviors[selected ?? '']?.params, 'siegeRange') ?? '');

  const idInputRef = useRef<HTMLInputElement>(null);

  // Select an existing behavior -> sync editor
  function selectId(id: string) {
    setSelected(id);
    setIdDraft(id);
    const b = doc.behaviors[id];
    setPresetName(b?.preset ?? 'siege');
    setParamsJson(b?.params ? JSON.stringify(b.params, null, 2) : '');
    setEr(getNum(b?.params, 'engagementRange') ?? '');
    setDr(getNum(b?.params, 'disengageRange') ?? '');
    setSr(getNum(b?.params, 'siegeRange') ?? '');
  }

  // Start a new draft
  function onNew() {
    const base = filter.trim() || 'NEW_BEHAVIOR';
    const newId = nextId(base, idSet);
    setSelected(null);
    setIdDraft(newId);
    setPresetName('siege');
    setParamsJson('');
    setEr(''); setDr(''); setSr('');
    setTimeout(() => idInputRef.current?.select(), 0);
  }

  // Create a draft from preset
  function addFromPreset(key: string) {
    const base = key;
    const newId = nextId(base, idSet);
    const b = BEHAVIOR_PRESETS[key];
    setSelected(null);
    setIdDraft(newId);
    setPresetName(b.preset);
    setParamsJson(b.params ? JSON.stringify(b.params, null, 2) : '');
    setEr(getNum(b.params, 'engagementRange') ?? '');
    setDr(getNum(b.params, 'disengageRange') ?? '');
    setSr(getNum(b.params, 'siegeRange') ?? '');
    setTimeout(() => idInputRef.current?.select(), 0);
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? ids.filter(k => k.toLowerCase().includes(q)) : ids;
  }, [ids, filter]);

  function onClearFields() {
    setParamsJson('');
    setEr(''); setDr(''); setSr('');
  }

  function onSave() {
    const id = idDraft.trim();
    if (!id) { alert('Enter an identifier'); return; }
    if (selected && id !== selected && idSet.has(id)) {
      alert(`Behavior "${id}" already exists`); return;
    }

    // Parse params json
    let params: Record<string, any> | undefined;
    try {
      params = paramsJson.trim() ? JSON.parse(paramsJson) : undefined;
    } catch {
      alert('Params JSON invalid'); return;
    }

    // Merge common trio
    const trio = {
      engagementRange: er === '' ? undefined : er,
      disengageRange:  dr === '' ? undefined : dr,
      siegeRange:      sr === '' ? undefined : sr,
    };
    params = { ...(params ?? {}) };
    for (const [k, v] of Object.entries(trio)) if (typeof v === 'number') (params as any)[k] = v;
    if (params && Object.keys(params).length === 0) params = undefined;

    const payload: BehaviorJSON = { preset: presetName || 'siege', params };

    if (!selected || selected === id) {
      upsertBehavior(id, payload);
      setSelected(id);
    } else {
      try { renameBehavior(selected, id); } catch (e) { alert((e as Error).message); return; }
      upsertBehavior(id, payload);
      setSelected(id);
    }
  }

  function onDelete() {
    if (!selected) return;
    const count = usage[selected] ?? 0;
    if (count > 0) {
      const choice = prompt(`"${selected}" is used ${count} time(s).\nEnter replacement id or leave blank to clear references:`);
      try {
        deleteBehaviorWithReplace(selected, (choice ?? '').trim());
      } catch (e) {
        alert((e as Error).message);
        return;
      }
    } else {
      deleteBehaviorWithReplace(selected, '');
    }
    // Clear editor
    setSelected(null);
    setIdDraft('');
    setPresetName('siege');
    setParamsJson('');
    setEr(''); setDr(''); setSr('');
  }

  // Keep editor valid if current selection gets removed externally
  useEffect(() => {
    if (selected && !doc.behaviors[selected]) {
      const fallback = getBehaviorIds(doc)[0] ?? null;
      setSelected(fallback);
      setIdDraft(fallback ?? '');
      if (fallback) {
        const b = doc.behaviors[fallback];
        setPresetName(b?.preset ?? 'siege');
        setParamsJson(b?.params ? JSON.stringify(b.params, null, 2) : '');
        setEr(getNum(b?.params, 'engagementRange') ?? '');
        setDr(getNum(b?.params, 'disengageRange') ?? '');
        setSr(getNum(b?.params, 'siegeRange') ?? '');
      } else {
        setPresetName('siege'); setParamsJson(''); setEr(''); setDr(''); setSr('');
      }
    }
  }, [doc, selected]);

  return (
    <>
      <div className="modal-header">
        <h3>Behaviors Editor</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="row" style={{ gap: 12, alignItems: 'stretch', minHeight: 0 }}>
        {/* Left: registry list */}
        <div className="panel" style={{ width: 320, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <strong>All Behaviors</strong>
            <span className="pill">{ids.length}</span>
            <div className="spacer" />
            <button onClick={onNew} title="Create a new behavior">+ New</button>
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
              {Object.keys(BEHAVIOR_PRESETS).map(k => (
                <button key={k} className="chip" onClick={() => addFromPreset(k)} title={`Start from ${k}`}>
                  {k}
                </button>
              ))}
            </div>
            <div className="muted tiny">Pick a preset, tweak params on the right, then <strong>Save</strong>.</div>
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
              placeholder="NEW_BEHAVIOR"
              style={{ minWidth: 260, flex: '0 0 auto' }}
            />
            <div className="spacer" />
            {selected && (
              <span className="pill" title="Current usage in waves">
                {usage[selected] ?? 0} used
              </span>
            )}
            <button onClick={onSave} title="Save changes">Save</button>
            <button className="btn-ghost" onClick={onClearFields} title="Clear params JSON & common fields">Clear</button>
            <button className="btn-danger" onClick={onDelete} disabled={!selected} title="Delete behavior">Delete</button>
          </div>

          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <label>preset</label>
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="siege"
              style={{ width: 200 }}
            />
            <span className="pill">Common params</span>
            <label className="row" style={{ gap: 6 }}>
              engagementRange
              <input
                type="number"
                value={er}
                onChange={e => setEr(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: 120 }}
              />
            </label>
            <label className="row" style={{ gap: 6 }}>
              disengageRange
              <input
                type="number"
                value={dr}
                onChange={e => setDr(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: 120 }}
              />
            </label>
            <label className="row" style={{ gap: 6 }}>
              siegeRange
              <input
                type="number"
                value={sr}
                onChange={e => setSr(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: 120 }}
              />
            </label>
          </div>

          <div className="col" style={{ gap: 6, minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
            <label>params (JSON)</label>
            <textarea
              className="code"
              placeholder='{"engagementRange": 1200, "disengageRange": 1400, "siegeRange": 1200}'
              value={paramsJson}
              onChange={e => setParamsJson(e.target.value)}
              style={{ minHeight: 160 }}
            />
            <div className="muted tiny">
              The three numeric fields above overwrite matching keys in JSON on save.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
