// Procedural pig mesh — built from primitive cubes for that retro look.
// Used both for the local first-person body shadow and the remote ally.

import * as THREE from "three";

const PINK = 0xf3a8c0;
const PINK_DARK = 0xc77093;
const SNOUT = 0xa85a78;
const HOOF = 0x4a2030;

function box(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.05,
  });
  return new THREE.Mesh(geo, mat);
}

export function makePig({ tinted = false } = {}) {
  const root = new THREE.Group();
  const tint = tinted ? PINK_DARK : PINK;

  const body = box(1.1, 0.8, 1.6, tint);
  body.position.y = 0.7;
  body.castShadow = true;
  root.add(body);

  const head = box(0.85, 0.7, 0.7, tint);
  head.position.set(0, 0.95, 1.05);
  head.castShadow = true;
  root.add(head);

  const snout = box(0.45, 0.35, 0.25, SNOUT);
  snout.position.set(0, 0.85, 1.45);
  root.add(snout);

  for (const dx of [-0.13, 0.13]) {
    const eye = box(0.08, 0.08, 0.05, 0x000000);
    eye.position.set(dx, 1.08, 1.4);
    root.add(eye);
  }

  for (const dx of [-0.28, 0.28]) {
    const ear = box(0.18, 0.22, 0.06, tint);
    ear.position.set(dx, 1.4, 0.9);
    ear.rotation.z = dx > 0 ? -0.3 : 0.3;
    root.add(ear);
  }

  for (const [dx, dz] of [
    [-0.4, -0.55],
    [0.4, -0.55],
    [-0.4, 0.55],
    [0.4, 0.55],
  ]) {
    const leg = box(0.22, 0.6, 0.22, HOOF);
    leg.position.set(dx, 0.3, dz);
    root.add(leg);
  }

  const tail = box(0.1, 0.1, 0.35, tint);
  tail.position.set(0, 0.95, -0.95);
  root.add(tail);

  return root;
}
