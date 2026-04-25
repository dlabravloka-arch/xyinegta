// Pointer-lock based first-person controls.
// Keeps camera at pig eye height; movement constrained to arena bounds.

import * as THREE from "three";
import { ARENA_HALF } from "./scene.js";

const EYE_HEIGHT = 1.55;
const SPEED = 5.5;
const SPRINT = 1.6;

export class FPSControls {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.yaw = 0;
    this.pitch = 0;
    this.position = new THREE.Vector3(0, EYE_HEIGHT, 0);
    this.keys = new Set();
    this.locked = false;

    this._onMove = (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
    };
    this._onLock = () => {
      this.locked = document.pointerLockElement === dom;
    };
    this._onKeyDown = (e) => {
      this.keys.add(e.code);
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    document.addEventListener("mousemove", this._onMove);
    document.addEventListener("pointerlockchange", this._onLock);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  requestLock() {
    this.dom.requestPointerLock?.();
  }

  update(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    if (this.keys.has("KeyW")) move.add(forward);
    if (this.keys.has("KeyS")) move.sub(forward);
    if (this.keys.has("KeyD")) move.add(right);
    if (this.keys.has("KeyA")) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize();
      const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? SPRINT : 1;
      move.multiplyScalar(SPEED * sprint * dt);
      this.position.add(move);
    }

    const lim = ARENA_HALF - 0.7;
    this.position.x = Math.max(-lim, Math.min(lim, this.position.x));
    this.position.z = Math.max(-lim, Math.min(lim, this.position.z));
    this.position.y = EYE_HEIGHT;

    this.camera.position.copy(this.position);
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(this.position.clone().add(dir));
  }

  dispose() {
    document.removeEventListener("mousemove", this._onMove);
    document.removeEventListener("pointerlockchange", this._onLock);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }
}
