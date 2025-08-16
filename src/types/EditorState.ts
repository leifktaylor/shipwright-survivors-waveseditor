import type { WavesDoc } from './WaveJSON';

export interface EditorState {
  doc: WavesDoc;                 // canonical (never undefined registries)
  selectedWaveIdx: number | null;
  dirty: boolean;
}

type ShipPickerTarget = { wi: number; si: number } | null;

export interface UIState {
  showAffixesModal: boolean;
  showBehaviorsModal: boolean;
  showShipPicker: boolean;
  shipPickerTarget: ShipPickerTarget;
}
