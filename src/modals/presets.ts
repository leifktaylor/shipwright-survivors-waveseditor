import type { ShipAffixes, BehaviorJSON, WaveIncidentEntryJSON } from '@/types/WaveJSON';

/** === Affix presets from your reference === */
export const AFFIX_PRESETS: Record<string, ShipAffixes> = {
  SPEED_DEMON_AFFIXES: { thrustPowerMulti: 2.4, turnPowerMulti: 2.4 },
  FAST_AFFIXES: { thrustPowerMulti: 1.8, turnPowerMulti: 1.8 },
  SUPER_FAST_AFFIXES: { thrustPowerMulti: 4.4, turnPowerMulti: 4.4 },
  SUPER_FAST_CRUISERS: {
    thrustPowerMulti: 6.4, turnPowerMulti: 2.8, fireRateMulti: 1.0, projectileSpeedMulti: 4.5,
  },
  GIANT_CRUISER_AFFIXES: {
    thrustPowerMulti: 1.0, turnPowerMulti: 0.25, fireRateMulti: 2.0,
    projectileSpeedMulti: 1.5, projectileLifetimeMulti: 2.0,
    blockDurabilityMulti: 1.2, blockDropRateMulti: 0.4,
  },
  GIANT_CRUISER_AFFIXES_2: {
    thrustPowerMulti: 3.0, turnPowerMulti: 0.85, fireRateMulti: 2.0,
    projectileSpeedMulti: 0.8, projectileLifetimeMulti: 4.0,
    blockDurabilityMulti: 1.0, blockDropRateMulti: 0.4,
  },
  FINAL_ASSAULT_AFFIXES: {
    thrustPowerMulti: 4.5, turnPowerMulti: 2.5, fireRateMulti: 2.0,
    projectileSpeedMulti: 2.5, projectileLifetimeMulti: 2.0,
    blockDurabilityMulti: 1.0, blockDropRateMulti: 0.4,
  },
  TIER2_AFFIXES: {
    thrustPowerMulti: 5.0, turnPowerMulti: 2.0, fireRateMulti: 2.0,
    projectileSpeedMulti: 1.5, blockDurabilityMulti: 1.2,
  },
  TIER2_AFFIXES_FIGHTER: {
    thrustPowerMulti: 4.5, turnPowerMulti: 2.0, fireRateMulti: 0.8,
    projectileSpeedMulti: 0.6, blockDurabilityMulti: 0.8,
  },
  TIER3_AFFIXES: {
    thrustPowerMulti: 2.0, turnPowerMulti: 2.0, fireRateMulti: 2.5,
    projectileSpeedMulti: 2.5, blockDurabilityMulti: 1.2,
  },
};

/** === Behavior presets: assume preset 'siege' with param trio === */
function siege(er: number, dr: number, sr: number): BehaviorJSON {
  return { preset: 'siege', params: { engagementRange: er, disengageRange: dr, siegeRange: sr } };
}

export const BEHAVIOR_PRESETS: Record<string, BehaviorJSON> = {
  GIANT_CRUISER_BEHAVIOR: siege(2500, 3200, 2500),
  GIANT_CRUISER_BEHAVIOR_2: siege(1900, 2500, 1900),
  SHORT_SIEGER_1: siege(1200, 1400, 1200),
  SHORT_SIEGER_2: siege(1400, 2000, 1400),
  SHORT_SIEGER_3: siege(1800, 2400, 1800),
  FINAL_ASSAULT_BEHAVIOR: siege(1500, 2000, 1500),
  FINAL_ASSAULT_BEHAVIOR_2: siege(1800, 2400, 1800),
  FINAL_ASSAULT_BEHAVIOR_3: siege(2100, 2800, 2100),
};

/** === Incident presets (editor seeds) ===
 * These are convenience templates, not persisted in WavesFileJSON.
 */
export const INCIDENT_PRESETS: Record<string, WaveIncidentEntryJSON> = {

  QUANTUM_BOOM: {
    spawnChance: 1.0,
    script: 'QuantumBoomIncident',
    label: 'Quantum Boom',
  },

  CURSED_CARGO_T1: {
    spawnChance: 1.0,
    script: 'CursedCargoIncident',
    label: 'Cursed Cargo (T1)',
    options: {
      rewardBlockTier: 1,
      rewardQuantityMultiplier: 1,
      ships: [
        { shipId: 'incidents/cursed_cargo/cursed_cargo_killer_00', count: 4 },
        { shipId: 'incidents/cursed_cargo/cursed_cargo_killer_01', count: 4 },
      ],
      cursedCacheShip: { shipId: 'incidents/cursed_cargo/cursed_cargo_00', count: 1 },
    },
  },

  CURSED_CARGO_T2: {
    spawnChance: 1.0,
    script: 'CursedCargoIncident',
    label: 'Cursed Cargo (T2)',
    options: {
      rewardBlockTier: 2,
      rewardQuantityMultiplier: 1,
      ships: [
        { shipId: 'incidents/cursed_cargo/cursed_cargo_killer_02', count: 4 },
        { shipId: 'incidents/cursed_cargo/cursed_cargo_killer_03', count: 4 },
      ],
      cursedCacheShip: { shipId: 'incidents/cursed_cargo/cursed_cargo_01', count: 1 },
    },
  },

  DIMENSIONAL_PORTAL_20S_A: {
    spawnChance: 1.0,
    script: 'DimensionalPortalIncident',
    label: 'Dimensional Portal (20s / wave_0 tiers)',
    options: {
      maxDuration: 20,
      tiers: [
        [{ shipId: 'wave_0_00', count: 4, hunter: true }],
        [{ shipId: 'wave_0_01', count: 4, hunter: true }],
        [{ shipId: 'wave_0_02', count: 4, hunter: true }],
        [{ shipId: 'wave_0_03', count: 4, hunter: true }],
        [{ shipId: 'wave_0_04', count: 4, hunter: true }],
        [{ shipId: 'ship_scrapper_4', count: 4, hunter: true }],
        [{ shipId: 'ship_scrapper_5', count: 4, hunter: true }],
        [{ shipId: 'ship_scrapper_6', count: 4, hunter: true }],
      ],
    },
  },

  DIMENSIONAL_PORTAL_20S_B: {
    spawnChance: 1.0,
    script: 'DimensionalPortalIncident',
    label: 'Dimensional Portal (20s / scrapper tiers)',
    options: {
      maxDuration: 20,
      tiers: [
        [{ shipId: 'ship_scrapper_2', count: 6 }],
        [{ shipId: 'ship_scrapper_3', count: 6 }],
        [{ shipId: 'ship_scrapper_4', count: 6, hunter: true }],
        [{ shipId: 'mission_02/tier2_fighter_00', count: 6, hunter: true }],
        [{ shipId: 'mission_02/tier2_fighter_00', count: 6, hunter: true }],
        [{ shipId: 'mission_02/tier2_cruiser_00', count: 6, hunter: true }],
        [{ shipId: 'mission_02/tier2_cruiser_00', count: 6, hunter: true }],
        [{ shipId: 'mission_02/tier2_cruiser_01', count: 6, hunter: true }],
      ],
    },
  },
};