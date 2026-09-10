import * as THREE from 'three';
import type { HazardKind, TrapKind, PickupKind, SegmentType, LaneCount } from '../game/types';
import { LANE_WIDTH } from '../game/types';
import { makeCaveSegment, makeObstacleMesh, makeTrapMesh, makePickupMesh, makeFeatherGem } from '../utils/meshes';
import { OBSTACLE_LIST } from '../catalogs/obstacles';
import { TRAP_LIST } from '../catalogs/traps';

export interface TrackEntity {
  mesh: THREE.Group;
  z: number; // world z relative to player (player at 0, entities approach from +z)
  lane: number;
  kind: 'obstacle' | 'trap' | 'pickup';
  subKind: string;
  lanesNeeded: LaneCount;
  hit: boolean;
  avoid?: 'jump' | 'slide' | 'strafe' | 'none';
  onSlide?: boolean;
}

export interface Segment {
  mesh: THREE.Group;
  zStart: number;
  length: number;
  type: SegmentType;
  lanes: LaneCount;
  levelY: number; // upper/middle/lower
}

function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
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

  constructor(scene: THREE.Scene) {
    scene.add(this.root);
    // initial buffer
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
    for (let i = 0; i < 8; i++) this.spawnSegment();
  }

  private difficulty(): number {
    // 0..1 ramp
    return Math.min(1, this.distanceRef / 800);
  }

  private pickSegmentType(): SegmentType {
    const d = this.difficulty();
    const r = this.rng();
    if (r < 0.08 + d * 0.05) return 'narrow1';
    if (r < 0.18 + d * 0.08) return 'narrow2';
    if (r < 0.28) return 'rampUp';
    if (r < 0.42) return 'waterslide';
    if (r < 0.5) return 'curveLeft';
    if (r < 0.58) return 'curveRight';
    return 'straight';
  }

  private lanesFor(type: SegmentType): LaneCount {
    if (type === 'narrow1') return 1;
    if (type === 'narrow2') return 2;
    return 3;
  }

  spawnSegment(): void {
    const type = this.pickSegmentType();
    const lanes = this.lanesFor(type);
    const length = 18 + Math.floor(this.rng() * 10);
    const levelCycle = this.segmentIndex % 5;
    const levelY = levelCycle === 1 ? 1.2 : levelCycle === 3 ? -0.8 : 0;

    const mesh = makeCaveSegment(length, lanes, type, this.segmentIndex + this.seed);
    mesh.position.z = this.nextZ + length / 2;
    mesh.position.y = levelY;
    this.root.add(mesh);

    const seg: Segment = {
      mesh,
      zStart: this.nextZ,
      length,
      type,
      lanes,
      levelY,
    };
    this.segments.push(seg);

    this.populateSegment(seg);
    this.nextZ += length;
    this.segmentIndex++;
  }

  private laneX(lane: number, lanes: number): number {
    return (lane - (lanes - 1) / 2) * LANE_WIDTH;
  }

  private populateSegment(seg: Segment): void {
    const d = this.difficulty();
    const { type, lanes, length, zStart, levelY } = seg;
    const onSlide = type === 'waterslide';

    // Obstacles
    const obsChance = 0.35 + d * 0.4;
    if (this.rng() < obsChance) {
      const pool = OBSTACLE_LIST.filter((o) => (onSlide ? o.onSlide : !o.onSlide || o.id === 'laneWall'));
      const usable = onSlide
        ? OBSTACLE_LIST.filter((o) => o.onSlide)
        : OBSTACLE_LIST.filter((o) => !o.onSlide);
      const list = usable.length ? usable : pool;
      const def = list[Math.floor(this.rng() * list.length)];
      const lane = Math.floor(this.rng() * lanes);
      const z = zStart + 6 + this.rng() * (length - 10);
      const mesh = makeObstacleMesh(def.id as HazardKind);
      mesh.position.set(this.laneX(lane, lanes), levelY, z);
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
      });
    }

    // Sometimes a second obstacle farther
    if (this.rng() < 0.2 + d * 0.25 && length > 22) {
      const usable = onSlide
        ? OBSTACLE_LIST.filter((o) => o.onSlide)
        : OBSTACLE_LIST.filter((o) => !o.onSlide);
      if (usable.length) {
        const def = usable[Math.floor(this.rng() * usable.length)];
        const lane = Math.floor(this.rng() * lanes);
        const z = zStart + length - 5;
        const mesh = makeObstacleMesh(def.id as HazardKind);
        mesh.position.set(this.laneX(lane, lanes), levelY, z);
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
        });
      }
    }

    // Traps (rarer)
    if (this.rng() < 0.12 + d * 0.15) {
      const def = TRAP_LIST[Math.floor(this.rng() * TRAP_LIST.length)];
      const lane = Math.floor(this.rng() * lanes);
      const z = zStart + 8 + this.rng() * (length - 12);
      const mesh = makeTrapMesh(def.id as TrapKind);
      mesh.position.set(this.laneX(lane, lanes), levelY, z);
      this.root.add(mesh);
      this.entities.push({
        mesh,
        z,
        lane,
        kind: 'trap',
        subKind: def.id,
        lanesNeeded: lanes,
        hit: false,
      });
    }

    // Feather gem rows
    const gemRows = 1 + (this.rng() < 0.4 + d * 0.3 ? 1 : 0) + (this.rng() < d * 0.4 ? 1 : 0);
    for (let r = 0; r < gemRows; r++) {
      const z = zStart + 4 + r * 5 + this.rng() * 2;
      for (let lane = 0; lane < lanes; lane++) {
        if (this.rng() < 0.55 + d * 0.2) {
          const mesh = makeFeatherGem();
          mesh.position.set(this.laneX(lane, lanes), levelY + 0.6, z);
          this.root.add(mesh);
          this.entities.push({
            mesh,
            z,
            lane,
            kind: 'pickup',
            subKind: 'featherGem',
            lanesNeeded: lanes,
            hit: false,
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
      const mesh = makePickupMesh(pick);
      mesh.position.set(this.laneX(lane, lanes), levelY + 0.7, z);
      this.root.add(mesh);
      this.entities.push({
        mesh,
        z,
        lane,
        kind: 'pickup',
        subKind: pick,
        lanesNeeded: lanes,
        hit: false,
      });
    }
  }

  /** Scroll world toward player; return current segment under player */
  update(dt: number, speed: number, distance: number): Segment | null {
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
        e.mesh.position.y += Math.sin(performance.now() * 0.005 + e.z) * 0.002;
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
    while (this.nextZ < 80) this.spawnSegment();

    // Current segment at z~0
    return this.segments.find((s) => s.zStart <= 0 && s.zStart + s.length > 0) ?? null;
  }

  getEntitiesNear(zMin: number, zMax: number): TrackEntity[] {
    return this.entities.filter((e) => !e.hit && e.z >= zMin && e.z <= zMax);
  }
}
