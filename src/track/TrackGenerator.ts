import * as THREE from 'three';
import type { HazardKind, TrapKind, PickupKind, SegmentType, LaneCount, CaveLevel } from '../game/types';
import { LANE_WIDTH, LEVEL_FLOOR_Y, LEVEL_ORDER } from '../game/types';
import { makeCaveSegment, makeObstacleMesh, makeTrapMesh, makePickupMesh, makeFeatherGem } from '../utils/meshes';
import { OBSTACLE_LIST } from '../catalogs/obstacles';
import { TRAP_LIST } from '../catalogs/traps';

export interface TrackEntity {
  mesh: THREE.Group;
  z: number;
  lane: number;
  kind: 'obstacle' | 'trap' | 'pickup';
  subKind: string;
  lanesNeeded: LaneCount;
  hit: boolean;
  avoid?: 'jump' | 'slide' | 'strafe' | 'none';
  onSlide?: boolean;
  floorY: number;
}

export interface Segment {
  mesh: THREE.Group;
  zStart: number;
  length: number;
  type: SegmentType;
  lanes: LaneCount;
  /** @deprecated use floorYStart — kept for callers that read levelY as mid height */
  levelY: number;
  level: CaveLevel;
  floorYStart: number;
  floorYEnd: number;
  /** Required swipe during turn window; null for non-curves */
  turnRequired: 'left' | 'right' | null;
  /** Player already satisfied the turn input */
  turnCleared: boolean;
  /** Miss already penalized */
  turnMissed: boolean;
  /** -1 = missing left (play right two), +1 = missing right, 0 = centered */
  narrowBias: -1 | 0 | 1;
}

export interface TrackUpdateResult {
  segment: Segment | null;
  floorY: number;
  /** True once when a curve turn window closes without the correct input */
  turnMiss: boolean;
  onRamp: boolean;
  onWaterslide: boolean;
  turnWindow: 'left' | 'right' | null;
  narrowBias: -1 | 0 | 1;
}

