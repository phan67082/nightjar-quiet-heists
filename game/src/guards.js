// guards.js — the wardens. One guard, one job: walk a patrol, notice things,
// investigate what it half-saw, chase what it fully saw, and calm down again.
// Suspicion is never an instant fail: a guard that loses you searches, then
// gives up and goes back to its route. That recovery window is the game.
import { TILE, GUARD_SPEED_PATROL, GUARD_SPEED_SUSPICIOUS, GUARD_SPEED_CHASE,
  GUARD_CATCH_RADIUS, SUSPICION_SEARCH_AT, SUSPICION_ALARM_AT, SEARCH_LOOK_AROUND,
  ALARM_CALM_AFTER } from './config.js';
import { blocksMovement } from './levels.js';
import { angleDifference } from './vision.js';

export class Guard {
  constructor(def, parsed) {
    this.name = def.name;
    this.waypoints = def.waypoints.map(([cx, cy]) => ({
      x: (cx + 0.5) * TILE, y: (cy + 0.5) * TILE,
    }));
    this.pauseAtWaypoint = def.pause || 1.0;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.angle = 0;
    this.wpIndex = 1 % this.waypoints.length;
    this.pauseTimer = 0.6;
    this.state = 'patrol'; // patrol | suspicious | search | chase | return
    this.suspicion = 0; // 0..100
    this.investigate = null; // {x, y} — the spot to go and look at
    this.lookTimer = 0;
    this.unseenTimer = 0;
    this.stepTimer = 0;
    this.stepPhase = Math.random() * 0.5;
    this.caughtPlayer = false;
  }

  reset() {
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.angle = 0;
    this.wpIndex = 1 % this.waypoints.length;
    this.pauseTimer = 0.6;
    this.state = 'patrol';
    this.suspicion = 0;
    this.investigate = null;
    this.lookTimer = 0;
    this.unseenTimer = 0;
    this.caughtPlayer = false;
  }

  // Walk toward a point with axis-separated sliding, so a guard that meets a
  // wall slides along it instead of getting stuck on a corner.
  moveToward(parsed, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const vx = (dx / dist) * speed * dt;
    const vy = (dy / dist) * speed * dt;
    this.angle = Math.atan2(dy, dx);
    this.tryStep(parsed, vx, 0);
    this.tryStep(parsed, 0, vy);
    return Math.hypot(tx - this.x, ty - this.y) < 4;
  }

  tryStep(parsed, vx, vy) {
    const r = 10;
    const nx = this.x + vx;
    const ny = this.y + vy;
    const cx = Math.floor(nx / TILE);
    const cy = Math.floor(ny / TILE);
    const ccx = Math.floor(this.x / TILE);
    const ccy = Math.floor(this.y / TILE);
    // Only the tile in the direction of travel can block this axis.
    if (vx !== 0 && blocksMovement(parsed, Math.floor((nx + Math.sign(vx) * r) / TILE), ccy)) return;
    if (vy !== 0 && blocksMovement(parsed, ccx, Math.floor((ny + Math.sign(vy) * r) / TILE))) return;
    if (vx !== 0) this.x = nx;
    if (vy !== 0) this.y = ny;
  }

