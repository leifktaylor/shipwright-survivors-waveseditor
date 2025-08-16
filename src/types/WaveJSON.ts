export type AffixId = string;
export type BehaviorId = string;

export interface ShipAffixes {
  thrustPowerMulti?: number;
  turnPowerMulti?: number;
  fireRateMulti?: number;
  projectileSpeedMulti?: number;
  projectileLifetimeMulti?: number;
  blockDurabilityMulti?: number;
  blockDropRateMulti?: number;
}

export interface BehaviorJSON {
  preset: string;
  params?: Record<string, any>;
}

export interface WaveShipEntryJSON {
  shipId: string;
  count: number;
  hunter?: boolean;      // default: true
  noClip?: boolean;
  onAllDefeated?: string;

  affixesRef?: AffixId;
  affixes?: ShipAffixes;

  behaviorRef?: BehaviorId;
  behavior?: BehaviorJSON;
}

export interface WaveIncidentEntryJSON {
  spawnChance: number;   // 0..1
  script: string;
  options?: Record<string, any>;
  label?: string;
  delaySeconds?: number;
}

export type FormationLayout = { x: number; y: number }[];

export interface FormationShipSpecJSON {
  shipId: string;
  hunter?: boolean;
  behavior?: BehaviorJSON;
  offset?: { x: number; y: number };
  affixes?: ShipAffixes;
}

export interface ShipFormationEntryJSON {
  formationId: string;
  layout: FormationLayout;
  leader: FormationShipSpecJSON;
  followers: FormationShipSpecJSON[];
  count?: number;
  leaderIsHunter?: boolean;
  unCullable?: boolean;
}

export interface WaveJSON {
  mods: string[];
  ships: WaveShipEntryJSON[];
  incidents?: WaveIncidentEntryJSON[];
  formations?: ShipFormationEntryJSON[];
  music?: string;
  lightingSettings?: { clearColor?: [number, number, number, number] };

  duration?: number | 'Infinity';

  spawnDistribution?: 'at'|'random'|'outer'|'inner'|'aroundPlayer'|'aroundPlayerNear'|'center';
  atCoords?: { x: number; y: number; spreadRadius?: number };
  isBoss?: boolean;

  sustainMode?: boolean;

  spawnDelay?: number;
}

export interface WavesFileJSON {
  version: 1;
  affixes?: Record<AffixId, ShipAffixes>;
  behaviors?: Record<BehaviorId, BehaviorJSON>;
  waves: WaveJSON[];
}

export interface WavesDoc {
  version: 1;
  affixes: Record<AffixId, ShipAffixes>;
  behaviors: Record<BehaviorId, BehaviorJSON>;
  waves: WaveJSON[];
}