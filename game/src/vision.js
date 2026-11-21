// vision.js — what a guard (or a camera) can actually see.
// Vision is raycast, not a painted triangle: cones stop at walls and crates,
// so a cone that wraps around a crate reads as honest, and hiding behind
// cover really works. All coordinates are pixels in the playfield.
import { TILE, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './config.js';
import { blocksSight, isHedge } from './levels.js';

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when no wall or crate stands between the two points.
export function hasLineOfSight(parsed, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const cx = Math.floor((x0 + dx * t) / TILE);
    const cy = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(parsed, cx, cy)) return false;
  }
  return true;
}

// March one ray until it hits something solid or runs out of range.
export function raycastDistance(parsed, x, y, angle, range) {
  const step = 5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= range; d += step) {
    const cx = Math.floor((x + cos * d) / TILE);
    const cy = Math.floor((y + sin * d) / TILE);
    if (blocksSight(parsed, cx, cy)) return d - step / 2;
  }
  return range;
}

// The cone as a polygon: origin plus one point per ray across the arc.
// Render fills this; detection tests a point against angle + range + sight.
export function conePolygon(parsed, x, y, angle, range, halfAngle) {
  const rays = 26;
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = raycastDistance(parsed, x, y, a, range);
    points.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return points;
}

// Is the player inside this watcher's cone right now? Hedge hides the player
// unless the watcher is almost on top of them; crouching shrinks the range.
export function watcherSeesPlayer(parsed, watcher, player, range, halfAngle) {
  const dx = player.x - watcher.x;
  const dy = player.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  const effectiveRange = player.crouched ? range * 0.62 : range;
  if (dist > effectiveRange) return { seen: false, dist };
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleTo, watcher.angle)) > halfAngle) {
    return { seen: false, dist };
  }
  if (!hasLineOfSight(parsed, watcher.x, watcher.y, player.x, player.y)) {
    return { seen: false, dist };
  }
  const pcx = Math.floor(player.x / TILE);
  const pcy = Math.floor(player.y / TILE);
  if (isHedge(parsed, pcx, pcy) && dist > 52) return { seen: false, dist };
  return { seen: true, dist };
}

export { GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE };
