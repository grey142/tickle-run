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
  // Half-block footprint visually
  const mat = new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: 0.5,
    transparent: true,
    opacity: 0.85,
    emissive: def.color,
    emissiveIntensity: 0.25,
  });

  if (kind === 'blackPit') {
    // Long black void in the floor — no scale shrink; depth is the danger
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
    const hole = new THREE.Mesh(
      new THREE.BoxGeometry(def.footprint, 0.12, def.depth),
      holeMat
    );
    hole.position.y = -0.04;
    g.add(hole);
    // Inner darker well
    const well = new THREE.Mesh(
      new THREE.BoxGeometry(def.footprint * 0.85, 1.2, def.depth * 0.9),
      holeMat
    );
    well.position.y = -0.65;
    g.add(well);
    // Rim
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
  } else if (kind === 'giggleGas') {
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + i * 0.05, 8, 8), mat);
      puff.position.set((i % 2) * 0.4 - 0.2, 0.4 + i * 0.25, (i > 1 ? 0.2 : -0.1));
      g.add(puff);
    }
  } else if (kind === 'featherTrap') {
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 5), mat);
      const a = (i / 6) * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.4, 0.4, Math.sin(a) * 0.4);
      f.rotation.z = Math.cos(a);
      g.add(f);
    }
  } else {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, def.height, 10), mat);
    m.position.y = def.height / 2;
    g.add(m);
  }

  g.userData.kind = kind;
  g.userData.footprint = def.footprint;
  g.userData.depth = def.depth;
  g.scale.setScalar(0.7);
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
  lanes: number,
  type: string,
  seed: number,
  level: CaveLevelVisual = 'middle',
  floorYStart = 0,
  floorYEnd = 0,
  narrowBias: -1 | 0 | 1 = 0
): THREE.Group {
  const g = new THREE.Group();
  const pal = LEVEL_PALETTES[level] ?? LEVEL_PALETTES.middle;
  const floorW = lanes * 2.2 + 0.4;
  // Shift narrow sections so the missing lane is on one side (no centered hallway)
  const xShift = narrowBias * (2.2 / 2);
  const dy = floorYEnd - floorYStart;
  const incline = Math.atan2(-dy, length); // rotation.x so +z end is at floorYEnd relative to start

  const isSlide = type === 'waterslide';
  const isRamp = type === 'rampUp';
  const isCurveL = type === 'curveLeft';
  const isCurveR = type === 'curveRight';
  const turnSign = isCurveL ? -1 : isCurveR ? 1 : 0;

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
    // Lateral bend for curves: path drifts toward the turn direction through the segment
    const xBend = turnSign * 1.6 * Math.sin(t0 * Math.PI);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(floorW, 0.28, sliceLen + 0.05), floorMat);
    slab.position.set(xBend + xShift, yMid - 0.14, zMid);
    if (isRamp || isSlide) {
      slab.rotation.x = incline;
    }
    if (turnSign) {
      slab.rotation.y = -turnSign * 0.18;
    }
    slab.receiveShadow = true;
    g.add(slab);
  }

  // Open-top cave: jagged side walls only (no ceiling)
  const wallMat = new THREE.MeshStandardMaterial({
    color: pal.wall,
    roughness: 0.92,
    metalness: 0.05,
  });
  const wallBaseY = (floorYStart + floorYEnd) / 2;
  for (const side of [-1, 1] as const) {
    const baseX = side * (floorW / 2 + 0.35) + xShift;
    const bulge = turnSign ? side * turnSign * 0.55 : 0;
    // Stack uneven rock columns for a canyon look
    const cols = Math.max(3, Math.floor(length / 5));
    for (let i = 0; i < cols; i++) {
      const h = 3.2 + ((seed * 3 + i * 7 + side + 3) % 5) * 0.55;
      const w = 0.55 + ((seed + i) % 3) * 0.12;
      const d = length / cols + 0.08;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      const z = -length / 2 + (i + 0.5) * (length / cols);
      wall.position.set(baseX + bulge * 0.45 + side * ((i % 2) * 0.12), wallBaseY + h / 2 - 0.15, z);
      if (turnSign) {
        wall.rotation.y = -turnSign * 0.18 * side;
      }
      wall.castShadow = true;
      wall.receiveShadow = true;
      g.add(wall);
      // Extra jutting rock
      if ((seed + i + side) % 2 === 0) {
        const jut = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.5 + (i % 3) * 0.25, 0.45),
          wallMat
        );
        jut.position.set(baseX - side * 0.25, wallBaseY + 1.1 + (i % 4) * 0.4, z);
        g.add(jut);
      }
    }
  }

  // Optional fake junction spur (visual only)
  if ((seed % 7 === 0) && type === 'straight' && lanes >= 2) {
    const spurSide = seed % 2 === 0 ? -1 : 1;
    const spur = new THREE.Mesh(new THREE.BoxGeometry(floorW * 0.55, 0.22, 4), floorMat);
    spur.position.set(spurSide * (floorW * 0.65), floorYStart - 0.05, length * 0.15);
    spur.rotation.y = spurSide * 0.55;
    g.add(spur);
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 3.2), wallMat);
    block.position.set(spurSide * (floorW * 0.95), floorYStart + 1.1, length * 0.15);
    g.add(block);
  }

  // Purple (left) + blue (right) crystal lights on stone
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
      cluster.position.set(side * (floorW / 2 - 0.15), y, z);
      g.add(cluster);
      // Soft colored point light soaking the stone
      const light = new THREE.PointLight(side < 0 ? 0xb388ff : 0x4cc9f0, 0.55, 8, 2);
      light.position.set(side * (floorW / 2 - 0.4), y + 0.3, z);
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

  g.userData.lanes = lanes;
  g.userData.length = length;
  g.userData.type = type;
  g.userData.level = level;
  g.userData.floorYStart = floorYStart;
  g.userData.floorYEnd = floorYEnd;
  return g;
}
