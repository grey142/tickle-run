import * as THREE from 'three';
import type { AdventurerDef } from '../catalogs/adventurers';
import type { ClothingLevel } from '../game/types';
import { OBSTACLES } from '../catalogs/obstacles';
import { TRAPS } from '../catalogs/traps';
import type { HazardKind, TrapKind } from '../game/types';
import { getCreature } from '../catalogs/creatures';

export function makeRunner(def: AdventurerDef): THREE.Group {
  const g = new THREE.Group();
  g.name = 'runner';

  const skinMat = new THREE.MeshStandardMaterial({ color: def.colors.skin, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: def.colors.hair, roughness: 0.85 });

  // Body core
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.4), skinMat);
  torso.position.y = 1.05;
  torso.name = 'torso';
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), skinMat);
  head.position.y = 1.65;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), hairMat);
  hair.position.y = 1.78;
  hair.scale.set(1, 0.55, 1);
  g.add(hair);

  // Shirt
  const shirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.78, 0.44),
    new THREE.MeshStandardMaterial({ color: def.colors.shirt, roughness: 0.8 })
  );
  shirt.position.y = 1.05;
  shirt.name = 'shirt';
  g.add(shirt);

  // Pants
  const pants = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.55, 0.4),
    new THREE.MeshStandardMaterial({ color: def.colors.pants, roughness: 0.85 })
  );
  pants.position.y = 0.52;
  pants.name = 'pants';
  g.add(pants);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.45, 0.25);
  const legL = new THREE.Mesh(legGeo, skinMat);
  legL.position.set(-0.18, 0.22, 0);
  legL.name = 'legL';
  const legR = new THREE.Mesh(legGeo, skinMat);
  legR.position.set(0.18, 0.22, 0);
  legR.name = 'legR';
  g.add(legL, legR);

  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.16, 0.38);
  const shoeMat = new THREE.MeshStandardMaterial({ color: def.colors.shoes, roughness: 0.7 });
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.18, 0.05, 0.05);
  shoeL.name = 'shoeL';
  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0.18, 0.05, 0.05);
  shoeR.name = 'shoeR';
  g.add(shoeL, shoeR);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.5, 1.05, 0);
  armL.name = 'armL';
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.5, 1.05, 0);
  armR.name = 'armR';
  g.add(armL, armR);

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      (o as THREE.Mesh).castShadow = true;
      (o as THREE.Mesh).receiveShadow = true;
    }
  });

  return g;
}

export function applyClothingVisibility(root: THREE.Object3D, level: ClothingLevel): void {
  const shirt = root.getObjectByName('shirt');
  const pants = root.getObjectByName('pants');
  const shoeL = root.getObjectByName('shoeL');
  const shoeR = root.getObjectByName('shoeR');
  if (shirt) shirt.visible = level >= 3;
  if (pants) pants.visible = level >= 2;
  if (shoeL) shoeL.visible = level >= 1;
  if (shoeR) shoeR.visible = level >= 1;
}

export function makeMonster(): THREE.Group {
  const def = getCreature('tickleMonster');
  const g = new THREE.Group();
  g.name = 'monster';
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.7 * def.scale, 14, 12),
    new THREE.MeshStandardMaterial({ color: def.bodyColor, roughness: 0.55 })
  );
  body.position.y = 1.0;
  g.add(body);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.45 * def.scale, 12, 10),
    new THREE.MeshStandardMaterial({ color: def.accentColor, roughness: 0.6 })
  );
  belly.position.set(0, 0.85, 0.45);
  g.add(belly);

  // Feather tufts
  for (let i = 0; i < 5; i++) {
    const feather = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.7, 6),
      new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.15 })
    );
    const a = (i / 5) * Math.PI * 2;
    feather.position.set(Math.cos(a) * 0.55, 1.55, Math.sin(a) * 0.55);
    feather.rotation.z = Math.cos(a) * 0.4;
    g.add(feather);
  }

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const sx of [-0.28, 0.28]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), eyeMat);
    eye.position.set(sx, 1.25, 0.75);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), pupilMat);
    pupil.position.set(sx, 1.25, 0.88);
    g.add(pupil);
  }

  // Arms reaching forward
  const armMat = new THREE.MeshStandardMaterial({ color: def.bodyColor });
  for (const sx of [-0.7, 0.7]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.7, 4, 8), armMat);
    arm.position.set(sx, 1.0, 0.5);
    arm.rotation.x = -0.6;
    g.add(arm);
  }

  g.scale.setScalar(0.55);
  return g;
}

