// src/editor/IncidentsCard.tsx
import { useMemo } from 'react';
import { useStore } from '@/state/store';
import type { WaveIncidentEntryJSON } from '@/types/WaveJSON';
import { INCIDENT_PRESETS } from '@/modals/presets';

function percent(n: number) { return `${Math.round((n ?? 0) * 100)}%`; }

function summarizeOptions(o?: Record<string, any>): string {
  if (!o) return '—';
  if (o.maxDuration || Array.isArray(o.tiers))
    return `maxDuration=${o.maxDuration ?? '—'}; tiers=${Array.isArray(o.tiers) ? o.tiers.length : 0}`;
  if (Array.isArray(o.ships))
    return `ships=${o.ships.length}; rewardTier=${o.rewardBlockTier ?? '—'}`;
  return Object.keys(o).slice(0, 4).join(', ') || '—';
}

function IncidentRow({
  wi, ii, inc, onEdit, onDuplicate, onDelete, onDragStart, onDragOver, onDrop,
}: {
  wi: number; ii: number; inc: WaveIncidentEntryJSON;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div className="inc-grid-row" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="handle" title="Drag to reorder" draggable onDragStart={onDragStart}>⋮</div>
      <div className="right">{percent(inc.spawnChance)}</div>
      <div className="ellipsis" title={inc.script}>{inc.script}</div>
      <div className="ellipsis" title={inc.label || '—'}>{inc.label || '—'}</div>
      <div className="right">{inc.delaySeconds ?? '—'}</div>
      <div className="ellipsis" title={summarizeOptions(inc.options)}>{summarizeOptions(inc.options)}</div>
      <div className="ship-actions">
        <button className="btn-ghost icon-btn" title="Edit" aria-label="Edit" onClick={onEdit}>✎</button>
      </div>
      <div className="ship-actions">
        <button className="btn-ghost icon-btn" title="Duplicate" aria-label="Duplicate" onClick={onDuplicate}>⧉</button>
      </div>
      <div className="ship-actions">
        <button className="icon-btn btn-danger" title="Delete" aria-label="Delete" onClick={onDelete}>✕</button>
      </div>
    </div>
  );
}

export default function IncidentsCard() {
  const {
    doc, selectedWaveIdx, addIncident, updateIncident, deleteIncident, duplicateIncident, reorderIncidents, openIncidentsModal
  } = useStore();
  const w = selectedWaveIdx != null ? doc.waves[selectedWaveIdx] : null;
  const wi = selectedWaveIdx ?? -1;

  const incidents = w?.incidents ?? [];

  const quickAddKeys = useMemo(() => Object.keys(INCIDENT_PRESETS).slice(0, 4), []);

  if (!w) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Incidents</h3>
        <div className="row">
          {/* Quick add from presets */}
          <div className="chips">
            {quickAddKeys.map(k => (
              <button
                key={k}
                className="chip"
                title={`Add ${k}`}
                onClick={() => {
                  const preset = INCIDENT_PRESETS[k];
                  const idx = (w.incidents?.length ?? 0);
                  addIncident(wi);
                  updateIncident(wi, idx, preset);
                }}
              >
                + {k}
              </button>
            ))}
          </div>

          <button onClick={() => addIncident(wi)}>+ Blank</button>
          <button className="btn-ghost" onClick={() => openIncidentsModal(wi, null)}>Open Editor…</button>
        </div>
      </div>

      {/* Column headers align to rows below */}
      <div className="inc-grid-header">
        <div className="ship-col--center">Reorder</div>
        <div className="right">Chance</div>
        <div>Script</div>
        <div>Label</div>
        <div className="right">Delay</div>
        <div>Options Summary</div>
        <div className="right">Edit</div>
        <div className="right">Dup</div>
        <div className="right">Del</div>
      </div>

      {/* Scrollable list */}
      <div className="card-scroll">
        {incidents.length === 0 && <div className="muted small">No incidents. Use “+ Blank” or a preset chip.</div>}

        <div className="col" style={{ gap: 10 }}>
          {incidents.map((inc, ii) => {
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
              <IncidentRow
                key={ii}
                wi={wi}
                ii={ii}
                inc={inc}
                onEdit={() => openIncidentsModal(wi, ii)}
                onDuplicate={() => duplicateIncident(wi, ii)}
                onDelete={() => deleteIncident(wi, ii)}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
