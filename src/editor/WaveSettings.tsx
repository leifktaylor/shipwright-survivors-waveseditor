// src/editor/WaveSettings.tsx

import { useStore } from '@/state/store';
import type { WaveJSON } from '@/types/WaveJSON';
import { useMemo } from 'react';

const DISTROS: NonNullable<WaveJSON['spawnDistribution']>[] = [
  'aroundPlayer','aroundPlayerNear','random','outer','inner','center','at'
];

export default function WaveSettings() {
  const {
    doc, selectedWaveIdx,
    setWaveSustain, setWaveDuration, setWaveSpawnDistribution, setWaveAtCoords,
    setWaveSpawnDelay, setWaveIsBoss,
  } = useStore();

  const w = selectedWaveIdx != null ? doc.waves[selectedWaveIdx] : null;
  const idx = selectedWaveIdx ?? -1;

  const isAt = w?.spawnDistribution === 'at';

  const durDisplay = useMemo(() => {
    if (!w) return '';
    if (w.duration === 'Infinity') return '';
    return w.duration ?? '';
  }, [w]);

  if (!w) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Wave Settings</h3>
      </div>

      <div className="row">
        <label className="row" style={{ gap: 6 }}>
          <input
            type="checkbox"
            checked={w.sustainMode ?? true}
            onChange={e => setWaveSustain(idx, e.target.checked)}
          />
          Sustain mode
        </label>

        <div className="row" style={{ gap: 6 }}>
          <label>Duration (s)</label>
          <input
            type="number"
            value={durDisplay as any}
            placeholder="unset"
            onChange={e => {
              const val = e.target.value.trim();
              if (val === '') setWaveDuration(idx, undefined);
              else setWaveDuration(idx, Number(val));
            }}
          />
          <button
            className="btn-ghost"
            title='Toggle "Infinity"'
            onClick={() => setWaveDuration(idx, w.duration === 'Infinity' ? undefined : 'Infinity')}
          >
            {w.duration === 'Infinity' ? 'Clear ∞' : 'Set ∞'}
          </button>
        </div>

        <div className="row" style={{ gap: 6 }}>
          <label>Spawn</label>
          <select
            value={w.spawnDistribution ?? 'aroundPlayer'}
            onChange={e => setWaveSpawnDistribution(idx, e.target.value as any)}
          >
            {DISTROS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="row" style={{ gap: 6 }}>
          <label>Spawn Delay (s)</label>
          <input
            type="number"
            placeholder="(engine default 2)"
            value={w.spawnDelay ?? ''}
            onChange={e => {
              const v = e.target.value.trim();
              setWaveSpawnDelay(idx, v === '' ? undefined : Number(v));
            }}
          />
        </div>

        <div className="row" style={{ gap: 6 }}>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={!!w.isBoss}
              onChange={e => setWaveIsBoss(idx, e.target.checked || undefined)}
            />
            Boss wave
          </label>
        </div>
      </div>

      {isAt && (
        <div className="row">
          <div className="row" style={{ gap: 6 }}>
            <label>x</label>
            <input
              type="number"
              value={w.atCoords?.x ?? ''}
              onChange={e => {
                const x = e.target.value === '' ? undefined : Number(e.target.value);
                setWaveAtCoords(idx, { x: x ?? 0, y: w.atCoords?.y ?? 0, spreadRadius: w.atCoords?.spreadRadius });
              }}
            />
          </div>
          <div className="row" style={{ gap: 6 }}>
            <label>y</label>
            <input
              type="number"
              value={w.atCoords?.y ?? ''}
              onChange={e => {
                const y = e.target.value === '' ? undefined : Number(e.target.value);
                setWaveAtCoords(idx, { x: w.atCoords?.x ?? 0, y: y ?? 0, spreadRadius: w.atCoords?.spreadRadius });
              }}
            />
          </div>
          <div className="row" style={{ gap: 6 }}>
            <label>spreadRadius</label>
            <input
              type="number"
              value={w.atCoords?.spreadRadius ?? ''}
              onChange={e => {
                const r = e.target.value === '' ? undefined : Number(e.target.value);
                setWaveAtCoords(idx, { x: w.atCoords?.x ?? 0, y: w.atCoords?.y ?? 0, spreadRadius: r });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
