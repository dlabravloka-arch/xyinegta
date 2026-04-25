// Entry point — wires up scene, network, controls, weapons, HUD, death effect.

import * as THREE from "three";
import { buildScene, ARENA_HALF } from "./scene.js";
import { FPSControls } from "./controls.js";
import { Net } from "./network.js";
import { Bots } from "./bots.js";
import { WEAPONS, WeaponView, fireWeapon } from "./weapons.js";
import { makePig } from "./pig.js";
import { AudioFx } from "./audio.js";

const $ = (id) => document.getElementById(id);

const menu = $("menu");
const hud = $("hud");
const screamer = $("screamer");
const gameover = $("gameover");
const status = $("status");

const nameInput = $("name");
const serverInput = $("server");
const playBtn = $("play");

// Auto-detect default server URL
const params = new URLSearchParams(location.search);
const defaultServer =
  params.get("server") ||
  window.GAME_SERVER ||
  (location.protocol === "https:"
    ? "wss://" + location.host + "/ws"
    : "ws://" + location.host + "/ws");
serverInput.value = defaultServer;

// Three.js core
const canvas = $("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);
const { scene } = buildScene();
scene.add(camera);

const controls = new FPSControls(camera, canvas);
const weaponView = new WeaponView(camera);
const bots = new Bots(scene);
const net = new Net();
const audio = new AudioFx();

// remote ally pig
const allyPig = makePig({ tinted: true });
allyPig.visible = false;
scene.add(allyPig);

// hit markers
const hitMarkers = [];
function spawnHitMarker(point) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff5566 })
  );
  m.position.copy(point);
  m.userData.life = 0.25;
  scene.add(m);
  hitMarkers.push(m);
}

function tickMarkers(dt) {
  for (let i = hitMarkers.length - 1; i >= 0; i--) {
    const m = hitMarkers[i];
    m.userData.life -= dt;
    m.scale.multiplyScalar(1 - dt * 4);
    if (m.userData.life <= 0) {
      scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
      hitMarkers.splice(i, 1);
    }
  }
}

// State
let me = null; // server-assigned id
let myWeapon = "rifle";
let myHp = 1;
let alive = true;
let allyState = null;
let lastShot = 0;
let mouseDown = false;
let waveValue = 1;
let kills = 0;
let lastSyncSent = 0;

// HUD weapon selection
function setWeapon(id) {
  if (!WEAPONS[id]) return;
  myWeapon = id;
  weaponView.show(id);
  for (const el of document.querySelectorAll(".weapon")) {
    el.classList.toggle("active", el.dataset.key === keyForWeapon(id));
  }
}

function keyForWeapon(id) {
  return { rifle: "1", shotgun: "2", knife: "3" }[id];
}

document.addEventListener("keydown", (e) => {
  if (!alive) return;
  if (e.code === "Digit1") setWeapon("rifle");
  if (e.code === "Digit2") setWeapon("shotgun");
  if (e.code === "Digit3") setWeapon("knife");
});

canvas.addEventListener("mousedown", () => {
  if (!alive) return;
  if (!controls.locked) controls.requestLock();
  mouseDown = true;
  attemptFire();
});
window.addEventListener("mouseup", () => {
  mouseDown = false;
});

function attemptFire() {
  const now = performance.now() / 1000;
  const w = WEAPONS[myWeapon];
  if (now - lastShot < w.cooldown) return;
  lastShot = now;
  weaponView.flash();
  const hits = fireWeapon({
    camera,
    weaponId: myWeapon,
    bots,
    net,
    audio,
    onHit: (p) => {
      spawnHitMarker(p);
      audio.hit();
    },
  });
  if (hits.length === 0 && myWeapon === "knife") {
    // small visual swipe even on miss
  }
}

// Network handlers
net.addEventListener("message", (ev) => {
  const msg = ev.detail;
  if (msg.type === "welcome") {
    me = msg.you;
    controls.position.set(msg.spawn[0], 1.55, msg.spawn[2]);
    status.textContent = `Подключено к комнате ${msg.room}`;
  } else if (msg.type === "state") {
    waveValue = msg.wave;
    kills = msg.bots_killed;
    bots.sync(msg.bots);
    let ally = null;
    let myEntry = null;
    for (const p of msg.players) {
      if (p.id === me) myEntry = p;
      else ally = p;
    }
    if (myEntry) {
      const wasAlive = alive;
      myHp = myEntry.hp;
      alive = myEntry.alive;
      if (wasAlive && !alive) onDeath();
    }
    if (ally) {
      allyState = ally;
      allyPig.visible = ally.alive;
      allyPig.position.set(ally.pos[0], 0, ally.pos[2]);
      allyPig.rotation.y = ally.yaw;
      $("hud-ally").textContent = `${ally.name} (${ally.alive ? "жив" : "мёртв"})`;
    } else {
      allyState = null;
      allyPig.visible = false;
      $("hud-ally").textContent = "—";
    }
    $("hud-wave").textContent = waveValue;
    $("hud-kills").textContent = kills;
    $("hud-hp").textContent = myHp;
  } else if (msg.type === "bot_killed") {
    // could play a kill sound here
  } else if (msg.type === "player_killed") {
    if (msg.victim === me) onDeath();
  }
});
net.addEventListener("close", () => {
  status.textContent = "Соединение потеряно";
});

// Death effect: full-screen screamer + slow fade to GAME OVER
function onDeath() {
  alive = false;
  document.exitPointerLock?.();
  audio.scream();
  screamer.classList.remove("hidden");
  setTimeout(() => {
    screamer.classList.add("hidden");
    gameover.classList.remove("hidden");
    requestAnimationFrame(() => gameover.classList.add("show"));
  }, 1700);
}

// Resize
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// Main loop
let last = performance.now();
function tick() {
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (alive) controls.update(dt);
  weaponView.update(dt);
  bots.update(dt);
  tickMarkers(dt);

  if (
    mouseDown &&
    alive &&
    WEAPONS[myWeapon].auto
  ) {
    attemptFire();
  }

  // periodic state push (~15 Hz)
  if (net.connected && alive && now - lastSyncSent > 60) {
    lastSyncSent = now;
    net.send({
      type: "input",
      pos: [controls.position.x, 0, controls.position.z],
      yaw: controls.yaw,
      weapon: myWeapon,
    });
  }

  renderer.render(scene, camera);
}
tick();

// Connect flow
playBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim() || "Pig";
  const url = serverInput.value.trim();
  if (!url) {
    status.textContent = "Введите адрес сервера";
    return;
  }
  status.textContent = "Соединение...";
  try {
    await net.connect(url, name);
  } catch (err) {
    status.textContent = "Не удалось подключиться: " + (err?.message || err);
    return;
  }
  menu.classList.add("hidden");
  hud.classList.remove("hidden");
  setWeapon("rifle");
  controls.requestLock();
});
