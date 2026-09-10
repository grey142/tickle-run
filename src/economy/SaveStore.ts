import type { EquipmentState, SaveData } from '../game/types';
import {
  SHIELD_COOLDOWN,
  MAGNET_COOLDOWN,
  BOOST_COOLDOWN,
} from '../game/types';

const KEY = 'tickle-run-save-v1';

export function defaultEquipment(): EquipmentState {
  return {
    shield: { owned: false, ready: false, cooldownLeft: 0 },
    magnet: { owned: false, ready: false, cooldownLeft: 0, activeLeft: 0 },
    boost: { owned: false, ready: false, cooldownLeft: 0, activeLeft: 0 },
  };
}

export function defaultSave(): SaveData {
  return {
    gems: 0,
    equipment: defaultEquipment(),
    unlockedAdventurers: ['scout'],
    selectedAdventurer: 'scout',
    hasEscapeGem: false,
    highScore: 0,
    totalDistance: 0,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      equipment: {
        ...base.equipment,
        ...(parsed.equipment ?? {}),
        shield: { ...base.equipment.shield, ...(parsed.equipment?.shield ?? {}) },
        magnet: { ...base.equipment.magnet, ...(parsed.equipment?.magnet ?? {}) },
        boost: { ...base.equipment.boost, ...(parsed.equipment?.boost ?? {}) },
      },
      unlockedAdventurers: parsed.unlockedAdventurers?.length
        ? parsed.unlockedAdventurers
        : base.unlockedAdventurers,
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const STORE_PRICES = {
  shield: 40,
  magnet: 55,
  boost: 70,
  escapeGem: 100,
} as const;

export const EQUIP_COOLDOWNS = {
  shield: SHIELD_COOLDOWN,
  magnet: MAGNET_COOLDOWN,
  boost: BOOST_COOLDOWN,
} as const;