export function makeObstacleMesh(kind: HazardKind): THREE.Group {
  const def = OBSTACLES[kind];
  const g = new THREE.Group();
  g.name = kind;
  const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.8 });
  const clear = def.clearance ?? 0;

  if (kind === 'log') {
    // Low ground log — jump over (height ~0.5)
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, def.width, 10), mat);
    m.rotation.z = Math.PI / 2;
    m.position.y = def.height / 2;
    g.add(m);
  } else if (kind === 'vines') {
    // Ground vines / roots — jump over
    for (let i = -1; i <= 1; i++) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.55, 6), mat);
      v.rotation.z = Math.PI / 2 + i * 0.2;
      v.position.set(i * 0.4, 0.18, i * 0.05);
      g.add(v);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), mat);
      leaf.position.set(i * 0.35, 0.35, 0.05);
      g.add(leaf);
    }
  } else if (kind === 'laneWall') {
    // Low barrier — jump over
    const m = new THREE.Mesh(new THREE.BoxGeometry(def.width, def.height, def.depth), mat);
    m.position.y = def.height / 2;
    g.add(m);
  } else if (kind === 'tree') {
    // Low stump — jump over
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, def.height, 8), mat);
    trunk.position.y = def.height / 2;
    g.add(trunk);
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x40916c, emissive: 0x102010 })
    );
    top.position.y = def.height + 0.05;
    g.add(top);
  } else if (kind === 'slideRock') {
    // Elevated overhang — slide under (gap = clearance)
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38), mat);
    m.position.y = clear + def.height / 2;
    g.add(m);
  } else {
    // Elevated branch — slide under (gap = clearance)
    const m = new THREE.Mesh(new THREE.BoxGeometry(def.width, def.height, def.depth), mat);
    m.position.y = clear + def.height / 2;
    g.add(m);
  }

  g.userData.kind = kind;
  g.userData.obstacleTop = clear + def.height;
  g.userData.obstacleClearance = clear;
  return g;
}

