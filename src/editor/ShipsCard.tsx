// src/editor/ShipsCard.tsx

import { useMemo, useState } from 'react';
import { useStore } from '@/state/store';
import type { WaveShipEntryJSON } from '@/types/WaveJSON';
import ShipIcon from '@/preview/ShipIcon';

const ICON_SIZE = 72; // ~50% larger preview

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
    <div className="row" style={{ gap: 10, alignItems: 'center' }} onDragOver={onDragOver} onDrop={onDrop}>
      {/* Ship preview icon (click to choose) */}
      {row.shipId ? (
        <div onClick={openPicker} style={{ cursor: 'pointer' }} title={`Change ship (${row.shipId})`}>
          <ShipIcon shipId={row.shipId} size={ICON_SIZE} title={row.shipId} />
        </div>
      ) : (
        <div
          className="ship-icon placeholder"
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
          title="Choose ship…"
          style={{
            width: ICON_SIZE, height: ICON_SIZE, display: 'grid', placeItems: 'center',
            border: '1px dashed #25314a', borderRadius: 8, color: '#b9c4d6', cursor: 'pointer',
            background: '#0f1420',
          }}
        >
          ?
        </div>
      )}

      <div
        className="handle"
        title="Drag to reorder"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{ fontSize: 18, lineHeight: 1 }}
      >
        ⋮
      </div>

      {/* Non-editable ship pill; opens ship picker */}
      <button
        className="chip"
        onClick={openPicker}
        title={row.shipId ? row.shipId : 'Choose ship…'}
        aria-label="Choose ship"
      >
        {row.shipId || 'Choose ship…'}
      </button>

      <label className="row" style={{ gap: 6 }}>
        count
        <input
          type="number"
          value={row.count}
          onChange={e => updateShip(wi, si, { count: Math.max(1, Number(e.target.value || 1)) })}
          style={{ width: 80 }}
        />
      </label>

      <label className="row" style={{ gap: 6 }}>
        <input
          type="checkbox"
          checked={row.hunter ?? true}
          onChange={e => updateShip(wi, si, { hunter: e.target.checked })}
        />
        hunter
      </label>

      {/* Affix select + single manage button */}
      <div className="row" style={{ gap: 6 }}>
        <label>affix</label>
        <select
          value={row.affixesRef ?? ''}
          onChange={e => updateShip(wi, si, { affixesRef: e.target.value || undefined, affixes: undefined })}
          style={{ minWidth: 140 }}
        >
          <option value="">(none)</option>
          {affixKeys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button
          className="icon-btn btn-ghost"
          title="Open Affixes"
          aria-label="Open Affixes"
          onClick={openAffixesModal}
        >
          ⚙
        </button>
      </div>

      {/* Behavior select + single manage button */}
      <div className="row" style={{ gap: 6 }}>
        <label>behavior</label>
        <select
          value={row.behaviorRef ?? ''}
          onChange={e => updateShip(wi, si, { behaviorRef: e.target.value || undefined, behavior: undefined })}
          style={{ minWidth: 160 }}
        >
          <option value="">(none)</option>
          {behaviorKeys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button
          className="icon-btn btn-ghost"
          title="Open Behaviors"
          aria-label="Open Behaviors"
          onClick={openBehaviorsModal}
        >
          ⚙
        </button>
      </div>

      <div className="spacer" />

      <button className="btn-ghost" title="Duplicate" onClick={() => duplicateShip(wi, si)}>⧉</button>
      <button className="icon-btn btn-danger" title="Delete" onClick={() => deleteShip(wi, si)}>✕</button>
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

      {/* Scrollable list */}
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
