// src/editor/ShipsCard.tsx

import { useMemo, useState } from 'react';
import { useStore } from '@/state/store';
import type { WaveShipEntryJSON } from '@/types/WaveJSON';
import ShipIcon from '@/preview/ShipIcon';

const ICON_SIZE = 72; // Preview canvas size (CSS var controls box)

function ShipRow({
  wi, si, row,
  affixKeys, behaviorKeys,
}: {
  wi: number; si: number; row: WaveShipEntryJSON;
  affixKeys: string[]; behaviorKeys: string[];
}) {
  const {
    updateShip, deleteShip, duplicateShip, reorderShips,
    openAffixesModal, openBehaviorsModal, openShipPicker,
  } = useStore();

  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent) => {
    setDragFrom(si);
    e.dataTransfer.setData('text/plain', String(si));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragFrom ?? Number(e.dataTransfer.getData('text/plain'));
    const to = si;
    if (!Number.isNaN(from) && from !== to) reorderShips(wi, from, to);
    setDragFrom(null);
  };
  const onDragEnd = () => setDragFrom(null);

  const openPicker = () => openShipPicker(wi, si);

  return (
    <div className="ship-grid-row" onDragOver={onDragOver} onDrop={onDrop}>
      {/* Preview */}
      {row.shipId ? (
        <div onClick={openPicker} style={{ cursor: 'pointer' }} title={`Change ship (${row.shipId})`}>
          <ShipIcon shipId={row.shipId} size={ICON_SIZE} title={row.shipId} />
        </div>
      ) : (
        <div
          className="ship-icon skeleton"
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
          title="Choose ship…"
          aria-label="Choose ship"
        />
      )}

      {/* Drag handle */}
      <div
        className="handle"
        title="Drag to reorder"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >⋮</div>

      {/* Ship id pill (opens picker) */}
      <button
        className="chip ship-chip ellipsis"
        onClick={openPicker}
        title={row.shipId ? row.shipId : 'Choose ship…'}
        aria-label="Choose ship"
      >
        {row.shipId || 'Choose ship…'}
      </button>

      {/* Count */}
      <input
        type="number"
        value={row.count}
        onChange={e => updateShip(wi, si, { count: Math.max(1, Number(e.target.value || 1)) })}
        style={{ width: 96 }}
        aria-label="Count"
        title="Count"
      />

      {/* Hunter (centered) */}
      <div className="ship-col--center">
        <input
          type="checkbox"
          checked={row.hunter ?? true}
          onChange={e => updateShip(wi, si, { hunter: e.target.checked })}
          title="Hunter"
          aria-label="Hunter"
        />
      </div>

      {/* Affix (select + gear) */}
      <div className="cell-gear">
        <select
          value={row.affixesRef ?? ''}
          onChange={e => updateShip(wi, si, { affixesRef: e.target.value || undefined, affixes: undefined })}
          title="Affix"
        >
          <option value="">(none)</option>
          {affixKeys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button
          className="icon-btn btn-ghost"
          title="Open Affixes"
          aria-label="Open Affixes"
          onClick={openAffixesModal}
        >⚙</button>
      </div>

      {/* Behavior (select + gear) */}
      <div className="cell-gear">
        <select
          value={row.behaviorRef ?? ''}
          onChange={e => updateShip(wi, si, { behaviorRef: e.target.value || undefined, behavior: undefined })}
          title="Behavior"
        >
          <option value="">(none)</option>
          {behaviorKeys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button
          className="icon-btn btn-ghost"
          title="Open Behaviors"
          aria-label="Open Behaviors"
          onClick={openBehaviorsModal}
        >⚙</button>
      </div>

      {/* Flexible spacer to consume slack */}
      <div />

      {/* Actions */}
      <div className="ship-actions">
        <button className="btn-ghost icon-btn" title="Duplicate" aria-label="Duplicate"
          onClick={() => duplicateShip(wi, si)}>⧉</button>
      </div>
      <div className="ship-actions">
        <button className="icon-btn btn-danger" title="Delete" aria-label="Delete"
          onClick={() => deleteShip(wi, si)}>✕</button>
      </div>
    </div>
  );
}

export default function ShipsCard() {
  const { doc, selectedWaveIdx, addShip } = useStore();
  const w = selectedWaveIdx != null ? doc.waves[selectedWaveIdx] : null;
  const wi = selectedWaveIdx ?? -1;

  const affixKeys = useMemo(() => Object.keys(doc.affixes ?? {}), [doc.affixes]);
  const behaviorKeys = useMemo(() => Object.keys(doc.behaviors ?? {}), [doc.behaviors]);

  if (!w) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Ships</h3>
        <div className="row">
          <button onClick={() => addShip(wi)}>+ Ship</button>
        </div>
      </div>

      {/* Column headers (stay above the scroll region for usability) */}
      <div className="ship-grid-header">
        <div>Preview</div>
        <div className="ship-col--center"></div>
        <div>Ship</div>
        <div>Count</div>
        <div className="ship-col--center">Hunter</div>
        <div>Affix</div>
        <div>Behavior</div>
        <div /> {/* spacer */}
        <div className="right">Actions</div>
        <div />
      </div>

      {/* Scrollable body */}
      <div className="card-scroll">
        <div className="col" style={{ gap: 10 }}>
          {w.ships.length === 0 && <div className="muted small">No ships yet. Use “+ Ship”.</div>}
          {w.ships.map((s, si) => (
            <ShipRow
              key={si}
              wi={wi}
              si={si}
              row={s}
              affixKeys={affixKeys}
              behaviorKeys={behaviorKeys}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
