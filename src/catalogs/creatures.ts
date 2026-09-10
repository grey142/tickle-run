/** Data-driven creature / monster registry */

export interface CreatureDef {
  id: string;
  name: string;
  description: string;
  bodyColor: number;
  accentColor: number;
  scale: number;
}

export const CREATURES: CreatureDef[] = [
  {
    id: 'tickleMonster',
    name: 'Tickle Monster',
    description: 'The chase boss — big, goofy, and feathered.',
    bodyColor: 0x7b2cbf,
    accentColor: 0xffd166,
    scale: 0.75,
  },
  {
    id: 'giggleBat',
    name: 'Giggle Bat',
    description: 'Ambient cave critter (flavor).',
    bodyColor: 0x22223b,
    accentColor: 0xf72585,
    scale: 0.4,
  },
  {
    id: 'mossBlob',
    name: 'Moss Blob',
    description: 'Harmless blob that cheers when you pass.',
    bodyColor: 0x40916c,
    accentColor: 0x95d5b2,
    scale: 0.55,
  },
];

export function getCreature(id: string): CreatureDef {
  return CREATURES.find((c) => c.id === id) ?? CREATURES[0];
}
