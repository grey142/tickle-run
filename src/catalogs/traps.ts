/** Data-driven trap registry */

import type { TrapKind } from '../game/types';

export interface TrapDef {
  id: TrapKind;
  name: string;
  description: string;
  color: number;
  height: number;
  /** Lateral footprint */
  footprint: number;
  /** Depth along the run (Z) — longer = harder to jump clear */
  depth: number;
  /** Floor-based trap (jumpable); hit height is reduced 75% */
  ground: boolean;
  /** Falling in ends the run immediately */
  instantGameOver: boolean;
  /** How long the cinematic overlay plays (seconds) */
  cinematicSeconds: number;
}

const HALF_BLOCK = 1.1;

export const TRAPS: Record<TrapKind, TrapDef> = {
  featherTrap: {
    id: 'featherTrap',
    name: 'Feather Trap',
    description: 'A swirl of giant cartoon feathers pops up from the floor.',
    color: 0xff6b6b,
    height: 1.2,
    footprint: HALF_BLOCK,
    depth: 0.7,
    ground: true,
    instantGameOver: false,
    cinematicSeconds: 2.2,
  },
  ticklePit: {
    id: 'ticklePit',
    name: 'Tickle Pit',
    description: 'Soft mossy pit that giggles when you fall in.',
    color: 0x95d5b2,
    height: 0.4,
    footprint: HALF_BLOCK,
    depth: 0.7,
    ground: true,
    instantGameOver: false,
    cinematicSeconds: 2.4,
  },
  giggleGas: {
    id: 'giggleGas',
    name: 'Giggle Gas',
    description: 'Purple puff of silly gas that makes you laugh.',
    color: 0xc77dff,
    height: 1.6,
    footprint: HALF_BLOCK,
    depth: 0.7,
    ground: false,
    instantGameOver: false,
    cinematicSeconds: 2.0,
  },
  stickyMoss: {
    id: 'stickyMoss',
    name: 'Sticky Moss',
    description: 'Glowing moss that holds you for a tickle ambush.',
    color: 0x52b788,
    height: 0.5,
    footprint: HALF_BLOCK,
    depth: 0.7,
    ground: true,
    instantGameOver: false,
    cinematicSeconds: 2.1,
  },
  blackPit: {
    id: 'blackPit',
    name: 'Black Pit',
    description: 'A long void in the floor — fall through to an endless tickle pit. Instant game over.',
    color: 0x050508,
    height: 0.2,
    footprint: HALF_BLOCK * 1.15,
    depth: 3.2, // much longer — hard to jump over
    ground: true,
    instantGameOver: true,
    cinematicSeconds: 2.8,
  },
};

export const TRAP_LIST = Object.values(TRAPS);
