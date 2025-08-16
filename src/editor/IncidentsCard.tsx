import { useState } from 'react';
import { useStore } from '@/state/store';

function IncidentRow({
  wi, ii,
  spawnChance, script, delaySeconds, options,
}: {
  wi: number; ii: number;
  spawnChance: number; script: string; delaySeconds?: number; options?: Record<string, any>;
}) {
  const { updateIncident, deleteIncident, duplicateIncident, reorderIncidents } = useStore();

  const [text, setText] = useState(options ? JSON.stringify(options, null, 2) : '');

  const onBlurParse = () => {
    if (text.trim() === '') { updateIncident(wi, ii, { options: undefined }); return; }
    try {
      const parsed = JSON.parse(text);
      updateIncident(wi, ii, { options: parsed });
    } catch {
      alert('Invalid JSON in options');
    }
  };

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(ii));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    const to = ii;
    if (!Number.isNaN(from) && from !== to) reorderIncidents(wi, from, to);
  };

  return (
    <div className="card" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="card-header">
        <div className="row" style={{ gap: 8 }}>
          <div className="handle" title="Drag to reorder" draggable onDragStart={onDragStart}>⋮</div>
          <strong>Incident #{ii + 1}</strong>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn-ghost" onClick={() => duplicateIncident(wi, ii)} title="Duplicate">⧉</button>
          <button className="icon-btn btn-danger" onClick={() => deleteIncident(wi, ii)} title="Delete">✕</button>
        </div>
      </div>

      <div className="row">
        <label className="row" style={{ gap: 6 }}>
          spawnChance
          <input
            type="range" className="slider"
            min={0} max={1} step={0.01}
            value={spawnChance}
            onChange={e => updateIncident(wi, ii, { spawnChance: Number(e.target.value) })}
          />
          <input
            type="number" step={0.01}
            value={spawnChance}
            onChange={e => updateIncident(wi, ii, { spawnChance: Number(e.target.value || 0) })}
            style={{ width: 90 }}
          />
        </label>

        <label className="row" style={{ gap: 6 }}>
          script
          <input
            type="text"
            placeholder="CursedCargoIncident"
            value={script}
            onChange={e => updateIncident(wi, ii, { script: e.target.value })}
            style={{ minWidth: 220 }}
          />
        </label>

        <label className="row" style={{ gap: 6 }}>
          delaySeconds
          <input
            type="number"
            value={delaySeconds ?? ''}
            onChange={e => {
              const v = e.target.value.trim();
              updateIncident(wi, ii, { delaySeconds: v === '' ? undefined : Number(v) });
            }}
            style={{ width: 120 }}
          />
        </label>
      </div>

      <div className="col" style={{ gap: 6 }}>
        <label>options (JSON)</label>
        <textarea
          className="code"
          placeholder='{"tier": 1}'
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={onBlurParse}
        />
      </div>
    </div>
  );
}

export default function IncidentsCard() {
  const { doc, selectedWaveIdx, addIncident } = useStore();
  const w = selectedWaveIdx != null ? doc.waves[selectedWaveIdx] : null;
  const wi = selectedWaveIdx ?? -1;

  if (!w) return null;

  const incidents = w.incidents ?? [];

  return (
    <div className="card">
      <div className="card-header">
        <h3>Incidents</h3>
        <div className="row"><button onClick={() => addIncident(wi)}>+ Incident</button></div>
      </div>

      {/* Scrollable list */}
      <div className="card-scroll">
        {incidents.length === 0 && <div className="muted small">No incidents. Use “+ Incident”.</div>}

        <div className="col" style={{ gap: 10 }}>
          {incidents.map((inc, ii) => (
            <IncidentRow
              key={ii}
              wi={wi}
              ii={ii}
              spawnChance={inc.spawnChance}
              script={inc.script}
              delaySeconds={inc.delaySeconds}
              options={inc.options}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
