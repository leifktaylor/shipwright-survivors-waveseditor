// src/App.tsx
import { useEffect } from 'react';
import NavBar from '@/nav/NavBar';
import Sidebar from '@/sidebar/Sidebar';
import WaveEditor from '@/editor/WaveEditor';
import { useStore } from '@/state/store';
import AffixesModal from '@/modals/AffixesModal';
import BehaviorsModal from '@/modals/BehaviorsModal';
import { preloadPreviewAssets } from './preview/shipPreview';
import ShipPickerModal from '@/modals/ShipPickerModal';
import IncidentsModal from '@/modals/IncidentsModal';


export default function App() {
  useEffect(() => { preloadPreviewAssets(); }, []);
  const { showAffixesModal, showBehaviorsModal, closeAffixesModal, closeBehaviorsModal, showIncidentsModal, closeIncidentsModal } = useStore();

  return (
    <div className="app-shell">
      <div className="header">
        <h1 className="title">Shipwright Survivors — Wave Editor</h1>
        <div className="spacer" />
        <NavBar />
      </div>

      <div className="main">
        <div className="sidebar panel">
          <div className="toolbar">
            {/* + Wave lives in Sidebar per spec */}
            <span className="muted tiny">Waves</span>
          </div>
          <Sidebar />
        </div>

        <div className="editor">
          <WaveEditor />
        </div>
      </div>

      {showAffixesModal && (
        <div className="modal-backdrop" onClick={closeAffixesModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <AffixesModal onClose={closeAffixesModal} />
          </div>
        </div>
      )}

      {showBehaviorsModal && (
        <div className="modal-backdrop" onClick={closeBehaviorsModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <BehaviorsModal onClose={closeBehaviorsModal} />
          </div>
        </div>
      )}

      {showIncidentsModal && (
        <div className="modal-backdrop" onClick={closeIncidentsModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <IncidentsModal onClose={closeIncidentsModal} />
          </div>
        </div>
      )}

      {/* Mount once; it renders itself only when showShipPicker is true */}
      <ShipPickerModal />
    </div>
  );
}
