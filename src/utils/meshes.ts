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
    const m = new THREE.Mesh(new THREE.BoxGeometry(def.width, def.height, def.depth), mat);
    m.position.y = def.height / 2;
    g.add(m);
  } else if (kind === 'tree') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.2, 8), mat);
    trunk.position.y = 0.6;
    g.add(trunk);
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.05 })
    );
    top.position.y = 1.35;
    g.add(top);
  } else if (kind === 'slideRock') {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32), mat);
    m.position.y = def.height / 2;
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

  if (kind === 'giggleGas') {
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
    floor: 0x8d6e63,
    wall: 0x5c6b7a,
    ceil: 0x4a5568,
    accent: 0x81c784,
    accentEmissive: 0x2e7d32,
    fogHint: 0xc8e6c9,
  },
  middle: {
    floor: 0x6c584c,
    wall: 0x3d405b,
    ceil: 0x2b2d42,
    accent: 0x9b5de5,
    accentEmissive: 0x5a2d8a,
    fogHint: 0x1a1a2e,
  },
  lower: {
    floor: 0x2d3436,
    wall: 0x1e272e,
    ceil: 0x0f1419,
    accent: 0x48cae4,
    accentEmissive: 0x0077b6,
    fogHint: 0x0a1628,
  },
};

export function makeCaveSegment(
  length: number,
  lanes: number,
  type: string,
  seed: number,
  level: CaveLevelVisual = 'middle',
  floorYStart = 0,
  floorYEnd = 0
): THREE.Group {
  const g = new THREE.Group();
  const pal = LEVEL_PALETTES[level] ?? LEVEL_PALETTES.middle;
  const floorW = lanes * 2.2 + 0.4;
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

  // Side walls / cave — angled on curves so the turn is readable ahead
  const wallMat = new THREE.MeshStandardMaterial({
    color: pal.wall,
    roughness: level === 'lower' ? 0.7 : 0.95,
    metalness: level === 'lower' ? 0.1 : 0,
  });
  const wallH = 4.5;
  for (const side of [-1, 1] as const) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.45, wallH, length), wallMat);
    const baseX = side * (floorW / 2 + 0.2);
    // Outer wall of a curve bulges; inner wall tucks in
    const bulge = turnSign ? side * turnSign * 0.55 : 0;
    wall.position.set(baseX + bulge * 0.5, wallH / 2 - 0.2 + (floorYStart + floorYEnd) / 2, 0);
    if (turnSign) {
      wall.rotation.y = -turnSign * 0.22 * side * (side === turnSign ? 1.2 : 0.6);
    }
    g.add(wall);
  }

  // Optional fake junction spur (visual only — never a hard stop)
  if ((seed % 7 === 0) && type === 'straight' && lanes >= 2) {
    const spurSide = seed % 2 === 0 ? -1 : 1;
    const spurMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 1 });
    const spur = new THREE.Mesh(new THREE.BoxGeometry(floorW * 0.55, 0.22, 4), floorMat);
    spur.position.set(spurSide * (floorW * 0.65), floorYStart - 0.05, length * 0.15);
    spur.rotation.y = spurSide * 0.55;
    g.add(spur);
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 3.2), spurMat);
    block.position.set(spurSide * (floorW * 0.95), floorYStart + 1.0, length * 0.15);
    g.add(block);
  }

  // Ceiling
  const ceilMat = new THREE.MeshStandardMaterial({ color: pal.ceil, roughness: 1 });
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(floorW + 1.4, 0.3, length), ceilMat);
  ceil.position.y = wallH - 0.1 + (floorYStart + floorYEnd) / 2;
  g.add(ceil);

  // Level-specific props
  const accentMat = new THREE.MeshStandardMaterial({
    color: pal.accent,
    emissive: pal.accentEmissive,
    emissiveIntensity: level === 'upper' ? 0.25 : level === 'lower' ? 0.45 : 0.35,
  });

  if (level === 'upper') {
    // Brighter roots hanging from ceiling
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
    for (let i = 0; i < 4; i++) {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.2 + (seed + i) % 3 * 0.3, 5), rootMat);
      const side = i % 2 === 0 ? -1 : 1;
      root.position.set(
        side * (floorW / 2 - 0.35),
        wallH - 0.9 + floorYStart,
        -length / 2 + 2 + i * (length / 5)
      );
      root.rotation.z = side * 0.25;
      g.add(root);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), accentMat);
      leaf.position.copy(root.position);
      leaf.position.y -= 0.55;
      g.add(leaf);
    }
  } else if (level === 'lower') {
    // Wet puddles + drips
    const wetMat = new THREE.MeshStandardMaterial({
      color: 0x14746f,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7,
    });
    for (let i = 0; i < 3; i++) {
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.35 + (seed + i) % 3 * 0.1, 10), wetMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(
        ((i % 3) - 1) * 0.7,
        Math.min(floorYStart, floorYEnd) + 0.02,
        -length / 2 + 3 + i * (length / 4)
      );
      g.add(puddle);
    }
    for (let i = 0; i < 3; i++) {
      const drip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 5), accentMat);
      drip.position.set(
        (i % 2 === 0 ? -1 : 1) * (floorW / 2 - 0.4),
        wallH - 1.2 + floorYStart,
        -length / 2 + 4 + i * (length / 4)
      );
      g.add(drip);
    }
  } else {
    // Middle: crystals / moss
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), accentMat);
      const side = i % 2 === 0 ? -1 : 1;
      c.position.set(
        side * (floorW / 2 - 0.3),
        floorYStart + 0.3 + ((seed + i) % 3) * 0.4,
        -length / 2 + 2 + i * (length / 4)
      );
      g.add(c);
    }
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
