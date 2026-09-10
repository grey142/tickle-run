/** Data-driven obstacle registry */

import type { HazardKind } from '../game/types';

/** One track block ≈ LANE_WIDTH (2.2). Hazards occupy only the first half. */
const HALF_BLOCK = 1.1;

export interface ObstacleDef {
  id: HazardKind;
  name: string;
  description: string;
  color: number;
  /** Required avoid action — every obstacle is jump or slide */
  avoid: 'jump' | 'slide';
  /** Allowed on waterslide segments */
  onSlide: boolean;
  width: number;
  height: number;
  depth: number;
  /** Bottom of collider above floor (high barriers leave a slide gap) */
  clearance: number;
}

export const OBSTACLES: Record<HazardKind, ObstacleDef> = {
  log: {
    id: 'log',
    name: 'Log',
    description: 'Low fallen log — jump over.',
    color: 0x8b5a2b,
    avoid: 'jump',
    onSlide: false,
    width: HALF_BLOCK,
    height: 0.5,
    depth: 0.35,
    clearance: 0,
  },
  vines: {
    id: 'vines',
    name: 'Vines',
    description: 'Ground vines — jump over.',
    color: 0x2d6a4f,
    avoid: 'jump',
    onSlide: false,
    width: HALF_BLOCK * 0.9,
    height: 0.5,
    depth: 0.3,
    clearance: 0,
  },
  laneWall: {
    id: 'laneWall',
    name: 'Low Barrier',
    description: 'Low stone barrier — jump over.',
    color: 0x6c757d,
    avoid: 'jump',
    onSlide: false,
    width: HALF_BLOCK,
    height: 0.5,
    depth: 0.35,
    clearance: 0,
  },
  tree: {
    id: 'tree',
    name: 'Stump',
    description: 'Low cave stump — jump over.',
    color: 0x52796f,
    avoid: 'jump',
    onSlide: false,
    width: HALF_BLOCK * 0.75,
    height: 0.5,
    depth: 0.4,
    clearance: 0,
  },
  slideRock: {
    id: 'slideRock',
    name: 'Waterslide Overhang',
    description: 'Rock overhang on the slide — slide under.',
    color: 0xadb5bd,
    avoid: 'slide',
    onSlide: true,
    width: HALF_BLOCK,
    height: 0.45,
    depth: 0.4,
    clearance: 0.85,
  },
  slideBranch: {
    id: 'slideBranch',
    name: 'Slide Branch',
    description: 'Branch across the full slide — slide under.',
    color: 0x774936,
    avoid: 'slide',
    onSlide: true,
    width: 6.2, // full 3-lane track
    height: 0.45,
    depth: 0.35,
    clearance: 0.85,
  },
};

export const OBSTACLE_LIST = Object.values(OBSTACLES);
