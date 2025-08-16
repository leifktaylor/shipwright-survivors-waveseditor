// src/modals/IncidentsModal.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import type { WaveIncidentEntryJSON } from '@/types/WaveJSON';
import { INCIDENT_PRESETS } from './presets';

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function summarizeOptions(o: any): string {
  if (!o || typeof o !== 'object') return '(none)';
  if (o.maxDuration || Array.isArray(o.tiers))
    return `maxDuration: ${o.maxDuration ?? '—'}, tiers: ${Array.isArray(o.tiers) ? o.tiers.length : 0}`;
  if (Array.isArray(o.ships))
    return `ships: ${o.ships.length}, rewardTier: ${o.rewardBlockTier ?? '—'}`;
  const keys = Object.keys(o);
  return keys.length ? keys.join(', ') : '(none)';
}

export default function IncidentsModal({ onClose }: { onClose: () => void }) {
  const {
    doc, incidentModalTarget, closeIncidentsModal,
    addIncident, updateIncident,
  } = useStore();

  const wi = incidentModalTarget?.wi ?? -1;
  const ii = incidentModalTarget?.ii ?? null;
  const editing = ii != null && wi >= 0;
  const existing = editing ? (doc.waves[wi].incidents?.[ii!] as WaveIncidentEntryJSON | undefined) : undefined;

  // Draft state
  const [spawnChance, setSpawnChance] = useState<number>(existing?.spawnChance ?? 1);
  const [script, setScript] = useState<string>(existing?.script ?? '');
  const [label, setLabel] = useState<string>(existing?.label ?? '');
  const [delaySeconds, setDelaySeconds] = useState<number | ''>(existing?.delaySeconds ?? '');
  const [optionsText, setOptionsText] = useState<string>(() =>
    existing?.options ? JSON.stringify(existing.options, null, 2) : ''
  );

  // Presets list & filter
  const presetKeys = useMemo(() => Object.keys(INCIDENT_PRESETS), []);
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? presetKeys.filter(k => k.toLowerCase().includes(q)) : presetKeys;
  }, [presetKeys, filter]);

  // Load a preset into the editor
  function applyPreset(key: string) {
    const p = INCIDENT_PRESETS[key];
    if (!p) return;
    setSpawnChance(p.spawnChance ?? 1);
    setScript(p.script ?? '');
    setLabel(p.label ?? '');
    setDelaySeconds(p.delaySeconds ?? '');
    setOptionsText(p.options ? JSON.stringify(p.options, null, 2) : '');
  }

  // Reset when target changes
  useEffect(() => {
    if (editing && existing) {
      setSpawnChance(existing.spawnChance ?? 1);
      setScript(existing.script ?? '');
      setLabel(existing.label ?? '');
      setDelaySeconds(existing.delaySeconds ?? '');
      setOptionsText(existing.options ? JSON.stringify(existing.options, null, 2) : '');
    } else if (!editing) {
      // Fresh draft
      setSpawnChance(1);
      setScript('');
      setLabel('');
      setDelaySeconds('');
      setOptionsText('');
    }
  }, [wi, ii]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save handler: edit or insert
  function onSave() {
    if (!script.trim()) { alert('Script is required.'); return; }

    let options: Record<string, any> | undefined;
    const t = optionsText.trim();
    if (t) {
      try { options = JSON.parse(t); }
      catch { alert('Options JSON is invalid.'); return; }
    }

    const payload: WaveIncidentEntryJSON = {
      spawnChance: clamp01(Number(spawnChance) || 0),
      script: script.trim(),
      label: label.trim() || undefined,
      delaySeconds: delaySeconds === '' ? undefined : Number(delaySeconds),
      options,
    };

    if (editing && ii != null) {
      updateIncident(wi, ii, payload);
    } else {
      // Insert at end: compute index prior to add()
      const idx = doc.waves[wi].incidents?.length ?? 0;
      addIncident(wi);
      updateIncident(wi, idx, payload);
    }
    onClose();
  }

  function onClear() {
    setSpawnChance(1);
    setScript('');
    setLabel('');
    setDelaySeconds('');
    setOptionsText('');
  }

  // Small helper palette for known scripts
  const knownScripts = ['CursedCargoIncident', 'DimensionalPortalIncident'];

  return (
    <>
      <div className="modal-header">
        <h3>{editing ? 'Edit Incident' : 'Add Incident'}</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="row" style={{ gap: 12, alignItems: 'stretch', minHeight: 0 }}>
        {/* Left: Presets palette */}
        <div className="panel" style={{ width: 320, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <strong>Presets</strong>
            <span className="pill">{presetKeys.length}</span>
            <div className="spacer" />
            <button className="btn-ghost" onClick={onClear} title="Clear editor">Clear</button>
          </div>

          <input
            type="search"
            placeholder="Filter…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="palette-search"
          />

          <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
            {filtered.length === 0 && <div className="muted small">No matches.</div>}
            <div className="col" style={{ gap: 6 }}>
              {filtered.map(k => (
                <button
                  key={k}
                  className="tile"
                  title={k}
                  onClick={() => applyPreset(k)}
                  style={{ height: 64, justifyContent: 'space-between', padding: '6px 10px' }}
                >
                  <div className="label ellipsis" style={{ position: 'static' }}>{k}</div>
                  <span className="pill tiny">{INCIDENT_PRESETS[k].script}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="muted tiny">
            Choose a preset to prefill the editor on the right. You can tweak and Save.
          </div>
        </div>

        {/* Right: Editor */}
        <div className="panel" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <label>script</label>
            <input
              type="text"
              list="known-scripts"
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="CursedCargoIncident"
              style={{ width: 260 }}
            />
            <datalist id="known-scripts">
              {knownScripts.map(s => <option key={s} value={s} />)}
            </datalist>

            <label>label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="(optional, UI hint)"
              style={{ width: 220 }}
            />

            <label>spawnChance</label>
            <input
              type="range" className="slider"
              min={0} max={1} step={0.01}
              value={spawnChance}
              onChange={e => setSpawnChance(Number(e.target.value))}
            />
            <input
              type="number" step={0.01}
              value={spawnChance}
              onChange={e => setSpawnChance(Number(e.target.value || 0))}
              style={{ width: 90 }}
            />

            <label>delaySeconds</label>
            <input
              type="number"
              value={delaySeconds}
              onChange={e => {
                const v = e.target.value.trim();
                setDelaySeconds(v === '' ? '' : Number(v));
              }}
              style={{ width: 120 }}
            />

            <div className="spacer" />
            <button onClick={onSave}>Save</button>
          </div>

          <div className="col" style={{ gap: 6, minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
            <label>options (JSON)</label>
            <textarea
              className="code"
              placeholder='{"maxDuration": 20, "tiers": [[{"shipId":"wave_0_00","count":4}]]}'
              value={optionsText}
              onChange={e => setOptionsText(e.target.value)}
              style={{ minHeight: 200 }}
            />
            <div className="muted tiny">Summary: {summarizeOptions(optionsText ? (() => { try { return JSON.parse(optionsText); } catch { return null; }})() : null)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
