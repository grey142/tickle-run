/** Data-driven obstacle registry */

import type { HazardKind } from '../game/types';

export interface ObstacleDef {
  id: HazardKind;
  name: string;
  description: string;
  color: number;
  /** Required avoid action */
  avoid: 'jump' | 'slide' | 'strafe' | 'none';
  /** Allowed on waterslide segments */
  onSlide: boolean;
  width: number;
  height: number;
  depth: number;
}

export const OBSTACLES: Record<HazardKind, ObstacleDef> = {
  log: {
    id: 'log',
    name: 'Log',
    description: 'Low log — slide under.',
    color: 0x8b5a2b,
    avoid: 'slide',
    onSlide: false,
    width: 1.8,
    height: 0.55,
    depth: 0.6,
  },
  vines: {
    id: 'vines',
    name: 'Vines',
    description: 'Hanging vines — jump over.',
    color: 0x2d6a4f,
    avoid: 'jump',
    onSlide: false,
    width: 1.6,
    height: 1.4,
    depth: 0.4,
  },
  laneWall: {
    id: 'laneWall',
    name: 'Lane Wall',
    description: 'Blocks one lane — strafe around.',
    color: 0x6c757d,
    avoid: 'strafe',
    onSlide: false,
    width: 2.0,
    height: 1.8,
    depth: 0.5,
  },
  tree: {
    id: 'tree',
    name: 'Cave Tree',
    description: 'Sturdy trunk blocking a lane.',
    color: 0x52796f,
    avoid: 'strafe',
    onSlide: false,
    width: 1.2,
    height: 2.2,
    depth: 1.0,
  },
  slideRock: {
    id: 'slideRock',
    name: 'Waterslide Rock',
    description: 'Rock on the slide — strafe only (no jump).',
    color: 0xadb5bd,
    avoid: 'strafe',
    onSlide: true,
    width: 1.4,
    height: 0.9,
    depth: 0.8,
  },
  slideBranch: {
    id: 'slideBranch',
    name: 'Slide Branch',
    description: 'Branch across the slide — duck/strafe.',
    color: 0x774936,
    avoid: 'slide',
    onSlide: true,
    width: 2.0,
    height: 0.45,
    depth: 0.4,
  },
};

export const OBSTACLE_LIST = Object.values(OBSTACLES);