function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function levelIndex(level: CaveLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

function clampLevel(i: number): CaveLevel {
  return LEVEL_ORDER[Math.max(0, Math.min(LEVEL_ORDER.length - 1, i))];
}

export class TrackGenerator {
  root = new THREE.Group();
  segments: Segment[] = [];
  entities: TrackEntity[] = [];
  private nextZ = 20;
  private seed = 42;
  private rng = rand(42);
  private distanceRef = 0;
  private segmentIndex = 0;

  /** Persistent cave level after transitions */
  private currentLevel: CaveLevel = 'middle';
  /** Segments remaining on this level before forcing a transition */
  private stretchLeft = 4;
  /** Prefer ramp vs slide after a stretch */
  private nextTransition: 'rampUp' | 'waterslide' | null = null;

  constructor(scene: THREE.Scene) {
    scene.add(this.root);
    for (let i = 0; i < 8; i++) this.spawnSegment();
  }

  reset(seed = Date.now() % 100000): void {
    for (const s of this.segments) this.root.remove(s.mesh);
    for (const e of this.entities) this.root.remove(e.mesh);
    this.segments = [];
    this.entities = [];
    this.nextZ = 16;
    this.seed = seed;
    this.rng = rand(seed);
    this.distanceRef = 0;
    this.segmentIndex = 0;
    this.currentLevel = 'middle';
    this.stretchLeft = 4;
    this.nextTransition = null;
    for (let i = 0; i < 8; i++) this.spawnSegment();
  }

  private difficulty(): number {
    return Math.min(1, this.distanceRef / 800);
  }

  private pickSegmentType(): SegmentType {
    const d = this.difficulty();
    const idx = levelIndex(this.currentLevel);

    // After a stretch, transition to another level when possible
    if (this.stretchLeft <= 0) {
      if (this.nextTransition) {
        const t = this.nextTransition;
        this.nextTransition = null;
        return t;
      }
      // Choose reachable transition
      const canUp = idx < LEVEL_ORDER.length - 1;
      const canDown = idx > 0;
      if (canUp && canDown) {
        return this.rng() < 0.5 ? 'rampUp' : 'waterslide';
      }
      if (canUp) return 'rampUp';
      if (canDown) return 'waterslide';
      // Stuck on only level — reset stretch
      this.stretchLeft = 3 + Math.floor(this.rng() * 3);
    }

    const r = this.rng();
    // Narrow sections more common with difficulty
    // Never 1-lane hallways — only drop one side (narrow2)
    if (r < 0.16 + d * 0.1) return 'narrow2';
    // Curves — more with distance
    if (r < 0.28 + d * 0.08) return this.rng() < 0.5 ? 'curveLeft' : 'curveRight';
    // Occasional early transition mid-stretch (rarer)
    if (r < 0.32 && this.stretchLeft <= 2) {
      const canUp = idx < LEVEL_ORDER.length - 1;
      const canDown = idx > 0;
      if (canUp && this.rng() < 0.5) return 'rampUp';
      if (canDown) return 'waterslide';
      if (canUp) return 'rampUp';
    }
    return 'straight';
  }

  private lanesFor(type: SegmentType): LaneCount {
    if (type === 'narrow2') return 2;
    if (type === 'narrow1') return 2; // legacy: treat as side-narrow, never 1-lane
    if (type === 'waterslide') return 3; // full track width
    return 3;
  }

  spawnSegment(): void {
    const type = this.pickSegmentType();
    const lanes = this.lanesFor(type);
    const narrowBias: -1 | 0 | 1 =
      type === 'narrow2' || type === 'narrow1'
        ? this.rng() < 0.5
          ? -1
          : 1
        : 0;
    const length =
      type === 'rampUp' || type === 'waterslide'
        ? 22 + Math.floor(this.rng() * 8)
        : type === 'curveLeft' || type === 'curveRight'
          ? 16 + Math.floor(this.rng() * 6)
          : 16 + Math.floor(this.rng() * 10);

    const floorYStart = LEVEL_FLOOR_Y[this.currentLevel];
    let floorYEnd = floorYStart;
    let levelAfter: CaveLevel = this.currentLevel;

    if (type === 'rampUp') {
      const next = clampLevel(levelIndex(this.currentLevel) + 1);
      levelAfter = next;
      floorYEnd = LEVEL_FLOOR_Y[next];
    } else if (type === 'waterslide') {
      const next = clampLevel(levelIndex(this.currentLevel) - 1);
      levelAfter = next;
      floorYEnd = LEVEL_FLOOR_Y[next];
    }

    const mesh = makeCaveSegment(
      length,
      lanes,
      type,
      this.segmentIndex + this.seed,
      this.currentLevel,
      floorYStart,
      floorYEnd
    );
    // Mesh local Y is absolute floor heights baked into geometry; place at world z only
    mesh.position.z = this.nextZ + length / 2;
    mesh.position.y = 0;
    this.root.add(mesh);

    const turnRequired: 'left' | 'right' | null =
      type === 'curveLeft' ? 'left' : type === 'curveRight' ? 'right' : null;

    const seg: Segment = {
      mesh,
      zStart: this.nextZ,
      length,
      type,
      lanes,
      levelY: (floorYStart + floorYEnd) / 2,
      level: this.currentLevel,
      floorYStart,
      floorYEnd,
      turnRequired,
      turnCleared: turnRequired === null,
      turnMissed: false,
      narrowBias,
    };
    this.segments.push(seg);
    this.populateSegment(seg);

    // Advance persistent level after transition segments
    if (type === 'rampUp' || type === 'waterslide') {
      this.currentLevel = levelAfter;
      this.stretchLeft = 3 + Math.floor(this.rng() * 4); // 3–6 segments on new level
      this.nextTransition = null;
    } else {
      this.stretchLeft = Math.max(0, this.stretchLeft - 1);
      if (this.stretchLeft === 0 && !this.nextTransition) {
        const idx = levelIndex(this.currentLevel);
        const canUp = idx < LEVEL_ORDER.length - 1;
        const canDown = idx > 0;
        if (canUp && canDown) this.nextTransition = this.rng() < 0.5 ? 'rampUp' : 'waterslide';
        else if (canUp) this.nextTransition = 'rampUp';
        else if (canDown) this.nextTransition = 'waterslide';
        else this.stretchLeft = 4;
      }
    }

    this.nextZ += length;
    this.segmentIndex++;
  }

  private laneX(lane: number, lanes: number, bias = 0): number {
    return (lane - (lanes - 1) / 2) * LANE_WIDTH + bias;
  }

  private populateSegment(seg: Segment): void {
    const d = this.difficulty();
    const { type, lanes, length, zStart, floorYStart, floorYEnd, narrowBias } = seg;
    const xBias = narrowBias * (LANE_WIDTH / 2);
    const onSlide = type === 'waterslide';

    const floorAt = (z: number) => {
      const t = Math.max(0, Math.min(1, (z - zStart) / length));
      return floorYStart + (floorYEnd - floorYStart) * t;
    };

    // Obstacles — skip mid-transition clutter a bit on ramps
    const obsChance = type === 'rampUp' ? 0.15 + d * 0.2 : 0.35 + d * 0.4;
    if (this.rng() < obsChance) {
      const usable = onSlide
        ? OBSTACLE_LIST.filter((o) => o.onSlide)
        : OBSTACLE_LIST.filter((o) => !o.onSlide);
      if (usable.length) {
        const def = usable[Math.floor(this.rng() * usable.length)];
        const lane = Math.floor(this.rng() * lanes);
        const z = zStart + 6 + this.rng() * Math.max(2, length - 10);
        const fy = floorAt(z);
        const mesh = makeObstacleMesh(def.id as HazardKind);
        mesh.position.set(this.laneX(lane, lanes, xBias), fy, z);
        this.root.add(mesh);
        this.entities.push({
          mesh,
          z,
          lane,
          kind: 'obstacle',
          subKind: def.id,
          lanesNeeded: lanes,
          hit: false,
          avoid: def.avoid,
          onSlide: def.onSlide,
          floorY: fy,
        });
      }
    }

    if (this.rng() < 0.2 + d * 0.25 && length > 22 && type !== 'rampUp') {
      const usable = onSlide
        ? OBSTACLE_LIST.filter((o) => o.onSlide)
        : OBSTACLE_LIST.filter((o) => !o.onSlide);
      if (usable.length) {
        const def = usable[Math.floor(this.rng() * usable.length)];
        const lane = Math.floor(this.rng() * lanes);
        const z = zStart + length - 5;
        const fy = floorAt(z);
        const mesh = makeObstacleMesh(def.id as HazardKind);
        mesh.position.set(this.laneX(lane, lanes, xBias), fy, z);
        this.root.add(mesh);
        this.entities.push({
          mesh,
          z,
          lane,
          kind: 'obstacle',
          subKind: def.id,
          lanesNeeded: lanes,
          hit: false,
          avoid: def.avoid,
          onSlide: def.onSlide,
          floorY: fy,
        });
      }
    }

    // Traps (rarer; not on steep transitions)
    if (!onSlide && type !== 'rampUp' && this.rng() < 0.12 + d * 0.15) {
      const def = TRAP_LIST[Math.floor(this.rng() * TRAP_LIST.length)];
      const lane = Math.floor(this.rng() * lanes);
      const z = zStart + 8 + this.rng() * Math.max(2, length - 12);
      const fy = floorAt(z);
      const mesh = makeTrapMesh(def.id as TrapKind);
      mesh.position.set(this.laneX(lane, lanes, xBias), fy, z);
      this.root.add(mesh);
      this.entities.push({
        mesh,
        z,
        lane,
        kind: 'trap',
        subKind: def.id,
        lanesNeeded: lanes,
        hit: false,
        floorY: fy,
      });
    }

    // Feather gem rows — only on remaining lanes
    const gemRows = 1 + (this.rng() < 0.4 + d * 0.3 ? 1 : 0) + (this.rng() < d * 0.4 ? 1 : 0);
    for (let r = 0; r < gemRows; r++) {
      const z = zStart + 4 + r * 5 + this.rng() * 2;
      if (z >= zStart + length - 1) continue;
      const fy = floorAt(z);
      for (let lane = 0; lane < lanes; lane++) {
        if (this.rng() < 0.55 + d * 0.2) {
          const mesh = makeFeatherGem();
          mesh.position.set(this.laneX(lane, lanes, xBias), fy + 0.6, z);
          this.root.add(mesh);
          this.entities.push({
            mesh,
            z,
            lane,
            kind: 'pickup',
            subKind: 'featherGem',
            lanesNeeded: lanes,
            hit: false,
            floorY: fy,
          });
        }
      }
    }

    // Special pickups
    if (this.rng() < 0.06 + d * 0.04) {
      const kinds: PickupKind[] = ['clothing', 'megaClothing', 'escapeGem', 'megaGem'];
      const weights = [0.4, 0.15, 0.15, 0.3];
      let roll = this.rng();
      let pick: PickupKind = 'clothing';
      for (let i = 0; i < kinds.length; i++) {
        roll -= weights[i];
        if (roll <= 0) {
          pick = kinds[i];
          break;
        }
      }
      const lane = Math.floor(this.rng() * lanes);
      const z = zStart + length * 0.5;
      const fy = floorAt(z);
      const mesh = makePickupMesh(pick);
      mesh.position.set(this.laneX(lane, lanes, xBias), fy + 0.7, z);
      this.root.add(mesh);
      this.entities.push({
        mesh,
        z,
        lane,
        kind: 'pickup',
        subKind: pick,
        lanesNeeded: lanes,
        hit: false,
        floorY: fy,
      });
    }
  }

  /** Floor height under a world-local z (player at 0) */
  getFloorYAt(z: number): number {
    const seg = this.segments.find((s) => s.zStart <= z && s.zStart + s.length > z);
    if (!seg) {
      // fallback: nearest or current level height
      if (this.segments.length) {
        const s = this.segments[0];
        return s.floorYStart;
      }
      return LEVEL_FLOOR_Y.middle;
    }
    const t = (z - seg.zStart) / seg.length;
    return seg.floorYStart + (seg.floorYEnd - seg.floorYStart) * Math.max(0, Math.min(1, t));
  }

  /**
   * Notify track that the player pressed left/right (for curve clearance).
   * Returns true if the input counted toward the active turn.
   */
  registerTurnInput(dir: 'left' | 'right'): boolean {
    const seg = this.segments.find((s) => s.zStart <= 0 && s.zStart + s.length > 0);
    if (!seg || !seg.turnRequired || seg.turnCleared) return false;
    // Turn window: middle 70% of the curve segment
    const t = -seg.zStart / seg.length;
    if (t < 0.1 || t > 0.85) return false;
    if (dir === seg.turnRequired) {
      seg.turnCleared = true;
      return true;
    }
    return false;
  }

  /** Scroll world toward player */
  update(dt: number, speed: number, distance: number): TrackUpdateResult {
    this.distanceRef = distance;
    const dz = speed * dt;
    for (const s of this.segments) {
      s.zStart -= dz;
      s.mesh.position.z -= dz;
    }
    for (const e of this.entities) {
      e.z -= dz;
      e.mesh.position.z -= dz;
      if (e.kind === 'pickup') {
        e.mesh.rotation.y += dt * 2.5;
        e.mesh.position.y = e.floorY + 0.6 + Math.sin(performance.now() * 0.005 + e.z) * 0.05;
      }
    }
    this.nextZ -= dz;

    // Cull behind
    while (this.segments.length && this.segments[0].zStart + this.segments[0].length < -12) {
      const s = this.segments.shift()!;
      this.root.remove(s.mesh);
    }
    this.entities = this.entities.filter((e) => {
      if (e.z < -8 || e.hit) {
        this.root.remove(e.mesh);
        return false;
      }
      return true;
    });

    // Spawn ahead
    while (this.nextZ < 90) this.spawnSegment();

    const segment = this.segments.find((s) => s.zStart <= 0 && s.zStart + s.length > 0) ?? null;
    const floorY = this.getFloorYAt(0);

    // Only show the path band ahead — hide other levels that sit above/below and block the view
    for (const s of this.segments) {
      const lo = Math.min(s.floorYStart, s.floorYEnd);
      const hi = Math.max(s.floorYStart, s.floorYEnd);
      const transition = s.type === 'rampUp' || s.type === 'waterslide';
      const entirelyAbove = lo > floorY + 1.15;
      const entirelyBelow = hi < floorY - 1.5;
      s.mesh.visible = transition || !(entirelyAbove || entirelyBelow);
    }
    for (const e of this.entities) {
      const entirelyAbove = e.floorY > floorY + 1.15;
      const entirelyBelow = e.floorY < floorY - 1.5;
      e.mesh.visible = !(entirelyAbove || entirelyBelow) && !e.hit;
    }

    let turnMiss = false;
    let turnWindow: 'left' | 'right' | null = null;
    if (segment?.turnRequired) {
      const t = -segment.zStart / segment.length;
      if (t >= 0.1 && t <= 0.85 && !segment.turnCleared) {
        turnWindow = segment.turnRequired;
      }
      // Past the window without clearing → miss once
      if (t > 0.85 && !segment.turnCleared && !segment.turnMissed) {
        segment.turnMissed = true;
        turnMiss = true;
      }
    }

    return {
      segment,
      floorY,
      turnMiss,
      onRamp: segment?.type === 'rampUp',
      onWaterslide: segment?.type === 'waterslide',
      turnWindow,
      narrowBias: segment?.narrowBias ?? 0,
    };
  }

  getEntitiesNear(zMin: number, zMax: number): TrackEntity[] {
    return this.entities.filter((e) => !e.hit && e.z >= zMin && e.z <= zMax);
  }
}