export function makeTrapMesh(kind: TrapKind): THREE.Group {
  const def = TRAPS[kind];
  const g = new THREE.Group();
  g.name = kind;

  if (kind === 'blackPit') {
    const holeMat = new THREE.MeshStandardMaterial({
      color: 0x020205,
      roughness: 1,
      metalness: 0,
      emissive: 0x110022,
      emissiveIntensity: 0.15,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a1028,
      roughness: 0.9,
      emissive: 0x4a0080,
      emissiveIntensity: 0.2,
    });
    const hole = new THREE.Mesh(new THREE.BoxGeometry(def.footprint, 0.12, def.depth), holeMat);
    hole.position.y = -0.04;
    g.add(hole);
    const well = new THREE.Mesh(
      new THREE.BoxGeometry(def.footprint * 0.85, 1.2, def.depth * 0.9),
      holeMat
    );
    well.position.y = -0.65;
    g.add(well);
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(def.footprint + 0.15, 0.06, def.depth + 0.15),
      rimMat
    );
    rim.position.y = 0.01;
    g.add(rim);
    g.userData.kind = kind;
    g.userData.footprint = def.footprint;
    g.userData.depth = def.depth;
    return g;
  }

  if (kind === 'floorSlime') {
    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x4cc9f0,
      roughness: 0.25,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
      emissive: 0x0077b6,
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), slimeMat);
    body.scale.set(1.15, 0.65, 1.1);
    body.position.y = 0.22;
    g.add(body);
    // Tentacles
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const tent = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.35, 3, 6), slimeMat);
      tent.position.set(Math.cos(a) * 0.28, 0.15, Math.sin(a) * 0.28);
      tent.rotation.z = Math.cos(a) * 0.7;
      tent.rotation.x = Math.sin(a) * 0.5;
      g.add(tent);
    }
    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    for (const sx of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeMat);
      eye.position.set(sx, 0.32, 0.28);
      g.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 5), pupilMat);
      pupil.position.set(sx, 0.32, 0.34);
      g.add(pupil);
    }
  } else if (kind === 'handSwarm') {
    const skin = new THREE.MeshStandardMaterial({ color: 0xffe5d0, roughness: 0.7 });
    const nail = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.45 });
    for (let i = 0; i < 18; i++) {
      const hand = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), skin);
      hand.add(palm);
      for (let f = 0; f < 4; f++) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), skin);
        finger.position.set(-0.06 + f * 0.04, 0.11, 0);
        hand.add(finger);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.05, 4), nail);
        tip.position.set(-0.06 + f * 0.04, 0.18, 0);
        tip.rotation.x = Math.PI;
        hand.add(tip);
      }
      const col = i % 3;
      const row = Math.floor(i / 3);
      hand.position.set((col - 1) * 0.35 + (row % 2) * 0.08, 0.45 + (row % 5) * 0.28, (row % 3) * 0.25 - 0.25);
      hand.rotation.set((i % 5) * 0.15, (i % 7) * 0.2, (i % 3) * 0.25);
      g.add(hand);
    }
  } else if (kind === 'vineTrap') {
    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.85,
      emissive: 0x1b4332,
      emissiveIntensity: 0.15,
    });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x95d5b2, roughness: 0.6 });
    for (let i = 0; i < 10; i++) {
      const vine = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.55 + (i % 3) * 0.1, 3, 5), vineMat);
      const a = (i / 10) * Math.PI * 2;
      vine.position.set(Math.cos(a) * 0.25, 0.12, Math.sin(a) * 0.2);
      vine.rotation.z = Math.cos(a) * 0.9;
      vine.rotation.x = 0.4 + (i % 4) * 0.1;
      g.add(vine);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), tipMat);
      tip.position.set(Math.cos(a) * 0.4, 0.35 + (i % 3) * 0.08, Math.sin(a) * 0.35);
      g.add(tip);
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.9 });
    const patch = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 10), mat);
    patch.position.y = 0.02;
    g.add(patch);
  } else if (kind === 'shade') {
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a10,
      roughness: 0.95,
      transparent: true,
      opacity: 0.88,
      emissive: 0x3a0ca3,
      emissiveIntensity: 0.25,
    });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 8), shadeMat);
    body.position.y = 0.95;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), shadeMat);
    head.position.y = 1.75;
    g.add(head);
    // Glowing eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xc77dff,
      emissive: 0x9b5de5,
      emissiveIntensity: 1.2,
    });
    for (const sx of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeMat);
      eye.position.set(sx, 1.8, 0.22);
      g.add(eye);
    }
    // Tendrils with 3-finger hands
    const handMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -1 : 1;
      const tent = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.7, 3, 6), shadeMat);
      tent.position.set(side * 0.35, 0.9 + (i % 2) * 0.25, 0.15);
      tent.rotation.z = side * 0.7;
      tent.rotation.x = -0.4;
      g.add(tent);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), handMat);
      palm.position.set(side * 0.55, 0.55 + (i % 2) * 0.2, 0.35);
      g.add(palm);
      for (let f = 0; f < 3; f++) {
        const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.08, 2, 4), handMat);
        finger.position.set(side * 0.55 + (f - 1) * 0.04, 0.48 + (i % 2) * 0.2, 0.42);
        g.add(finger);
      }
    }
  }

  g.userData.kind = kind;
  g.userData.footprint = def.footprint;
  g.userData.depth = def.depth;
  if (kind !== 'handSwarm' && kind !== 'shade') g.scale.setScalar(0.85);
  return g;
}

export function makeFeatherGem(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff2244,
    emissive: 0xff2244,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 6), mat);
  feather.rotation.z = Math.PI;
  feather.position.y = 0.35;
  g.add(feather);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat);
  tip.position.y = 0.62;
  g.add(tip);
  g.userData.pickup = 'featherGem';
  return g;
}

export function makePickupMesh(kind: string): THREE.Group {
  const g = new THREE.Group();
  let color = 0xffffff;
  let emissive = 0x222222;
  if (kind === 'clothing') {
    color = 0x3d8bfd;
    emissive = 0x1a4a8a;
  } else if (kind === 'megaClothing') {
    color = 0xffd166;
    emissive = 0xaa7700;
  } else if (kind === 'escapeGem') {
    color = 0x2ec4b6;
    emissive = 0x0a7a6e;
  } else if (kind === 'megaGem') {
    color = 0xff9f1c;
    emissive = 0xaa5500;
  } else {
    return makeFeatherGem();
  }
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), mat);
  mesh.position.y = 0.4;
  g.add(mesh);
  g.userData.pickup = kind;
  return g;
}

export type CaveLevelVisual = 'upper' | 'middle' | 'lower';

interface LevelPalette {
  floor: number;
  wall: number;
  ceil: number;
  accent: number;
  accentEmissive: number;
  fogHint: number;
}