  // Footsteps: the nearer a guard is, the louder and faster its steps sound.
  // The game routes these to audio.js and to the HUD footstep meter.
  tickFootsteps(dt, speed, onStep) {
    if (speed <= 0) return;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = 0.62 - Math.min(0.3, speed / 600);
      onStep(this);
    }
  }

  update(dt, ctx) {
    const { parsed, player, onGuardStep, onCatch } = ctx;
    // Chase overrides everything while the alarm holds.
    if (this.state === 'chase') {
      this.unseenTimer += dt;
      if (this.unseenTimer > ALARM_CALM_AFTER) {
        this.state = 'return';
        this.suspicion = 40;
        this.investigate = null;
      } else {
        const target = ctx.playerSeen ? { x: player.x, y: player.y } : this.investigate;
        if (target) this.moveToward(parsed, target.x, target.y, GUARD_SPEED_CHASE, dt);
        this.tickFootsteps(dt, GUARD_SPEED_CHASE, onGuardStep);
        if (Math.hypot(player.x - this.x, player.y - this.y) < GUARD_CATCH_RADIUS) {
          this.caughtPlayer = true;
          onCatch(this);
        }
      }
      return;
    }
    if (this.state === 'suspicious' || this.state === 'search') {
      if (this.investigate) {
        const arrived = this.moveToward(parsed, this.investigate.x, this.investigate.y,
          GUARD_SPEED_SUSPICIOUS, dt);
        this.tickFootsteps(dt, GUARD_SPEED_SUSPICIOUS, onGuardStep);
        if (arrived) {
          this.lookTimer -= dt;
          this.angle += dt * 1.8; // scan the spot, turning slowly
          if (this.lookTimer <= 0) {
            this.state = 'patrol';
            this.investigate = null;
            this.suspicion = Math.min(this.suspicion, 22);
          }
        } else {
          this.lookTimer = SEARCH_LOOK_AROUND;
        }
      } else {
        this.state = 'patrol';
      }
      return;
    }
    if (this.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let best = this.waypoints[0];
      let bestD = Infinity;
      for (const w of this.waypoints) {
        const d = Math.hypot(w.x - this.x, w.y - this.y);
        if (d < bestD) { bestD = d; best = w; }
      }
      const arrived = this.moveToward(parsed, best.x, best.y, GUARD_SPEED_PATROL, dt);
      this.tickFootsteps(dt, GUARD_SPEED_PATROL, onGuardStep);
      if (arrived) {
        this.wpIndex = (this.waypoints.indexOf(best) + 1) % this.waypoints.length;
        this.state = 'patrol';
        this.pauseTimer = 0.8;
      }
      return;
    }
    // Patrol: walk the route, pause and look around at each waypoint.
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      this.angle += dt * 0.5; // idle glance around
      return;
    }
    const target = this.waypoints[this.wpIndex];
    const arrived = this.moveToward(parsed, target.x, target.y, GUARD_SPEED_PATROL, dt);
    this.tickFootsteps(dt, GUARD_SPEED_PATROL, onGuardStep);
    if (arrived) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      this.pauseTimer = this.pauseAtWaypoint;
    }
  }

  // The brain: what this guard does with what it just saw (or heard).
  // Called every frame by main.js with the guard's current sighting.
  notice(dt, seen, seenAt, heardAt) {
    if (seen) {
      this.unseenTimer = 0;
      if (this.suspicion >= SUSPICION_ALARM_AT) {
        this.state = 'chase';
        this.investigate = { x: seenAt.x, y: seenAt.y };
      } else if (this.suspicion >= SUSPICION_SEARCH_AT && this.state === 'patrol') {
        this.state = 'suspicious';
        this.investigate = { x: seenAt.x, y: seenAt.y };
        this.lookTimer = SEARCH_LOOK_AROUND;
      }
      return;
    }
    if (heardAt && this.state === 'patrol') {
      // A noise ring reached this guard: go and look at where it came from.
      this.state = 'suspicious';
      this.suspicion = Math.max(this.suspicion, SUSPICION_SEARCH_AT + 4);
      this.investigate = { x: heardAt.x, y: heardAt.y };
      this.lookTimer = SEARCH_LOOK_AROUND;
    }
  }

  get alertColor() {
    if (this.state === 'chase') return '#ff5347';
    if (this.state === 'suspicious' || this.state === 'search') return '#ffd25a';
    return '#8cc8ff';
  }

  get mark() {
    if (this.state === 'chase') return '!';
    if (this.state === 'suspicious' || this.state === 'search') return '?';
    return '';
  }
}

// A wall-mounted camera: it cannot chase, but it sweeps a cone and, when it
// spots the player, it raises the shared alarm and points every guard at them.
export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.angle = def.angle;
    this.from = def.from;
    this.to = def.to;
    this.dir = def.dir;
    this.speed = def.speed;
    this.range = def.range;
    this.exposure = 0; // 0..100, how long the player has been in its cone
  }

  update(dt) {
    this.angle += this.dir * this.speed * dt;
    if (this.angle > this.to) { this.angle = this.to; this.dir = -1; }
    if (this.angle < this.from) { this.angle = this.from; this.dir = 1; }
  }

  reset() {
    this.angle = this.from;
    this.dir = 1;
    this.exposure = 0;
  }
}
