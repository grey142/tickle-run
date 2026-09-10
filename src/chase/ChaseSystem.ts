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
  private side = 1.15;

  constructor(scene: THREE.Scene) {
    this.mesh = makeMonster();
    this.mesh.position.set(this.side, 0, this.zOffset);
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
      // Stay behind the camera (cam ~ -6.2) so the body never fills the path ahead
      this.zOffset = -8.5;
      this.side = Math.random() < 0.5 ? -1.25 : 1.25;
    }
  }

  isCaughtUp(): boolean {
    return this.state === 'caughtUp';
  }

  update(dt: number, playerX: number, floorY = 0): void {
    this.bob += dt * 3;
    if (this.state === 'caughtUp') {
      this.caughtUpTimer -= dt;
      this.zOffset += (-8.2 - this.zOffset) * Math.min(1, dt * 3);
      if (this.caughtUpTimer <= 0) {
        this.state = 'distant';
        this.zOffset = -16;
      }
    } else {
      this.zOffset += (-16 - this.zOffset) * Math.min(1, dt * 1.5);
    }
    const targetX = playerX + (this.state === 'caughtUp' ? this.side : 0);
    this.mesh.position.x += (targetX - this.mesh.position.x) * Math.min(1, dt * 4);
    this.mesh.position.z = this.zOffset;
    // Low to the ground — peek beside the runner, not over the tunnel view
    this.mesh.position.y = floorY + 0.15 + Math.sin(this.bob) * 0.08;
    this.mesh.rotation.y = 0;
    this.mesh.visible = this.state === 'caughtUp' || this.zOffset > -14;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}
