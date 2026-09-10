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
  /** World floor height under the runner (ramps/slides/levels) */
  floorY = 0;
  z = 0;
  jumping = false;
  sliding = false;
  jumpT = 0;
  slideT = 0;
  targetLaneX = 0;
  onWaterslide = false;
  onRamp = false;
  invuln = 0;
  alive = true;
  private bob = 0;
  private def: AdventurerDef;
  /** Local pose offset above floor (jump arc / slide crouch / bob) */
  private poseY = 0;

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

  syncLaneTarget(): void {
    const count = this.lanesAvailable;
    this.lane = Math.max(0, Math.min(count - 1, this.lane));
    const offset = (this.lane - (count - 1) / 2) * LANE_WIDTH;
    this.targetLaneX = offset;
  }

  setLanesAvailable(n: 1 | 2 | 3): void {
    this.lanesAvailable = n;
    if (this.lane > n - 1) this.lane = n - 1;
    this.syncLaneTarget();
  }

  setFloorY(floorY: number): void {
    this.floorY = floorY;
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

  bumpWall(): boolean {
    return true;
  }

  handleInput(input: Input): { wallBump: boolean; turnedLeft: boolean; turnedRight: boolean } {
    let wallBump = false;
    let turnedLeft = false;
    let turnedRight = false;
    if (input.wantsJump()) this.tryJump();
    if (input.wantsSlide()) this.trySlide();
    if (input.wantsLeft()) {
      turnedLeft = true;
      if (this.lane <= 0) wallBump = true;
      else this.tryLaneLeft();
    }
    if (input.wantsRight()) {
      turnedRight = true;
      if (this.lane >= this.lanesAvailable - 1) wallBump = true;
      else this.tryLaneRight();
    }
    return { wallBump, turnedLeft, turnedRight };
  }

  update(dt: number, strafeAxis: number): void {
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);

    // Force slide pose on waterslides (no jump)
    if (this.onWaterslide) {
      if (this.jumping) {
        this.jumping = false;
        this.jumpT = 0;
      }
      this.sliding = true;
      this.slideT = 0; // hold crouch while on slide
    }

    // Tilt/drag is a full-track slider across available lanes.
    // Hard-clamp inset from the walls so tilt alone never wall-bumps or falls off.
    const half = ((this.lanesAvailable - 1) / 2) * LANE_WIDTH;
    const maxX = Math.max(0.05, half - 0.18);
    const axis = Math.max(-1, Math.min(1, strafeAxis));
    let desired: number;
    if (Math.abs(axis) > 0.06) {
      desired = axis * maxX;
    } else {
      desired = this.targetLaneX;
    }
    desired = Math.max(-maxX, Math.min(maxX, desired));
    // Tilt follows the phone gradually (~full track in ~1.3s). Lane settle is a bit quicker.
    const tilting = Math.abs(axis) > 0.06;
    const maxSpeed = tilting ? 1.05 : 7.5; // tilt ~3× slower; lane settle unchanged
    const delta = desired - this.x;
    const step = Math.sign(delta) * Math.min(Math.abs(delta), maxSpeed * dt);
    this.x += step;
    this.x = Math.max(-maxX, Math.min(maxX, this.x));

    if (this.jumping) {
      this.jumpT += dt;
      const t = this.jumpT / JUMP_DURATION;
      if (t >= 1) {
        this.jumping = false;
        this.poseY = 0;
      } else {
        this.poseY = Math.sin(t * Math.PI) * JUMP_HEIGHT;
      }
      this.mesh.scale.set(1, 1, 1);
    } else if (this.sliding || this.onWaterslide) {
      if (!this.onWaterslide) {
        this.slideT += dt;
        const t = this.slideT / SLIDE_DURATION;
        this.poseY = -0.35;
        this.mesh.scale.set(1, 0.55, 1.1);
        if (t >= 1) {
          this.sliding = false;
          this.poseY = 0;
          this.mesh.scale.set(1, 1, 1);
        }
      } else {
        this.poseY = -0.35;
        this.mesh.scale.set(1, 0.55, 1.1);
      }
    } else {
      this.mesh.scale.set(1, 1, 1);
      this.bob += dt * 10;
      this.poseY = Math.abs(Math.sin(this.bob)) * 0.05;
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

    // Slight pitch on ramps/slides for readability
    if (this.onRamp) this.mesh.rotation.x = -0.12;
    else if (this.onWaterslide) this.mesh.rotation.x = 0.18;
    else this.mesh.rotation.x *= 0.85;

    this.y = this.floorY + this.poseY;
    this.mesh.position.set(this.x, this.y, 0);
  }

  getHitBox(): { x: number; y: number; w: number; h: number; sliding: boolean; jumping: boolean } {
    const sliding = this.sliding || this.onWaterslide;
    const h = sliding ? 0.7 : this.jumping ? 1.0 : 1.6;
    const y0 = sliding ? this.floorY : this.y;
    return { x: this.x, y: y0, w: 0.7, h, sliding, jumping: this.jumping };
  }

  isInvulnerable(): boolean {
    return this.invuln > 0;
  }
}
