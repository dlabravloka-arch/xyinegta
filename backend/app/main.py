"""Authoritative game server for the 2-player co-op pig shooter.

Players connect via a WebSocket. The server tracks bot AI, validates
hits, and broadcasts game state to both players ~20 times per second.
"""

from __future__ import annotations

import asyncio
import math
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import Literal

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Constants — tuned for a small co-op arena
# ---------------------------------------------------------------------------

TICK_HZ = 20
TICK_DT = 1.0 / TICK_HZ
ARENA_HALF = 35.0
MAX_PLAYERS_PER_ROOM = 2
BOT_SPAWN_INTERVAL = 3.0
INITIAL_BOTS = 4
MAX_BOTS = 18
BOT_SPEED = 2.6
BOT_ATTACK_RANGE = 1.6
BOT_ATTACK_COOLDOWN = 1.1
BOT_HP_BASE = 30
PLAYER_RADIUS = 0.6
BOT_RADIUS = 0.55

WEAPON_DAMAGE = {
    "rifle": 12,
    "shotgun": 9,  # per pellet, multi-pellet handled client-side
    "knife": 60,
}


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


@dataclass
class Vec3:
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

    def to_list(self) -> list[float]:
        return [self.x, self.y, self.z]


@dataclass
class Player:
    id: str
    name: str
    ws: WebSocket
    pos: Vec3 = field(default_factory=Vec3)
    yaw: float = 0.0
    weapon: Literal["rifle", "shotgun", "knife"] = "rifle"
    hp: int = 1
    alive: bool = True
    score: int = 0

    def to_public(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "pos": self.pos.to_list(),
            "yaw": self.yaw,
            "weapon": self.weapon,
            "hp": self.hp,
            "alive": self.alive,
            "score": self.score,
        }


@dataclass
class Bot:
    id: str
    pos: Vec3
    hp: int
    last_attack: float = 0.0

    def to_public(self) -> dict:
        return {"id": self.id, "pos": self.pos.to_list(), "hp": self.hp}


@dataclass
class Room:
    id: str
    players: dict[str, Player] = field(default_factory=dict)
    bots: dict[str, Bot] = field(default_factory=dict)
    started: bool = False
    game_over: bool = False
    last_bot_spawn: float = 0.0
    wave: int = 1
    bots_killed: int = 0

    def alive_players(self) -> list[Player]:
        return [p for p in self.players.values() if p.alive]


ROOMS: dict[str, Room] = {}
ROOMS_LOCK = asyncio.Lock()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _spawn_pos_for_player(index: int) -> Vec3:
    return Vec3(x=-3.0 + index * 6.0, y=0.0, z=0.0)


def _spawn_bot_pos() -> Vec3:
    angle = random.uniform(0, math.tau)
    radius = random.uniform(20.0, ARENA_HALF - 2.0)
    return Vec3(x=math.cos(angle) * radius, y=0.0, z=math.sin(angle) * radius)


async def _broadcast(room: Room, message: dict) -> None:
    dead: list[str] = []
    for pid, player in list(room.players.items()):
        try:
            await player.ws.send_json(message)
        except Exception:
            dead.append(pid)
    for pid in dead:
        room.players.pop(pid, None)


def _snapshot(room: Room) -> dict:
    return {
        "type": "state",
        "t": time.time(),
        "players": [p.to_public() for p in room.players.values()],
        "bots": [b.to_public() for b in room.bots.values()],
        "wave": room.wave,
        "bots_killed": room.bots_killed,
        "game_over": room.game_over,
        "started": room.started,
    }


async def _find_or_create_room() -> Room:
    async with ROOMS_LOCK:
        for room in ROOMS.values():
            if (
                len(room.players) < MAX_PLAYERS_PER_ROOM
                and not room.game_over
            ):
                return room
        room = Room(id=uuid.uuid4().hex[:8])
        ROOMS[room.id] = room
        for _ in range(INITIAL_BOTS):
            bot = Bot(id=uuid.uuid4().hex[:6], pos=_spawn_bot_pos(), hp=BOT_HP_BASE)
            room.bots[bot.id] = bot
        return room


# ---------------------------------------------------------------------------
# Game loop
# ---------------------------------------------------------------------------


async def _game_loop() -> None:
    """Single global loop driving every active room."""
    while True:
        start = time.time()
        async with ROOMS_LOCK:
            rooms = list(ROOMS.values())
        for room in rooms:
            await _tick_room(room, start)
        await asyncio.sleep(max(0.0, TICK_DT - (time.time() - start)))


