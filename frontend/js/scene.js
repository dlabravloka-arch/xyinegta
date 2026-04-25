// Three.js scene/world setup: ground, walls, props, lighting, fog.
import * as THREE from "three";

export const ARENA_HALF = 35;

export function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14080b);
  scene.fog = new THREE.Fog(0x14080b, 25, 75);

  const hemi = new THREE.HemisphereLight(0xffd9c8, 0x2a0d12, 0.55);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0xfff3d8, 0.85);
  moon.position.set(20, 35, 12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -ARENA_HALF;
  moon.shadow.camera.right = ARENA_HALF;
  moon.shadow.camera.top = ARENA_HALF;
  moon.shadow.camera.bottom = -ARENA_HALF;
  scene.add(moon);

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2),
    new THREE.MeshStandardMaterial({ color: 0x2a3520, roughness: 1.0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // grid lines for orientation
  const grid = new THREE.GridHelper(
    ARENA_HALF * 2,
    20,
    0x4a3320,
    0x2c2010
  );
  grid.position.y = 0.02;
  scene.add(grid);

  // perimeter walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a2218, roughness: 0.95 });
  const wallH = 4;
  const wallT = 1;
  const len = ARENA_HALF * 2;
  for (const [x, z, w, d] of [
    [0, ARENA_HALF, len, wallT],
    [0, -ARENA_HALF, len, wallT],
    [ARENA_HALF, 0, wallT, len],
    [-ARENA_HALF, 0, wallT, len],
  ]) {
    const w1 = new THREE.Mesh(
      new THREE.BoxGeometry(w, wallH, d),
      wallMat
    );
    w1.position.set(x, wallH / 2, z);
    w1.castShadow = true;
    w1.receiveShadow = true;
    scene.add(w1);
  }

  // scattered cover crates and barrels
  const rng = mulberry32(1234);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 0.7, metalness: 0.4 });
  for (let i = 0; i < 24; i++) {
    const x = (rng() * 2 - 1) * (ARENA_HALF - 4);
    const z = (rng() * 2 - 1) * (ARENA_HALF - 4);
    if (Math.hypot(x, z) < 4) continue;
    if (rng() < 0.5) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), crateMat);
      c.position.set(x, 0.7, z);
      c.rotation.y = rng() * Math.PI;
      c.castShadow = true;
      c.receiveShadow = true;
      scene.add(c);
    } else {
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 1.4, 16),
        barrelMat
      );
      b.position.set(x, 0.7, z);
      b.castShadow = true;
      b.receiveShadow = true;
      scene.add(b);
    }
  }

  // distant menacing trees
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x101410, roughness: 1 });
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const r = ARENA_HALF + 4 + rng() * 6;
    const tree = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 5, 6),
      treeMat
    );
    tree.position.set(Math.cos(angle) * r, 2.5, Math.sin(angle) * r);
    scene.add(tree);
  }

  return { scene };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
