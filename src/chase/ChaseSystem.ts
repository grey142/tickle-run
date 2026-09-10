import * as THREE from 'three';
import { CAUGHT_UP_DURATION, type ChaseState } from '../game/types';
import { makeMonster } from '../utils/meshes';

export class ChaseSystem {
  mesh: THREE.Group;
  state: ChaseState = 'distant';
  caughtUpTimer = 0;
  /** Offset behind player in world Z (negative = behind) */
  zOffset = -18;
  private bob = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = makeMonster();
    this.mesh.position.set(0, 0, this.zOffset);
    scene.add(this.mesh);
  }

  reset(): void {
    this.state = 'distant';
    this.caughtUpTimer = 0;
    this.zOffset = -18;
  }

  /** Obstacle or wall bump causes catch-up */
  forceCatchUp(): void {
    if (this.state === 'distant') {
      this.state = 'caughtUp';
      this.caughtUpTimer = CAUGHT_UP_DURATION;
      this.zOffset = -4.5;
    }
  }

  isCaughtUp(): boolean {
    return this.state === 'caughtUp';
  }

  update(dt: number, playerX: number, floorY = 0): void {
    this.bob += dt * 3;
    if (this.state === 'caughtUp') {
      this.caughtUpTimer -= dt;
      this.zOffset += ( -4.2 - this.zOffset) * Math.min(1, dt * 3);
      if (this.caughtUpTimer <= 0) {
        this.state = 'distant';
        this.zOffset = -16;
      }
    } else {
      this.zOffset += (-16 - this.zOffset) * Math.min(1, dt * 1.5);
    }
    this.mesh.position.x += (playerX - this.mesh.position.x) * Math.min(1, dt * 4);
    this.mesh.position.z = this.zOffset;
    this.mesh.position.y = floorY + Math.sin(this.bob) * 0.15;
    this.mesh.rotation.y = Math.PI; // face player (player looks down -Z? we run +Z visually toward camera... actually track moves toward player)
    // Player stays at z=0, world scrolls. Monster behind = negative Z.
    this.mesh.rotation.y = 0;
    this.mesh.visible = this.state === 'caughtUp' || this.zOffset > -14;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}