async def _tick_room(room: Room, now: float) -> None:
    if not room.players:
        # idle room — let it sit until cleaned up
        return

    if not room.started and len(room.players) >= 1:
        room.started = True

    if room.game_over:
        return

    alive = room.alive_players()
    if not alive and room.players:
        room.game_over = True
        await _broadcast(room, _snapshot(room))
        return

    # --- bot AI ---------------------------------------------------------
    for bot in list(room.bots.values()):
        if not alive:
            break
        target = min(
            alive,
            key=lambda p: (p.pos.x - bot.pos.x) ** 2 + (p.pos.z - bot.pos.z) ** 2,
        )
        dx = target.pos.x - bot.pos.x
        dz = target.pos.z - bot.pos.z
        dist = math.hypot(dx, dz)
        if dist > BOT_ATTACK_RANGE:
            step = BOT_SPEED * TICK_DT
            if dist > 0:
                bot.pos.x += (dx / dist) * step
                bot.pos.z += (dz / dist) * step
        else:
            if now - bot.last_attack >= BOT_ATTACK_COOLDOWN:
                bot.last_attack = now
                # Pigs have 1 HP — any hit kills them.
                target.hp = 0
                target.alive = False
                await _broadcast(
                    room,
                    {
                        "type": "player_killed",
                        "victim": target.id,
                        "killer_bot": bot.id,
                    },
                )

    # --- bot spawning ---------------------------------------------------
    if (
        len(room.bots) < MAX_BOTS
        and now - room.last_bot_spawn >= BOT_SPAWN_INTERVAL
        and alive
    ):
        room.last_bot_spawn = now
        bot = Bot(
            id=uuid.uuid4().hex[:6],
            pos=_spawn_bot_pos(),
            hp=BOT_HP_BASE + room.wave * 2,
        )
        room.bots[bot.id] = bot

    # difficulty ramp by wave (every 10 kills => +1 wave)
    new_wave = 1 + room.bots_killed // 10
    if new_wave != room.wave:
        room.wave = new_wave

    await _broadcast(room, _snapshot(room))

    # check for game over after broadcast so clients see final state
    if not room.alive_players() and room.players:
        room.game_over = True
        await _broadcast(room, {"type": "game_over"})


# ---------------------------------------------------------------------------
# WebSocket app
# ---------------------------------------------------------------------------


app = FastAPI(title="Pig Shooter Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    asyncio.create_task(_game_loop())
    asyncio.create_task(_room_janitor())


async def _room_janitor() -> None:
    while True:
        await asyncio.sleep(15)
        async with ROOMS_LOCK:
            for room_id in [
                rid for rid, r in ROOMS.items() if not r.players and r.game_over
            ]:
                ROOMS.pop(room_id, None)
            # restart fully-dead rooms after a short grace so players can rejoin
            for room in ROOMS.values():
                if room.game_over and room.players:
                    room.game_over = False
                    room.started = False
                    room.bots.clear()
                    room.bots_killed = 0
                    room.wave = 1
                    for i, p in enumerate(room.players.values()):
                        p.hp = 1
                        p.alive = True
                        p.score = 0
                        p.pos = _spawn_pos_for_player(i)
                    for _ in range(INITIAL_BOTS):
                        bot = Bot(
                            id=uuid.uuid4().hex[:6],
                            pos=_spawn_bot_pos(),
                            hp=BOT_HP_BASE,
                        )
                        room.bots[bot.id] = bot


@app.get("/")
async def root() -> dict:
    return {
        "ok": True,
        "rooms": len(ROOMS),
        "players": sum(len(r.players) for r in ROOMS.values()),
    }


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    name = ws.query_params.get("name", "Pig").strip()[:16] or "Pig"

    room = await _find_or_create_room()
    player = Player(
        id=uuid.uuid4().hex[:8],
        name=name,
        ws=ws,
        pos=_spawn_pos_for_player(len(room.players)),
    )
    room.players[player.id] = player

    await ws.send_json(
        {
            "type": "welcome",
            "you": player.id,
            "room": room.id,
            "spawn": player.pos.to_list(),
        }
    )
    await _broadcast(
        room,
        {"type": "player_joined", "player": player.to_public()},
    )

    try:
        while True:
            msg = await ws.receive_json()
            await _handle_message(room, player, msg)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        room.players.pop(player.id, None)
        try:
            await _broadcast(
                room,
                {"type": "player_left", "id": player.id},
            )
        except Exception:
            pass


async def _handle_message(room: Room, player: Player, msg: dict) -> None:
    mtype = msg.get("type")
    if mtype == "input":
        # client-side authoritative movement is fine for a friendly co-op.
        pos = msg.get("pos") or [0, 0, 0]
        if isinstance(pos, list) and len(pos) == 3:
            player.pos = Vec3(
                x=max(-ARENA_HALF, min(ARENA_HALF, float(pos[0]))),
                y=float(pos[1]),
                z=max(-ARENA_HALF, min(ARENA_HALF, float(pos[2]))),
            )
        player.yaw = float(msg.get("yaw", player.yaw))
        weapon = msg.get("weapon")
        if weapon in WEAPON_DAMAGE:
            player.weapon = weapon  # type: ignore[assignment]
    elif mtype == "hit":
        bot_id = msg.get("bot")
        weapon = msg.get("weapon", player.weapon)
        if weapon not in WEAPON_DAMAGE:
            return
        bot = room.bots.get(bot_id)
        if not bot or not player.alive:
            return
        damage = WEAPON_DAMAGE[weapon]
        bot.hp -= damage
        if bot.hp <= 0:
            room.bots.pop(bot_id, None)
            player.score += 1
            room.bots_killed += 1
            await _broadcast(
                room,
                {
                    "type": "bot_killed",
                    "bot": bot_id,
                    "by": player.id,
                    "score": player.score,
                },
            )
    elif mtype == "ping":
        await player.ws.send_json({"type": "pong", "t": msg.get("t")})
