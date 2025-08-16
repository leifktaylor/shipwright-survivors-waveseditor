// src/editor/WaveEditor.tsx

import { useStore } from '@/state/store';
import WaveSettings from './WaveSettings';
import ShipsCard from './ShipsCard';
import IncidentsCard from './IncidentsCard';

export default function WaveEditor() {
  const { selectedWaveIdx, doc } = useStore();
  const w = selectedWaveIdx != null ? doc.waves[selectedWaveIdx] : null;

  if (!w) {
    return (
      <div className="panel">
        <h2>No wave selected</h2>
        <div className="muted">Create a wave with “+ Wave”, then select it to edit.</div>
      </div>
    );
  }

  return (
    <div className="cards">
      <WaveSettings />
      <ShipsCard />
      <IncidentsCard />
    </div>
  );
}