const LEVEL_PALETTES: Record<CaveLevelVisual, LevelPalette> = {
  upper: {
    floor: 0x4a4458,
    wall: 0x3a3548,
    ceil: 0x1a1525,
    accent: 0xc77dff,
    accentEmissive: 0x9b5de5,
    fogHint: 0x1a1028,
  },
  middle: {
    floor: 0x3d3a45,
    wall: 0x2c2838,
    ceil: 0x12101a,
    accent: 0x9b5de5,
    accentEmissive: 0x7b2cbf,
    fogHint: 0x140e22,
  },
  lower: {
    floor: 0x2a2e38,
    wall: 0x1e2430,
    ceil: 0x0a0e16,
    accent: 0x4cc9f0,
    accentEmissive: 0x0077b6,
    fogHint: 0x0a1420,
  },
};

export function makeCaveSegment(
  length: number,
  _lanes: number,
  type: string,
  seed: number,
  level: CaveLevelVisual = 'middle',
  floorYStart = 0,
  floorYEnd = 0,
  _narrowBias: -1 | 0 | 1 = 0
): THREE.Group {
  const g = new THREE.Group();
  const pal = LEVEL_PALETTES[level] ?? LEVEL_PALETTES.middle;
  // Always full 3-lane corridor — never shrink width with lanes/narrowBias
  const TRACK_LANES = 3;
  const LANE_W = 2.2;
  const floorW = TRACK_LANES * LANE_W + 0.4; // fixed 7.0
  const dy = floorYEnd - floorYStart;
  const incline = Math.atan2(-dy, length); // rotation.x so +z end is at floorYEnd relative to start

  const isSlide = type === 'waterslide';
  const isRamp = type === 'rampUp';
  const isCurveL = type === 'curveLeft';
  const isCurveR = type === 'curveRight';
  const turnSign = isCurveL ? -1 : isCurveR ? 1 : 0;

  /** Path center X at local t in [0,1] — walls follow this so corridor width stays constant */
  const pathXAt = (t: number) => turnSign * 1.6 * Math.sin(t * Math.PI);

  const floorMat = new THREE.MeshStandardMaterial({
    color: isSlide ? 0x48cae4 : pal.floor,
    roughness: isSlide ? 0.22 : isRamp ? 0.75 : level === 'lower' ? 0.55 : 0.9,
    metalness: isSlide ? 0.35 : level === 'lower' ? 0.15 : 0,
  });

  // Build floor as several slabs so incline + lateral bend read clearly
  const slices = Math.max(4, Math.floor(length / 4));
  const sliceLen = length / slices;
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const y0 = floorYStart + dy * t0;
    const y1 = floorYStart + dy * t1;
    const yMid = (y0 + y1) / 2;
    const zMid = -length / 2 + (i + 0.5) * sliceLen;
    const xBend = pathXAt(t0);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(floorW, 0.28, sliceLen + 0.05), floorMat);
    slab.position.set(xBend, yMid - 0.14, zMid);
    if (isRamp || isSlide) {
      slab.rotation.x = incline;
    }
    if (turnSign) {
      slab.rotation.y = -turnSign * 0.18;
    }
    slab.receiveShadow = true;
    g.add(slab);
  }

  // Open-top cave: jagged side walls only (no ceiling).
  // Inner wall face stays at ±floorW/2 from path center — never pinches inward.
  const wallMat = new THREE.MeshStandardMaterial({
    color: pal.wall,
    roughness: 0.92,
    metalness: 0.05,
  });
  const wallBaseY = (floorYStart + floorYEnd) / 2;
  const halfCorridor = floorW / 2;
  const cols = Math.max(3, Math.floor(length / 5));
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < cols; i++) {
      const h = 3.2 + ((seed * 3 + i * 7 + side + 3) % 5) * 0.55;
      const w = 0.55 + ((seed + i) % 3) * 0.12;
      const d = length / cols + 0.08;
      const z = -length / 2 + (i + 0.5) * (length / cols);
      const t = (i + 0.5) / cols;
      const cx = pathXAt(t);
      // Center of wall column: half-width outside the corridor edge (+ outward stagger only)
      const outward = 0.08 + ((i % 2) * 0.1);
      const wallX = cx + side * (halfCorridor + w / 2 + outward);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(wallX, wallBaseY + h / 2 - 0.15, z);
      if (turnSign) {
        wall.rotation.y = -turnSign * 0.18 * side;
      }
      wall.castShadow = true;
      wall.receiveShadow = true;
      g.add(wall);
      // Extra rock only OUTSIDE the corridor (never toward the player)
      if ((seed + i + side) % 2 === 0) {
        const jutW = 0.35;
        const jut = new THREE.Mesh(
          new THREE.BoxGeometry(jutW, 0.5 + (i % 3) * 0.25, 0.45),
          wallMat
        );
        jut.position.set(
          cx + side * (halfCorridor + w + jutW / 2 + 0.05),
          wallBaseY + 1.1 + (i % 4) * 0.4,
          z
        );
        g.add(jut);
      }
    }
  }

  // Purple (left) + blue (right) crystal lights on the OUTER wall face
  const purpleMat = new THREE.MeshStandardMaterial({
    color: 0xc77dff,
    emissive: 0x9b5de5,
    emissiveIntensity: 0.95,
    roughness: 0.25,
    metalness: 0.15,
  });
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x4cc9f0,
    emissive: 0x00b4d8,
    emissiveIntensity: 0.95,
    roughness: 0.25,
    metalness: 0.15,
  });
  const crystalCount = Math.max(2, Math.floor(length / 9));
  for (let i = 0; i < crystalCount; i++) {
    const z = -length / 2 + 2.5 + i * (length / (crystalCount + 0.5));
    const t = (z + length / 2) / length;
    const cx = pathXAt(Math.min(1, Math.max(0, t)));
    const y = wallBaseY + 0.35 + ((seed + i) % 4) * 0.35;
    for (const side of [-1, 1] as const) {
      const matC = side < 0 ? purpleMat : blueMat;
      const cluster = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const crystal = new THREE.Mesh(
          new THREE.ConeGeometry(0.1 + k * 0.03, 0.45 + k * 0.18, 5),
          matC
        );
        crystal.position.set(k * 0.08 * side, k * 0.12, k * 0.05);
        crystal.rotation.z = side * (0.2 + k * 0.15);
        crystal.rotation.x = -0.2 + k * 0.1;
        cluster.add(crystal);
      }
      // Sit on the wall, just outside corridor edge
      cluster.position.set(cx + side * (halfCorridor + 0.2), y, z);
      g.add(cluster);
      const light = new THREE.PointLight(side < 0 ? 0xb388ff : 0x4cc9f0, 0.55, 8, 2);
      light.position.set(cx + side * (halfCorridor + 0.15), y + 0.3, z);
      g.add(light);
    }
  }

  // Wet floor patches catching crystal glow
  const wetMat = new THREE.MeshStandardMaterial({
    color: 0x2a2438,
    roughness: 0.2,
    metalness: 0.35,
    transparent: true,
    opacity: 0.55,
  });
  for (let i = 0; i < 2; i++) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.4 + (seed + i) % 3 * 0.12, 10), wetMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(
      ((i % 2) * 2 - 1) * 0.55,
      Math.min(floorYStart, floorYEnd) + 0.03,
      -length / 2 + 3 + i * (length / 3)
    );
    g.add(puddle);
  }

    if (isRamp) {
    // Ramp side rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.7 });
    for (const sx of [-floorW / 2 + 0.12, floorW / 2 - 0.12]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, length), railMat);
      rail.position.set(sx, (floorYStart + floorYEnd) / 2 + 0.15, 0);
      rail.rotation.x = incline;
      g.add(rail);
    }
  }

  if (isSlide) {
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.35, metalness: 0.4 });
    for (const sx of [-floorW / 2 + 0.15, floorW / 2 - 0.15]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, length), railMat);
      rail.position.set(sx, (floorYStart + floorYEnd) / 2 + 0.25, 0);
      rail.rotation.x = incline;
      g.add(rail);
    }
    // Splash streaks
    const splash = new THREE.Mesh(
      new THREE.BoxGeometry(floorW * 0.98, 0.06, length * 0.98),
      new THREE.MeshStandardMaterial({
        color: 0x90e0ef,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
      })
    );
    splash.position.set(0, (floorYStart + floorYEnd) / 2 + 0.05, 0);
    splash.rotation.x = incline;
    g.add(splash);
  }

  // Turn chevrons painted on floor for readability
  if (turnSign) {
    const chevMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0xaa8800,
      emissiveIntensity: 0.4,
    });
    for (let i = 0; i < 3; i++) {
      const chev = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 3), chevMat);
      const t = 0.25 + i * 0.2;
      chev.rotation.x = -Math.PI / 2;
      chev.rotation.z = turnSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      chev.position.set(
        turnSign * 0.4 * Math.sin(t * Math.PI),
        floorYStart + dy * t + 0.05,
        -length / 2 + t * length
      );
      g.add(chev);
    }
  }

  g.userData.lanes = TRACK_LANES;
  g.userData.length = length;
  g.userData.type = type;
  g.userData.level = level;
  g.userData.floorYStart = floorYStart;
  g.userData.floorYEnd = floorYEnd;
  return g;
}
