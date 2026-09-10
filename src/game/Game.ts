import * as THREE from 'three';
import { Input } from './Input';
import {
  type ClothingLevel,
  type GameScreen,
  type RunStats,
  type TrapKind,
  runSpeed,
  scoreFromDistance,
  gemsFromScore,
  COUNTDOWN_DURATION,
  LANE_WIDTH,
} from './types';
import { Player } from '../player/Player';
import { ChaseSystem } from '../chase/ChaseSystem';
import { TrackGenerator } from '../track/TrackGenerator';
import { EquipmentSystem } from '../equipment/EquipmentSystem';
import { Economy } from '../economy/Economy';
import { CinematicOverlay } from '../cinematics/CinematicOverlay';
import { UI } from '../ui/UI';
import { getAdventurer } from '../catalogs/adventurers';
import { OBSTACLES } from '../catalogs/obstacles';
import { TRAPS } from '../catalogs/traps';

type PendingResume = 'none' | 'countdown';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private input: Input;
  private economy = new Economy();
  private ui: UI;
  private cinematic: CinematicOverlay;

  private player!: Player;
  private chase!: ChaseSystem;
  private track!: TrackGenerator;
  private equip!: EquipmentSystem;

  private screen: GameScreen = 'title';
  private distance = 0;
  private score = 0;
  private runGems = 0;
  private stats: RunStats = this.emptyStats();
  private pendingResume: PendingResume = 'none';
  private countdown = 0;
  private runEscapeCollected = false;
  private revivedThisRun = false;
  private paidOut = false;
  private pendingPayout = 0;
  private frozen = false;
  private mobileLite = false;
  private anim = 0;
  private fromStoreTo: GameScreen = 'title';

  constructor(private container: HTMLElement) {
    const isCoarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isCoarse,
      powerPreference: 'high-performance',
    });
    // Cap DPR for mid-range phones
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isCoarse ? 1.75 : 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);
    this.renderer.shadowMap.enabled = !isCoarse;
    this.renderer.domElement.id = 'game-canvas';
    container.appendChild(this.renderer.domElement);
    this.mobileLite = isCoarse;

    this.scene = new THREE.Scene();
    // Open-top canyon: dark misty sky, purple fog
    this.scene.background = new THREE.Color(0x120c1c);
    this.scene.fog = new THREE.Fog(0x1a1028, 12, 42);

    this.camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / container.clientHeight,
      0.1,
      90
    );
    // Shoulder-height chase cam — look down the tunnel, not up into other levels
    this.camera.position.set(0, 2.35, -6.2);
    this.camera.lookAt(0, 1.0, 12);

    const hemi = new THREE.HemisphereLight(0x6a5acd, 0x1a1020, 0.45);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0x8ecae6, 0.35);
    dir.position.set(2, 14, -4);
    dir.castShadow = !this.mobileLite;
    this.scene.add(dir);
    // Ambient crystal wash
    const fillP = new THREE.PointLight(0x9b5de5, this.mobileLite ? 0.4 : 0.65, 28);
    fillP.position.set(-2.5, 2.2, 3);
    this.scene.add(fillP);
    const fillB = new THREE.PointLight(0x4cc9f0, this.mobileLite ? 0.35 : 0.55, 28);
    fillB.position.set(2.5, 2.2, 5);
    this.scene.add(fillB);

    this.input = new Input();
    this.cinematic = new CinematicOverlay(container);
    this.ui = new UI(container, this.economy, {
      onStart: () => this.startRun(),
      onResume: () => this.resumeFromPause(),
      onRestart: () => { this.settlePayout(); this.startRun(); },
      onQuitTitle: () => { this.settlePayout(); this.toTitle(); },
      onOpenStore: () => this.openStore(),
      onCloseStore: () => this.closeStore(),
      onBuyEquip: (k) => {
        this.economy.buyEquipment(k);
        this.ui.renderStore();
      },
      onBuyEscape: () => {
        this.economy.buyEscapeGem();
        this.ui.renderStore();
      },
      onUnlockAdventurer: (id) => {
        this.economy.unlockAdventurer(id);
        this.ui.renderStore();
      },
      onSelectAdventurer: (id) => {
        this.economy.selectAdventurer(id);
        this.ui.renderStore();
      },
      onRevive: () => this.tryRevive(),
      onEquipActivate: (k) => this.equip?.tryActivate(k),
      onEnableTilt: () => void this.enableTilt(),
    });
    this.ui.bindInput(this.input);

    window.addEventListener('resize', this.onResize);
    window.visualViewport?.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    window.addEventListener('tickle-pause', () => {
      if (this.screen === 'playing' && !this.frozen && this.pendingResume === 'none') this.pause();
    });

    this.buildWorld();
    this.ui.showTitle();
    this.anim = requestAnimationFrame(this.loop);
  }

  private emptyStats(): RunStats {
    return { score: 0, distance: 0, gemsCollected: 0, clothingLost: 0, trapsHit: 0, obstaclesHit: 0 };
  }

  private buildWorld(): void {
    // Clear previous dynamic objects except lights
    const keep = new Set(['HemisphereLight', 'DirectionalLight', 'PointLight']);
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((o) => {
      if ((o as THREE.Light).isLight) return;
      if (o !== this.scene) toRemove.push(o);
    });
    // safer: remove known roots
    void keep;
    void toRemove;

    // Fresh scene children management
    while (this.scene.children.length) this.scene.remove(this.scene.children[0]);
    const hemi = new THREE.HemisphereLight(0xbde0fe, 0x3d405b, 0.85);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffe8d6, 1.1);
    dir.position.set(-4, 12, -6);
    dir.castShadow = !this.mobileLite;
    this.scene.add(dir);
    const fill = new THREE.PointLight(0x9b5de5, this.mobileLite ? 0.35 : 0.55, 40);
    fill.position.set(0, 3, 4);
    this.scene.add(fill);

    const def = getAdventurer(this.economy.data.selectedAdventurer);
    this.player = new Player(def);
    this.scene.add(this.player.mesh);

    this.chase = new ChaseSystem(this.scene);
    this.track = new TrackGenerator(this.scene);

    const freeShield = this.economy.data.selectedAdventurer === 'trickster';
    this.economy.prepareRunEquipment();
    this.equip = new EquipmentSystem(this.economy.data.equipment, freeShield);
  }

  private startRun(): void {
    this.buildWorld();
    this.distance = 0;
    this.score = 0;
    this.runGems = 0;
    this.stats = this.emptyStats();
    this.runEscapeCollected = false;
    this.revivedThisRun = false;
    this.paidOut = false;
    this.pendingPayout = 0;
    this.frozen = false;
    this.pendingResume = 'countdown';
    this.countdown = COUNTDOWN_DURATION;
    this.screen = 'playing';
    this.ui.hideGameOver();
    this.ui.hideStore();
    this.ui.showPlaying();
    this.ui.showCountdown(this.countdown);
    this.player.setClothing(3);
    this.input.calibrateTilt();
    this.ui.beginSwipeHints();
  }

  private toTitle(): void {
    this.screen = 'title';
    this.frozen = true;
    this.ui.hidePause();
    this.ui.hideGameOver();
    this.ui.hideStore();
    this.ui.hideCountdown();
    this.cinematic.hide();
    this.ui.showTitle();
  }

  private pause(): void {
    this.screen = 'paused';
    this.ui.showPause();
  }

  private resumeFromPause(): void {
    this.screen = 'playing';
    this.ui.hidePause();
    this.pendingResume = 'countdown';
    this.countdown = COUNTDOWN_DURATION;
    this.ui.showCountdown(this.countdown);
  }

  private openStore(): void {
    this.fromStoreTo = this.screen === 'gameover' ? 'gameover' : this.screen === 'playing' || this.screen === 'paused' ? 'paused' : 'title';
    if (this.screen === 'playing') {
      this.screen = 'paused';
      this.ui.showPause();
    }
    this.ui.renderStore();
  }

  private closeStore(): void {
    this.ui.hideStore();
    if (this.fromStoreTo === 'title') this.ui.showTitle();
    else if (this.fromStoreTo === 'gameover') {
      /* stay on go */
    } else {
      this.ui.showPlaying();
    }
  }

  private beginCountdownAfterInterrupt(): void {
    this.frozen = false;
    this.pendingResume = 'countdown';
    this.countdown = COUNTDOWN_DURATION;
    this.ui.showCountdown(this.countdown);
    this.screen = 'playing';
    this.ui.showPlaying();
  }

  private onResize = (): void => {
    const vv = window.visualViewport;
    const w = Math.max(1, Math.floor(vv?.width ?? this.container.clientWidth));
    const h = Math.max(1, Math.floor(vv?.height ?? this.container.clientHeight));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.mobileLite ? 1.75 : 2));
  };

  private async enableTilt(): Promise<void> {
    const state = await this.input.requestTiltPermission();
    this.ui.setTiltState(state);
    if (state === 'granted') this.input.calibrateTilt();
  }

  private loop = (): void => {
    this.anim = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.update(dt);
    this.render();
    this.input.endFrame();
  };

  private update(dt: number): void {
    this.cinematic.update(dt);
    if (this.screen === 'playing') this.ui.updateSwipeHints(dt);

    if (this.screen === 'title' || this.screen === 'store') {
      // idle spin camera
      this.camera.position.x = Math.sin(performance.now() * 0.0003) * 1.5;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.screen === 'paused') return;

    if (this.screen === 'cinematic') return;

    if (this.screen === 'gameover') return;

    // playing
    if (this.input.wantsPause() && this.pendingResume === 'none' && !this.frozen) {
      this.pause();
      return;
    }

    if (this.pendingResume === 'countdown') {
      this.countdown -= dt;
      this.ui.showCountdown(this.countdown);
      if (this.countdown <= 0) {
        this.pendingResume = 'none';
        this.ui.hideCountdown();
      }
      // still update cosmetics
      this.chase.update(dt, this.player.x);
      this.updateHud();
      return;
    }

    if (this.frozen) return;

    this.equip.update(dt);

    const def = getAdventurer(this.economy.data.selectedAdventurer);
    let speed = runSpeed(this.distance) * def.speedBonus;
    if (this.equip.isBoostActive()) speed *= 1.45;

    const { wallBump, turnedLeft, turnedRight } = this.player.handleInput(this.input);
    let turnCleared = false;
    if (turnedLeft) turnCleared = this.track.registerTurnInput('left') || turnCleared;
    if (turnedRight) turnCleared = this.track.registerTurnInput('right') || turnCleared;
    // Edge bump while satisfying a curve swipe does not stack a second catch-up
    if (wallBump && !turnCleared) {
      this.chase.forceCatchUp();
    }

    const trackInfo = this.track.update(dt, speed, this.distance);
    const seg = trackInfo.segment;

    this.player.setFloorY(trackInfo.floorY);
    this.player.onWaterslide = trackInfo.onWaterslide;
    this.player.onRamp = trackInfo.onRamp;

    this.player.update(dt, this.input.strafeAxis());

    if (trackInfo.turnMiss) {
      // Missed curve swipe → wall bump / catch-up
      this.chase.forceCatchUp();
      this.player.invuln = Math.max(this.player.invuln, 0.35);
    }

    if (seg) {
      this.player.setLanesAvailable(seg.lanes);
      // fall off narrow
      const half = (seg.lanes * LANE_WIDTH) / 2 + 0.15;
      if (Math.abs(this.player.x) > half + 0.55) {
        this.triggerFallOff();
        return;
      }
    }

    this.distance += speed * dt;
    this.score = scoreFromDistance(this.distance);
    this.stats.distance = this.distance;
    this.stats.score = this.score;

    this.chase.update(dt, this.player.x, trackInfo.floorY);

    this.resolveCollisions();
    this.updateHud();

    // camera follow floor — keep view on the path ahead (not upper decks)
    const camTargetY = 2.35 + trackInfo.floorY + (this.player.y - trackInfo.floorY) * 0.15;
    this.camera.position.x += (this.player.x * 0.28 - this.camera.position.x) * 0.1;
    this.camera.position.y += (camTargetY - this.camera.position.y) * 0.14;
    this.camera.position.z = -6.2;
    this.camera.lookAt(this.player.x * 0.4, trackInfo.floorY + 0.95, 14);
  }

  private updateHud(): void {
    this.ui.updateHud({
      score: this.score,
      distance: this.distance,
      gems: this.runGems,
      clothing: this.player.clothing,
      chaseLeft: this.chase.isCaughtUp() ? this.chase.caughtUpTimer : null,
      equip: this.equip,
    });
  }

  private resolveCollisions(): void {
    if (this.player.isInvulnerable()) return;
    // Broad phase only — real hits require AABB overlap with the sprite below
    const near = this.track.getEntitiesNear(-1.5, 2.5);
    const hb = this.player.getHitBox();
    const boost = this.equip.isBoostActive();
    // Player body extents (must actually touch the sprite)
    const pHalfX = hb.w * 0.5;
    const pHalfZ = 0.28;

    // Magnet pull
    if (this.equip.isMagnetActive() || this.economy.data.selectedAdventurer === 'miner') {
      const range = 3.5 + this.equip.magnetRangeBonus() + (this.economy.data.selectedAdventurer === 'miner' ? 1.5 : 0);
      for (const e of this.track.entities) {
        if (e.kind !== 'pickup' || e.subKind !== 'featherGem' || e.hit) continue;
        const dx = e.mesh.position.x - this.player.x;
        const dz = e.z;
        if (Math.hypot(dx, dz) < range) {
          e.mesh.position.x += (this.player.x - e.mesh.position.x) * 0.2;
          e.z += (0.2 - e.z) * 0.2;
          e.mesh.position.z = e.z;
        }
      }
    }

    for (const e of near) {
      const dx = Math.abs(e.mesh.position.x - hb.x);
      const dz = Math.abs(e.z);

      if (e.kind === 'pickup') {
        const halfX = 0.28;
        const halfZ = 0.28;
        if (dx > pHalfX + halfX || dz > pHalfZ + halfZ) continue;
        e.hit = true;
        this.collectPickup(e.subKind);
        continue;
      }

      if (boost) continue;

      if (e.kind === 'obstacle') {
        const def = OBSTACLES[e.subKind as keyof typeof OBSTACLES];
        if (!def) continue;
        const halfX = def.width * 0.5;
        const halfZ = Math.max(0.18, def.depth * 0.5);
        // Must overlap the obstacle sprite in both X and Z
        if (dx > pHalfX + halfX || dz > pHalfZ + halfZ) continue;

        const clear = def.clearance ?? 0;
        const top = clear + def.height;
        const feet = hb.y;
        const head = hb.y + hb.h;
        let avoided = false;

        if (def.avoid === 'jump') {
          if (hb.jumping) avoided = true;
        } else if (def.avoid === 'slide') {
          if (hb.sliding) avoided = true;
        }
        if (!avoided && hb.jumping && clear < 0.35 && top <= 0.65) avoided = true;
        if (!avoided && hb.sliding && clear >= 0.7 && head <= clear + 0.25) avoided = true;
        if (avoided) continue;

        e.hit = true;
        this.onObstacleHit();
        return;
      }

      if (e.kind === 'trap') {
        const tdef = TRAPS[e.subKind as TrapKind];
        const halfX = (tdef?.footprint ?? 1.1) * 0.5;
        const halfZ = 0.35; // trap sprite depth
        if (dx > pHalfX + halfX || dz > pHalfZ + halfZ) continue;
        e.hit = true;
        this.onTrapHit(e.subKind as TrapKind);
        return;
      }
    }
  }

  private collectPickup(kind: string): void {
    if (kind === 'featherGem') {
      this.runGems += 1;
      this.stats.gemsCollected += 1;
    } else if (kind === 'clothing') {
      this.player.restoreClothing(1);
    } else if (kind === 'megaClothing') {
      this.player.restoreAll();
    } else if (kind === 'escapeGem') {
      this.runEscapeCollected = true;
      this.economy.data.hasEscapeGem = true;
      this.economy.persist();
    } else if (kind === 'megaGem') {
      this.runGems += 200;
      this.stats.gemsCollected += 200;
    }
  }

  private onObstacleHit(): void {
    this.stats.obstaclesHit += 1;
    if (this.equip.consumeShield()) {
      this.player.invuln = 1.2;
      this.chase.forceCatchUp();
      return;
    }
    if (this.chase.isCaughtUp()) {
      this.resolveMonsterCatch('obstacle');
    } else {
      this.chase.forceCatchUp();
      this.player.invuln = 0.8;
    }
  }

  private onTrapHit(trapKind: TrapKind): void {
    this.stats.trapsHit += 1;
    if (this.equip.consumeShield()) {
      this.player.invuln = 1.2;
      this.chase.forceCatchUp();
      return;
    }

    if (this.chase.isCaughtUp()) {
      // Dual tickle
      this.playCinematic(
        {
          kind: 'dualTickle',
          clothing: this.player.clothing,
          trapKind,
          duration: 2.6,
        },
        () => {
          if (this.player.clothing >= 3) {
            // lose ALL clothing and escape
            this.stats.clothingLost += this.player.clothing;
            this.player.setClothing(0);
            this.chase.reset();
            this.player.invuln = 2;
            this.playCinematic(
              { kind: 'escape', clothing: 0, duration: 1.4 },
              () => this.beginCountdownAfterInterrupt()
            );
          } else {
            this.player.setClothing(0);
            this.endRun(false);
          }
        }
      );
      return;
    }

    // Normal trap: lose 1 clothing, monster catches up
    const before = this.player.clothing;
    this.player.loseClothing(1);
    this.stats.clothingLost += before - this.player.clothing;
    this.chase.forceCatchUp();

    if (this.player.clothing <= 0) {
      this.playCinematic(
        { kind: 'trapTickle', clothing: 0, trapKind, duration: 2.2 },
        () => this.endRun(false)
      );
      return;
    }

    this.playCinematic(
      { kind: 'trapTickle', clothing: this.player.clothing, trapKind },
      () => this.beginCountdownAfterInterrupt()
    );
  }

  private resolveMonsterCatch(_reason: string): void {
    const full = this.player.clothing >= 3;
    this.playCinematic(
      {
        kind: 'monsterCatch',
        clothing: this.player.clothing,
        duration: 2.5,
        message: full ? 'Harsh tickle! You lose shirt & pants!' : 'The monster finishes the tickle…',
      },
      () => {
        if (full) {
          // lose 2 clothing, escape, keep running
          this.player.loseClothing(2);
          this.stats.clothingLost += 2;
          this.chase.reset();
          this.player.invuln = 2;
          this.playCinematic(
            { kind: 'escape', clothing: this.player.clothing, duration: 1.4 },
            () => this.beginCountdownAfterInterrupt()
          );
        } else {
          this.stats.clothingLost += this.player.clothing;
          this.player.setClothing(0);
          this.endRun(false);
        }
      }
    );
  }

  private triggerFallOff(): void {
    this.playCinematic(
      { kind: 'fallOff', clothing: this.player.clothing, duration: 2.0 },
      () => {
        this.player.setClothing(0);
        this.endRun(false);
      }
    );
  }

  private playCinematic(
    req: Parameters<CinematicOverlay['play']>[0],
    onDone: () => void
  ): void {
    this.screen = 'cinematic';
    this.frozen = true;
    this.cinematic.play(req, () => {
      onDone();
    });
  }

  private endRun(_fromCatch: boolean): void {
    this.screen = 'cinematic';
    const points = this.score;
    const fromScore = Math.floor(points * 0.006);
    const payout = gemsFromScore(points, this.runGems);

    this.playCinematic(
      { kind: 'gameOver', clothing: this.player.clothing, duration: 2.0 },
      () => {
        this.screen = 'gameover';
        this.pendingPayout = payout;
        this.economy.data.equipment = this.equip.state;
        this.economy.persist();
        const canRevive =
          !this.revivedThisRun && (this.economy.data.hasEscapeGem || this.runEscapeCollected);
        this.ui.showGameOver(this.stats, payout, canRevive, {
          points,
          fromScore,
          collected: this.runGems,
        });
      }
    );
  }


  private settlePayout(): void {
    if (this.paidOut) return;
    const points = this.score;
    const payout = this.pendingPayout || gemsFromScore(points, this.runGems);
    this.economy.addGems(payout);
    this.economy.recordRun(points, this.distance);
    this.economy.data.equipment = this.equip.state;
    this.economy.persist();
    this.paidOut = true;
    this.pendingPayout = 0;
  }

  private tryRevive(): void {
    if (this.revivedThisRun) return;
    const had =
      this.economy.data.hasEscapeGem || this.runEscapeCollected;
    if (!had) return;
    if (this.economy.data.hasEscapeGem) this.economy.consumeEscapeGem();
    this.runEscapeCollected = false;

    this.revivedThisRun = true;
    this.pendingPayout = 0;
    this.paidOut = false;
    this.ui.hideGameOver();
    this.player.setClothing(1);
    this.chase.reset();
    this.player.invuln = 2.5;
    this.playCinematic(
      { kind: 'revive', clothing: this.player.clothing, duration: 1.6 },
      () => this.beginCountdownAfterInterrupt()
    );
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    cancelAnimationFrame(this.anim);
    window.removeEventListener('resize', this.onResize);
    window.visualViewport?.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.renderer.dispose();
  }
}
