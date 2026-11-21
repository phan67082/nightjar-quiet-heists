// noise.js — sound you can see. Every loud thing in NIGHTJAR draws an
// expanding ring: sprinting feet, a landing pebble, a doused lamp's hiss.
// Guards hear a ring when it reaches them, and walk to where it started.
// The rings are the game's distinctive mechanic: stealth you can watch
// travel across the floor.
import { NOISE_SPRINT_RADIUS, NOISE_PEBBLE_RADIUS } from './config.js';

export class NoiseRing {
  constructor(x, y, maxRadius, color, origin) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.maxRadius = maxRadius;
    this.color = color;
    this.origin = origin; // {x, y} — where the sound came from
    this.speed = 300; // px per second
    this.alpha = 0.9;
    this.heardBy = new Set(); // guards already sent to investigate this ring
  }

  update(dt) {
    this.radius += this.speed * dt;
    this.alpha = Math.max(0, 0.9 * (1 - this.radius / this.maxRadius));
    return this.radius < this.maxRadius;
  }
}

export class NoiseManager {
  constructor() {
    this.rings = [];
  }

  reset() {
    this.rings = [];
  }

  // A pebble lands: one big ring, and every guard it can reach investigates.
  pebble(x, y) {
    this.rings.push(new NoiseRing(x, y, NOISE_PEBBLE_RADIUS, '#ffd25a', { x, y }));
  }

  // Sprinting feet: small rings, one per step, that only nearby guards hear.
  footstep(x, y) {
    this.rings.push(new NoiseRing(x, y, NOISE_SPRINT_RADIUS, '#ffb08a', { x, y }));
  }

  // A doused lamp hisses: a short ring that only distracts guards very close by.
  douseHiss(x, y) {
    this.rings.push(new NoiseRing(x, y, 70, '#9fb6ff', { x, y }));
  }

  update(dt, guards) {
    const heard = [];
    this.rings = this.rings.filter((ring) => {
      const alive = ring.update(dt);
      for (const guard of guards) {
        if (ring.heardBy.has(guard)) continue;
        const d = Math.hypot(guard.x - ring.x, guard.y - ring.y);
        if (d <= ring.radius) {
          ring.heardBy.add(guard);
          heard.push({ guard, at: ring.origin });
        }
      }
      return alive;
    });
    return heard;
  }
}
