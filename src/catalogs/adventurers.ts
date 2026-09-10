/** Data-driven adventurer registry — scaffold for unlocks */

export interface AdventurerDef {
  id: string;
  name: string;
  description: string;
  unlockCost: number;
  colors: {
    skin: number;
    shirt: number;
    pants: number;
    shoes: number;
    hair: number;
  };
  /** Slight speed bonus multiplier (1 = default) */
  speedBonus: number;
}

export const ADVENTURERS: AdventurerDef[] = [
  {
    id: 'scout',
    name: 'River Scout',
    description: 'Default runner. Balanced and brave.',
    unlockCost: 0,
    colors: { skin: 0xf1c27d, shirt: 0x3d8bfd, pants: 0x2e5a1c, shoes: 0x5c4033, hair: 0x3b2f2f },
    speedBonus: 1,
  },
  {
    id: 'acrobat',
    name: 'Cave Acrobat',
    description: 'Slightly faster jumps. Unlock in store.',
    unlockCost: 80,
    colors: { skin: 0xe0ac69, shirt: 0xe85d04, pants: 0x370617, shoes: 0x222222, hair: 0x1a1a2e },
    speedBonus: 1.04,
  },
  {
    id: 'miner',
    name: 'Gem Miner',
    description: 'Attracts nearby gems a little farther.',
    unlockCost: 150,
    colors: { skin: 0xc68642, shirt: 0xffc300, pants: 0x4a4e69, shoes: 0x22223b, hair: 0x4a3728 },
    speedBonus: 1,
  },
  {
    id: 'trickster',
    name: 'Tickle Trickster',
    description: 'Starts with one free shield charge per run (cosmetic unlock).',
    unlockCost: 250,
    colors: { skin: 0xffdbac, shirt: 0x9b5de5, pants: 0x00bbf9, shoes: 0xf15bb5, hair: 0xfee440 },
    speedBonus: 1.02,
  },
];

export function getAdventurer(id: string): AdventurerDef {
  return ADVENTURERS.find((a) => a.id === id) ?? ADVENTURERS[0];
}
