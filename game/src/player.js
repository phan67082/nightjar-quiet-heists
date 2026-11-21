// player.js — the nightjar herself: a hooded thief who moves, sneaks, sprints,
// crouches, throws pebbles and douses lamps. Her noise is her footprint:
// sprinting is loud, sneaking is silent, and every pebble is a lie told to
// the guards' ears.
import { TILE, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
  PLAYER_SPRINT_SPEED, PLAYER_CROUCH_SPEED, LAMP_RADIUS, MAX_PEBBLES } from './config.js';
import { blocksMovement, isHedge } from './levels.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // facing, radians
    this.crouched = false;
    this.sneaking = false;
    this.sprinting = false;
    this.moving = false;
    this.pebbles = MAX_PEBBLES;
    this.stepTimer = 0;
    this.lit = false; // standing in lamplight right now
    this.hidden = false; // crouched or sneaking inside hedge cover
    this.inCover = false; // standing on a hedge tile at all
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.crouched = false;
    this.sneaking = false;
    this.sprinting = false;
    this.moving = false;
    this.pebbles = MAX_PEBBLES;
    this.lit = false;
    this.hidden = false;
    this.inCover = false;
  }

  speed() {
    if (this.crouched) return PLAYER_CROUCH_SPEED;
    if (this.sprinting) return PLAYER_SPRINT_SPEED;
    if (this.sneaking) return PLAYER_SNEAK_SPEED;
    return PLAYER_WALK_SPEED;
  }

  move(dt, vx, vy, parsed, onStep) {
    const len = Math.hypot(vx, vy);
    this.moving = len > 0.01;
    if (!this.moving) return;
    const nx = vx / len;
    const ny = vy / len;
    this.angle = Math.atan2(ny, nx);
    const sp = this.speed() * dt;
    this.tryStep(parsed, nx * sp, 0);
    this.tryStep(parsed, 0, ny * sp);
    // Footsteps: sprinting is heard far away, sneaking not at all.
    this.stepTimer -= dt;
    if (this.stepTimer <= 0 && this.moving) {
      this.stepTimer = this.sprinting ? 0.30 : 0.55;
      onStep(this.sprinting ? 1 : 0);
    }
  }

  tryStep(parsed, vx, vy) {
    const r = PLAYER_RADIUS;
    const nx = this.x + vx;
    const ny = this.y + vy;
    const ccx = Math.floor(this.x / TILE);
    const ccy = Math.floor(this.y / TILE);
    if (vx !== 0 && blocksMovement(parsed, Math.floor((nx + Math.sign(vx) * r) / TILE), ccy)) return;
    if (vy !== 0 && blocksMovement(parsed, ccx, Math.floor((ny + Math.sign(vy) * r) / TILE))) return;
    if (vx !== 0) this.x = nx;
    if (vy !== 0) this.y = ny;
  }

  // Light and cover, recomputed every frame: they decide how fast a guard's
  // suspicion fills, and what the HUD's visibility bar shows.
  senseSurroundings(parsed) {
    const pcx = Math.floor(this.x / TILE);
    const pcy = Math.floor(this.y / TILE);
    this.inCover = isHedge(parsed, pcx, pcy);
    this.hidden = this.inCover && (this.crouched || this.sneaking);
    this.lit = false;
    for (const lamp of parsed.lamps) {
      if (!lamp.lit) continue;
      if (Math.hypot(lamp.x - this.x, lamp.y - this.y) < LAMP_RADIUS) {
        this.lit = true;
        break;
      }
    }
  }

  // Throw a pebble toward a point: it lands, rings, and every guard in earshot
  // goes to look at where it landed — not at you.
  throwPebble(tx, ty) {
    if (this.pebbles <= 0) return null;
    this.pebbles -= 1;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const maxThrow = 190;
    const t = Math.min(1, maxThrow / Math.max(1, dist));
    return { x: this.x + dx * t, y: this.y + dy * t };
  }

  // Douse the nearest lit lamp within reach. A dark lamp is a pool of safety.
  douseNearestLamp(parsed) {
    let best = null;
    let bestD = 46;
    for (const lamp of parsed.lamps) {
      if (!lamp.lit) continue;
      const d = Math.hypot(lamp.x - this.x, lamp.y - this.y);
      if (d < bestD) { bestD = d; best = lamp; }
    }
    if (best) { best.lit = false; return best; }
    return null;
  }
}
