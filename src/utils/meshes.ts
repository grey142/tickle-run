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

  g.scale.setScalar(1.15);
  return g;
}

export function makeObstacleMesh(kind: HazardKind): THREE.Group {
  const def = OBSTACLES[kind];
  const g = new THREE.Group();
  g.name = kind;
  const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.8 });

  if (kind === 'log') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, def.width, 10), mat);
    m.rotation.z = Math.PI / 2;
    m.position.y = 0.28;
    g.add(m);
  } else if (kind === 'vines') {
    for (let i = -1; i <= 1; i++) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, def.height, 6), mat);
      v.position.set(i * 0.45, 1.5, 0);
      g.add(v);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mat);
      leaf.position.set(i * 0.45, 1.0, 0.1);
      g.add(leaf);
    }
  } else if (kind === 'laneWall') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(def.width, def.height, def.depth), mat);
    m.position.y = def.height / 2;
    g.add(m);
  } else if (kind === 'tree') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 8), mat);
    trunk.position.y = 0.7;
    g.add(trunk);
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.05 })
    );
    top.position.y = 1.7;
    g.add(top);
  } else if (kind === 'slideRock') {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), mat);
    m.position.y = 0.45;
    g.add(m);
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(def.width, def.height, def.depth), mat);
    m.position.y = 1.3;
    g.add(m);
  }

  g.userData.kind = kind;
  return g;
}

export function makeTrapMesh(kind: TrapKind): THREE.Group {
  const def = TRAPS[kind];
  const g = new THREE.Group();
  g.name = kind;
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

export function makeCaveSegment(
  length: number,
  lanes: number,
  type: string,
  seed: number
): THREE.Group {
  const g = new THREE.Group();
  const floorW = lanes * 2.2 + 0.4;
  const floorMat = new THREE.MeshStandardMaterial({
    color: type === 'waterslide' ? 0x48cae4 : 0x6c584c,
    roughness: type === 'waterslide' ? 0.25 : 0.9,
    metalness: type === 'waterslide' ? 0.3 : 0,
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(floorW, 0.25, length), floorMat);
  floor.position.y = -0.125;
  floor.receiveShadow = true;
  g.add(floor);

  // Side walls / cave
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d405b, roughness: 0.95 });
  const wallH = 4.5;
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, length), wallMat);
  left.position.set(-floorW / 2 - 0.15, wallH / 2 - 0.2, 0);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, length), wallMat);
  right.position.set(floorW / 2 + 0.15, wallH / 2 - 0.2, 0);
  g.add(left, right);

  // Ceiling arches
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 1 });
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(floorW + 1.2, 0.3, length), ceilMat);
  ceil.position.y = wallH - 0.1;
  g.add(ceil);

  // Decorative crystals / moss by seed
  const crystalMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0x9b5de5 : 0x00bbf9,
    emissive: seed % 2 === 0 ? 0x5a2d8a : 0x006688,
    emissiveIntensity: 0.35,
  });
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), crystalMat);
    const side = i % 2 === 0 ? -1 : 1;
    c.position.set(side * (floorW / 2 - 0.3), 0.3 + (seed + i) % 3 * 0.4, -length / 2 + 2 + i * (length / 4));
    g.add(c);
  }

  if (type === 'rampUp') {
    floor.rotation.x = -0.12;
    floor.position.y += 0.4;
  }
  if (type === 'waterslide') {
    floor.rotation.x = 0.1;
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, roughness: 0.4 });
    for (const sx of [-floorW / 2 + 0.15, floorW / 2 - 0.15]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, length), railMat);
      rail.position.set(sx, 0.2, 0);
      g.add(rail);
    }
  }

  g.userData.lanes = lanes;
  g.userData.length = length;
  g.userData.type = type;
  return g;
}
