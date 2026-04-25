// Mirrors the server's bot list as Three.js meshes. Bots are scary
// dark humanoids with red eyes that drift toward the players.

import * as THREE from "three";

const BOT_MAT = new THREE.MeshStandardMaterial({
  color: 0x1a2418,
  roughness: 0.95,
});
const EYE_MAT = new THREE.MeshBasicMaterial({ color: 0xff2030 });

function makeBotMesh(id) {
  const root = new THREE.Group();
  root.userData.botId = id;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.5), BOT_MAT);
  body.position.y = 0.85;
  body.castShadow = true;
  body.userData.botId = id;
  root.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), BOT_MAT);
  head.position.y = 1.85;
  head.castShadow = true;
  head.userData.botId = id;
  root.add(head);

  for (const dx of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), EYE_MAT);
    eye.position.set(dx, 1.92, 0.27);
    eye.userData.botId = id;
    root.add(eye);
  }

  for (const dx of [-0.45, 0.45]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.18), BOT_MAT);
    arm.position.set(dx, 1.0, 0.15);
    arm.rotation.x = -0.6;
    arm.castShadow = true;
    arm.userData.botId = id;
    root.add(arm);
  }

  for (const dx of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.22), BOT_MAT);
    leg.position.set(dx, 0.2, 0);
    leg.castShadow = true;
    leg.userData.botId = id;
    root.add(leg);
  }

  return root;
}

export class Bots {
  constructor(scene) {
    this.scene = scene;
    this.byId = new Map();
    this.targets = new Map();
  }

  sync(botList) {
    const seen = new Set();
    const now = performance.now() / 1000;
    for (const b of botList) {
      seen.add(b.id);
      let mesh = this.byId.get(b.id);
      if (!mesh) {
        mesh = makeBotMesh(b.id);
        mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
        this.scene.add(mesh);
        this.byId.set(b.id, mesh);
      }
      this.targets.set(b.id, {
        x: b.pos[0],
        y: b.pos[1],
        z: b.pos[2],
        t: now,
      });
    }
    for (const [id, mesh] of this.byId) {
      if (!seen.has(id)) {
        this.scene.remove(mesh);
        mesh.traverse((c) => c.geometry?.dispose?.());
        this.byId.delete(id);
        this.targets.delete(id);
      }
    }
  }

  update(dt) {
    for (const [id, mesh] of this.byId) {
      const t = this.targets.get(id);
      if (!t) continue;
      mesh.position.x += (t.x - mesh.position.x) * Math.min(1, dt * 12);
      mesh.position.z += (t.z - mesh.position.z) * Math.min(1, dt * 12);
      const dx = t.x - mesh.position.x;
      const dz = t.z - mesh.position.z;
      if (Math.hypot(dx, dz) > 0.01) {
        mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  allMeshes() {
    const arr = [];
    for (const root of this.byId.values()) {
      root.traverse((c) => {
        if (c.isMesh) arr.push(c);
      });
    }
    return arr;
  }
}
