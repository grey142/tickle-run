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
  /** Jump and slide never clear — must change lanes */
  mustAvoid: boolean;
  /** Falling in ends the run immediately */
  instantGameOver: boolean;
  /** How long the cinematic overlay plays (seconds) */
  cinematicSeconds: number;
}

const HALF_BLOCK = 1.1;

export const TRAPS: Record<TrapKind, TrapDef> = {
  floorSlime: {
    id: 'floorSlime',
    name: 'Floor Slime Tickler',
    description:
      'A small blue slime creature that sticks to the player, trips them to the floor, and uses slime tentacles to tickle them all over.',
    color: 0x4cc9f0,
    height: 0.55,
    footprint: HALF_BLOCK,
    depth: 0.85,
    ground: true,
    mustAvoid: false,
    instantGameOver: false,
    cinematicSeconds: 2.3,
  },
  handSwarm: {
    id: 'handSwarm',
    name: 'Floating Hands Tickle Swarm',
    description:
      'About 25 floating hands — white skin with long red pointy fingernails, no wrists. They fly around; run through the swarm and they grab you, hold you up, and tickle you all over.',
    color: 0xffe5d0,
    height: 1.8,
    footprint: HALF_BLOCK * 1.2,
    depth: 1.4,
    ground: false,
    mustAvoid: true, // swarm fills the air — jump/slide won't clear
    instantGameOver: false,
    cinematicSeconds: 2.5,
  },
  vineTrap: {
    id: 'vineTrap',
    name: 'Vine Tickle Trap',
    description:
      'A mess of thin but strong vines on the ground. Step on them and they tangle, trip, and pin you down, wiggling ticklish vine tips all over.',
    color: 0x2d6a4f,
    height: 0.45,
    footprint: HALF_BLOCK,
    depth: 0.9,
    ground: true,
    mustAvoid: false,
    instantGameOver: false,
    cinematicSeconds: 2.3,
  },
  shade: {
    id: 'shade',
    name: 'Shade',
    description:
      "A black shadow monster. Cannot be jumped over or slid under — must be avoided. Catch you and shadowy tendrils with three-finger hands tickle your whole body.",
    color: 0x0d0d12,
    height: 2.0,
    footprint: HALF_BLOCK * 1.05,
    depth: 0.9,
    ground: false,
    mustAvoid: true,
    instantGameOver: false,
    cinematicSeconds: 2.6,
  },
  blackPit: {
    id: 'blackPit',
    name: 'Black Pit',
    description:
      'A long void in the floor — fall through to an endless tickle pit. Instant game over.',
    color: 0x050508,
    height: 0.04,
    footprint: HALF_BLOCK * 1.15,
    depth: 3.2,
    ground: true,
    mustAvoid: false,
    instantGameOver: true,
    cinematicSeconds: 2.8,
  },
};

export const TRAP_LIST = Object.values(TRAPS);
