import { useState } from 'react';
import { useStore } from '@/state/store';

function summarizeShips(ships: { shipId: string; count: number }[]) {
  if (!ships?.length) return '—';
  return ships.map(s => `${s.shipId}×${s.count}`).join(', ');
}

export default function Sidebar() {
  const { doc, selectedWaveIdx, selectWave, addWave, deleteWave, reorderWaves } = useStore();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragFrom(idx);
    e.dataTransfer.setData('text/plain', String(idx)); // fallback
    e.dataTransfer.effectAllowed = 'move';
    // Optional: custom drag image can be set here.
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    if (overIdx !== idx) setOverIdx(idx);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragFrom ?? Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(from)) reorderWaves(from, idx);
    setDragFrom(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => { setDragFrom(null); setOverIdx(null); };

  return (
    <>
      <div className="row">
        <button onClick={addWave}>+ Wave</button>
      </div>
      <div className="wave-list">
        {doc.waves.map((w, i) => {
          const selected = selectedWaveIdx === i;
          const isOver = overIdx === i && dragFrom !== null && dragFrom !== i;
          return (
            <div
              key={i}
              className={`wave-item ${selected ? 'selected' : ''} ${isOver ? 'drop-target' : ''}`}
              onClick={() => selectWave(i)}
              onDragOver={handleDragOver(i)}
              onDrop={handleDrop(i)}
            >
              {/* Drag handle is the only draggable element to avoid accidental drags */}
              <div
                className="drag"
                title="Drag to reorder"
                draggable
                onDragStart={handleDragStart(i)}
                onDragEnd={handleDragEnd}
                aria-grabbed={dragFrom === i}
              >
                ⋮
              </div>

              <div>
                <div className="title">Wave #{i + 1}</div>
                <div className="meta">
                  <span>duration: {w.duration === 'Infinity' ? '∞' : (w.duration ?? '—')}</span>
                  <span>ships: {summarizeShips(w.ships)}</span>
                  <span>incidents: {(w.incidents?.length ?? 0)}</span>
                </div>
              </div>

              <button
                className="icon-btn btn-danger"
                title="Delete wave"
                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this wave?')) deleteWave(i); }}
              >✕</button>
            </div>
          );
        })}
      </div>
    </>
  );
}
