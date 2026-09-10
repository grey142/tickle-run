/** Shared game types */

export type ClothingLevel = 0 | 1 | 2 | 3; // 0=none, 1=shoes, 2=pants+shoes, 3=shirt+pants+shoes

export type GameScreen = 'title' | 'playing' | 'paused' | 'cinematic' | 'gameover' | 'store';

export type HazardKind =
  | 'log'
  | 'vines'
  | 'laneWall'
  | 'tree'
  | 'slideRock'
  | 'slideBranch';

export type TrapKind = 'featherTrap' | 'ticklePit' | 'giggleGas' | 'stickyMoss';

export type PickupKind =
  | 'featherGem'
  | 'clothing'
  | 'megaClothing'
  | 'escapeGem'
  | 'megaGem';

export type EquipmentKind = 'shield' | 'magnet' | 'boost';

export type LaneCount = 1 | 2 | 3;

/** Vertical cave tier the track is on */
export type CaveLevel = 'upper' | 'middle' | 'lower';

/** Absolute floor Y for each cave level (middle ≈ 0) */
export const LEVEL_FLOOR_Y: Record<CaveLevel, number> = {
  upper: 2.4,
  middle: 0,
  lower: -2.0,
};

export const LEVEL_ORDER: CaveLevel[] = ['lower', 'middle', 'upper'];


export type SegmentType =
  | 'straight'
  | 'rampUp'
  | 'waterslide'
  | 'narrow2'
  | 'narrow1'
  | 'curveLeft'
  | 'curveRight';

export type PlayerAction = 'run' | 'jump' | 'slide' | 'strafe';

export type ChaseState = 'distant' | 'caughtUp' | 'catching';

export type CinematicKind =
  | 'trapTickle'
  | 'monsterCatch'
  | 'dualTickle'
  | 'fallOff'
  | 'gameOver'
  | 'escape'
  | 'revive';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface EquipmentState {
  shield: { owned: boolean; ready: boolean; cooldownLeft: number };
  magnet: { owned: boolean; ready: boolean; cooldownLeft: number; activeLeft: number };
  boost: { owned: boolean; ready: boolean; cooldownLeft: number; activeLeft: number };
}

export interface SaveData {
  gems: number;
  equipment: EquipmentState;
  unlockedAdventurers: string[];
  selectedAdventurer: string;
  hasEscapeGem: boolean;
  highScore: number;
  totalDistance: number;
}

export interface RunStats {
  score: number;
  distance: number;
  gemsCollected: number;
  clothingLost: number;
  trapsHit: number;
  obstaclesHit: number;
}

export const LANE_WIDTH = 2.2;
export const LANE_COUNT_DEFAULT = 3;
export const JUMP_DURATION = 0.20625; // 1.5× prior jump distance at 6× speed
export const SLIDE_DURATION = 0.275; // 2× prior slide distance at 6× speed
export const JUMP_HEIGHT = 2.0;
export const CAUGHT_UP_DURATION = 60;
export const COUNTDOWN_DURATION = 3;
export const SHIELD_COOLDOWN = 25;
export const MAGNET_COOLDOWN = 30;
export const MAGNET_DURATION = 8;
export const BOOST_COOLDOWN = 35;
export const BOOST_DURATION = 5;
export const STEPS_PER_SEC = 48; // 6× prior run speed

export function metersPerStep(distance: number): number {
  if (distance >= 1000) return 2.11;
  if (distance >= 800) return 2.0;
  if (distance >= 500) return 1.8;
  if (distance >= 300) return 1.3;
  if (distance >= 200) return 0.8;
  return 0.5;
}

export function runSpeed(distance: number): number {
  return STEPS_PER_SEC * metersPerStep(distance);
}

export function scoreFromDistance(distance: number): number {
  // 1 point per 2 meters, with distance multipliers
  const base = distance / 2;
  let mult = 1;
  if (distance >= 1000) mult = 2.5;
  else if (distance >= 800) mult = 2.2;
  else if (distance >= 500) mult = 1.8;
  else if (distance >= 300) mult = 1.5;
  else if (distance >= 200) mult = 1.25;
  return Math.floor(base * mult);
}

export function gemsFromScore(points: number, collected: number): number {
  return Math.floor(points * 0.006 + collected);
}
