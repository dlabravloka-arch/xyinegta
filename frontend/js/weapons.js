// Weapon definitions, view-models, muzzle flashes, fire logic.

import * as THREE from "three";

export const WEAPONS = {
  rifle: {
    name: "Автомат",
    cooldown: 0.1,
    damage: 12,
    pellets: 1,
    spread: 0.012,
    range: 60,
    auto: true,
  },
  shotgun: {
    name: "Дробовик",
    cooldown: 0.65,
    damage: 9,
    pellets: 7,
    spread: 0.10,
    range: 25,
    auto: false,
  },
  knife: {
    name: "Нож",
    cooldown: 0.35,
    damage: 60,
    pellets: 1,
    spread: 0,
    range: 2.4,
    auto: false,
  },
};

export class WeaponView {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.camera.add(this.group);
    this.models = {
      rifle: this._buildRifle(),
      shotgun: this._buildShotgun(),
      knife: this._buildKnife(),
    };
    for (const m of Object.values(this.models)) {
      m.visible = false;
      this.group.add(m);
    }
    this.muzzle = new THREE.PointLight(0xffd07a, 0, 6, 2);
    this.group.add(this.muzzle);
    this.current = "rifle";
    this.show("rifle");
    this._kick = 0;
  }

  show(id) {
    if (!this.models[id]) return;
    this.models[this.current].visible = false;
    this.current = id;
    this.models[id].visible = true;
  }

  flash() {
    this.muzzle.intensity = 3.5;
    this._kick = 0.18;
  }

  update(dt) {
    this.muzzle.intensity = Math.max(0, this.muzzle.intensity - dt * 9);
    this._kick = Math.max(0, this._kick - dt * 1.6);
    this.group.position.set(0.34, -0.32, -0.55 + this._kick * 0.5);
    this.group.rotation.set(-this._kick * 0.6, 0, 0);
  }

  _buildRifle() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.16, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.6 })
    );
    body.position.z = -0.05;
    g.add(body);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.4 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.45);
    g.add(barrel);
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.22, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    mag.position.set(0, -0.18, 0);
    g.add(mag);
    return g;
  }

  _buildShotgun() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.18, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x402214, roughness: 0.7 })
    );
    body.position.z = -0.1;
    g.add(body);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10),
      new THREE.MeshStandardMaterial({ color: 0x101010, metalness: 0.7, roughness: 0.3 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.06, -0.55);
    g.add(barrel);
    return g;
  }

  _buildKnife() {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.09, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x402010 })
    );
    g.add(handle);
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.55, 4),
      new THREE.MeshStandardMaterial({
        color: 0xd9dce6,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    blade.rotation.x = -Math.PI / 2;
    blade.rotation.z = Math.PI / 4;
    blade.position.set(0, 0, -0.4);
    g.add(blade);
    return g;
  }
}

const _ray = new THREE.Raycaster();
const _from = new THREE.Vector3();
const _dir = new THREE.Vector3();

export function fireWeapon({
  camera,
  weaponId,
  bots,
  net,
  audio,
  onHit,
}) {
  const w = WEAPONS[weaponId];
  const out = [];
  for (let i = 0; i < w.pellets; i++) {
    camera.getWorldPosition(_from);
    camera.getWorldDirection(_dir);
    if (w.spread) {
      _dir.x += (Math.random() - 0.5) * w.spread * 2;
      _dir.y += (Math.random() - 0.5) * w.spread * 2;
      _dir.z += (Math.random() - 0.5) * w.spread * 2;
      _dir.normalize();
    }
    _ray.set(_from, _dir);
    _ray.far = w.range;
    const meshes = bots.allMeshes();
    const hits = _ray.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const hit = hits[0];
      const botId = hit.object.userData.botId;
      if (botId) {
        net.send({ type: "hit", bot: botId, weapon: weaponId });
        if (onHit) onHit(hit.point);
        out.push({ point: hit.point.clone(), botId });
      }
    }
  }
  if (audio) audio.fire(weaponId);
  return out;
}
