import * as THREE from 'three';
import type { AdventurerDef } from '../catalogs/adventurers';
import {
  type ClothingLevel,
  LANE_WIDTH,
  JUMP_DURATION,
  SLIDE_DURATION,
  JUMP_HEIGHT,
} from '../game/types';
import { makeRunner, applyClothingVisibility } from '../utils/meshes';
import type { Input } from '../game/Input';

export class Player {
  mesh: THREE.Group;
  clothing: ClothingLevel = 3;
  lane = 1; // 0..lanes-1, center of 3 is 1
  lanesAvailable: 1 | 2 | 3 = 3;
  x = 0;
  y = 0;
  z = 0; // world forward progress tracked externally as distance
  jumping = false;
  sliding = false;
  jumpT = 0;
  slideT = 0;
  targetLaneX = 0;
  onWaterslide = false;
  invuln = 0;
  alive = true;
  private bob = 0;
  private def: AdventurerDef;

  constructor(def: AdventurerDef) {
    this.def = def;
    this.mesh = makeRunner(def);
    this.setClothing(3);
    this.syncLaneTarget();
  }

  setClothing(level: ClothingLevel): void {
    this.clothing = Math.max(0, Math.min(3, level)) as ClothingLevel;
    applyClothingVisibility(this.mesh, this.clothing);
  }

  loseClothing(n: number): ClothingLevel {
    const next = Math.max(0, this.clothing - n) as ClothingLevel;
    this.setClothing(next);
    return next;
  }

  restoreClothing(n: number): void {
    this.setClothing(Math.min(3, this.clothing + n) as ClothingLevel);
  }

  restoreAll(): void {
    this.setClothing(3);
  }

  private laneIndexCenter(): number {
    // Map lane index so center stays middle of available lanes
    if (this.lanesAvailable === 3) return this.lane;
    if (this.lanesAvailable === 2) return this.lane === 0 ? 0 : 1;
    return 0;
  }

  syncLaneTarget(): void {
    const count = this.lanesAvailable;
    // Clamp lane
    this.lane = Math.max(0, Math.min(count - 1, this.lane));
    const offset = (this.lane - (count - 1) / 2) * LANE_WIDTH;
    this.targetLaneX = offset;
  }

  setLanesAvailable(n: 1 | 2 | 3): void {
    this.lanesAvailable = n;
    if (this.lane > n - 1) this.lane = n - 1;
    this.syncLaneTarget();
  }

  tryJump(): boolean {
    if (this.jumping || this.sliding || this.onWaterslide) return false;
    this.jumping = true;
    this.jumpT = 0;
    return true;
  }

  trySlide(): boolean {
    if (this.jumping || this.sliding) return false;
    this.sliding = true;
    this.slideT = 0;
    return true;
  }

  tryLaneLeft(): void {
    if (this.lane > 0) {
      this.lane -= 1;
      this.syncLaneTarget();
    }
  }

  tryLaneRight(): void {
    if (this.lane < this.lanesAvailable - 1) {
      this.lane += 1;
      this.syncLaneTarget();
    }
  }

  /** Wall bump when trying to leave track */
  bumpWall(): boolean {
    // Called when player tries to go past edge
    return true;
  }

  handleInput(input: Input): { wallBump: boolean } {
    let wallBump = false;
    if (input.wantsJump()) this.tryJump();
    if (input.wantsSlide()) this.trySlide();
    if (input.wantsLeft()) {
      if (this.lane <= 0) wallBump = true;
      else this.tryLaneLeft();
    }
    if (input.wantsRight()) {
      if (this.lane >= this.lanesAvailable - 1) wallBump = true;
      else this.tryLaneRight();
    }
    return { wallBump };
  }

  update(dt: number, strafeAxis: number): void {
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);

    // Smooth lane lerp + fine strafe within lane
    const fine = strafeAxis * 0.35;
    const desired = this.targetLaneX + fine;
    this.x += (desired - this.x) * Math.min(1, dt * 12);

    // Fall off check for narrow floors handled externally via x bounds

    if (this.jumping) {
      this.jumpT += dt;
      const t = this.jumpT / JUMP_DURATION;
      if (t >= 1) {
        this.jumping = false;
        this.y = 0;
      } else {
        this.y = Math.sin(t * Math.PI) * JUMP_HEIGHT;
      }
    } else if (this.sliding) {
      this.slideT += dt;
      const t = this.slideT / SLIDE_DURATION;
      this.y = -0.35;
      this.mesh.scale.set(1, 0.55, 1.1);
      if (t >= 1) {
        this.sliding = false;
        this.y = 0;
        this.mesh.scale.set(1, 1, 1);
      }
    } else {
      this.mesh.scale.set(1, 1, 1);
      this.bob += dt * 10;
      this.y = Math.abs(Math.sin(this.bob)) * 0.05;
      const legL = this.mesh.getObjectByName('legL');
      const legR = this.mesh.getObjectByName('legR');
      const armL = this.mesh.getObjectByName('armL');
      const armR = this.mesh.getObjectByName('armR');
      const swing = Math.sin(this.bob) * 0.45;
      if (legL) legL.rotation.x = swing;
      if (legR) legR.rotation.x = -swing;
      if (armL) armL.rotation.x = -swing;
      if (armR) armR.rotation.x = swing;
    }

    this.mesh.position.set(this.x, this.y, 0);
  }

  /** AABB for collisions (local z~0) */
  getHitBox(): { x: number; y: number; w: number; h: number; sliding: boolean; jumping: boolean } {
    const h = this.sliding ? 0.7 : this.jumping ? 1.0 : 1.6;
    const y0 = this.sliding ? 0 : this.y;
    return { x: this.x, y: y0, w: 0.7, h, sliding: this.sliding, jumping: this.jumping };
  }

  isInvulnerable(): boolean {
    return this.invuln > 0;
  }
}
