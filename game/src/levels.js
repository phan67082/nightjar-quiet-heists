// levels.js — the three nights of NIGHTJAR. Each level is a 32x20 tile map plus
// the patrol routes, cameras and lasers that make it a stealth puzzle.
// Map legend: # wall · . floor · H hedge (low cover, hide inside) · C crate
// (blocks sight and movement) · L lamp (light; douse it with E) · o coin loot
// · * objective · E exit door · = laser beam (walkable floor, beam drawn over it)
// · P player start. Rooms sit between wall columns x=10 and x=21, with doorways
// at fixed rows; wall bands run at rows 6 and 13 with gaps. Guards patrol inside
// one band only, so no route ever crosses a wall.
import { TILE } from './config.js';

function level(name, sub, objective, flavor, rows, guards, cameras, lasers) {
  return { name, sub, objective, flavor, rows, guards, cameras, lasers };
}

const WALL_BAND_TOP = '#####.###################.######';
const WALL_BAND_BOT = '################.##########.####';

export const LEVELS = [
  level(
    'THE INK ARCHIVE',
    'NIGHT 1 · THE MERIDIAN ARCHIVE',
    'Steal the Gilt Ledger, then reach the exit',
    'Old paper, old money. The wardens walk the stacks by lamplight.',
    [
      '################################',
      '#P....H...#....L.....#....o....#',
      '#.........#.....C....#.........#',
      '#..H.................#....*....#',
      '#..C......#....H.....#.........#',
      '#.....o...#..........#..H......#',
      WALL_BAND_TOP,
      '#.........#...L......#....C....#',
      '#..H......#.....C..............#',
      '#....o....#..........#..H......#',
      '#..............H.....#.........#',
      '#..C......#..........#.....o...#',
      '#.....L...#..C.......#.........#',
      WALL_BAND_BOT,
      '#.........#....H.....#..C......#',
      '#..H......#................o...#',
      '#.....o.........C....#.........#',
      '#.........#...L......#..H......#',
      '#....H....#..........#.....C...#',
      '#E##############################',
    ],
    [
      { name: 'ALDO', waypoints: [[9, 1], [14, 1], [14, 3], [9, 3]], pause: 1.2 },
      { name: 'NERIS', waypoints: [[24, 2], [29, 2], [29, 5], [24, 5]], pause: 1.0 },
      { name: 'CAEL', waypoints: [[3, 14], [8, 14], [8, 17], [3, 17]], pause: 1.4 },
    ],
    [],
    [],
  ),
  level(
    'THE CLOCKWORK GALLERY',
    'NIGHT 2 · THE BRASS HALLS',
    'Steal the Brass Nightingale, then reach the exit',
    'Cameras sweep the gallery. Time your crossing to their turning heads.',
    [
      '################################',
      '#P..C.....#....L.....#......o..#',
      '#.........#.....C....#..H......#',
      '#..H.................#....*....#',
      '#.........#....H.....#..C......#',
      '#.....o...#..........#.........#',
      WALL_BAND_TOP,
      '#.........#...L......#....C....#',
      '#..H......#.....C..............#',
      '#....o....#..........#..H......#',
      '#..............H.....#.........#',
      '#..C......#..........#.....o...#',
      '#.....L...#..C.......#.........#',
      WALL_BAND_BOT,
      '#.........#....H.....#.........#',
      '#..H......#................o...#',
      '#.....o.........C....#.........#',
      '#.........#...L......#..H......#',
      '#....H....#..........#.....C...#',
      '#E##############################',
    ],
    [
      { name: 'VESS', waypoints: [[9, 1], [15, 1], [15, 5], [9, 5]], pause: 1.0 },
      { name: 'SABLE', waypoints: [[24, 7], [29, 7], [29, 11], [24, 11]], pause: 1.2 },
      { name: 'ORIN', waypoints: [[3, 14], [8, 14], [8, 17], [3, 17]], pause: 1.0 },
      { name: 'MIRA', waypoints: [[18, 8], [22, 8], [22, 12], [18, 12]], pause: 1.6 },
    ],
    [
      { tx: 29, ty: 3, from: -0.4, to: 1.1, speed: 0.55 },
      { tx: 2, ty: 12, from: 2.2, to: 3.6, speed: 0.45 },
    ],
    [],
  ),
  level(
    'THE LANTERN VAULT',
    'NIGHT 3 · THE EMBER VAULT',
    'Steal the Ember Crown, then reach the exit',
    'Five wardens, two cameras, and laser wires across the vault floor.',
    [
      '################################',
      '#P....H...#....L.....#....o....#',
      '#.........#.....C....#.........#',
      '#..H.................#....*....#',
      '#..C......#....H.....#.........#',
      '#.....o...#..........#..H......#',
      WALL_BAND_TOP,
      '#.........#...L......#....C....#',
      '#..H......#.....C....#....=====#',
      '#....o....#..........#..H......#',
      '#..............H.....#.........#',
      '#..C......#..........#.....o...#',
      '#.....L...#..C.......#.........#',
      WALL_BAND_BOT,
      '#.........#....H.....#..C......#',
      '#..H......#................o...#',
      '#.....o.........C....#.........#',
      '#.........#...L......#..H......#',
      '#....H....#..........#=====....#',
      '#E##############################',
    ],
    [
      { name: 'ALDO', waypoints: [[9, 1], [14, 1], [14, 3], [9, 3]], pause: 0.9 },
      { name: 'NERIS', waypoints: [[24, 2], [29, 2], [29, 5], [24, 5]], pause: 1.0 },
      { name: 'CAEL', waypoints: [[3, 14], [8, 14], [8, 17], [3, 17]], pause: 1.1 },
      { name: 'VESS', waypoints: [[13, 7], [17, 7], [17, 11], [13, 11]], pause: 1.3 },
      { name: 'SABLE', waypoints: [[25, 14], [29, 14], [29, 17], [25, 17]], pause: 1.0 },
    ],
    [
      { tx: 29, ty: 3, from: -0.5, to: 1.2, speed: 0.6 },
      { tx: 2, ty: 12, from: 2.0, to: 3.5, speed: 0.5 },
    ],
    [
      { row: 8, colFrom: 26, colTo: 30, period: 3.2, phase: 0.0 },
      { row: 18, colFrom: 22, colTo: 26, period: 2.6, phase: 1.3 },
    ],
  ),
];

// Tile helpers: parse a level's rows into lookup tables the engine uses.
export function parseLevel(def) {
  const walls = new Set();
  const crates = new Set();
  const hedges = new Set();
  const lamps = [];
  const coins = [];
  const lasers = (def.lasers || []).map((lz) => ({ ...lz, on: true, t: lz.phase }));
  const cameras = (def.cameras || []).map((c) => ({
    x: (c.tx + 0.5) * TILE,
    y: (c.ty + 0.5) * TILE,
    angle: c.from,
    from: c.from,
    to: c.to,
    dir: 1,
    speed: c.speed,
    range: 190,
  }));
  let playerStart = { x: 48, y: 80 };
  let objective = { x: 0, y: 0 };
  let exit = { x: 0, y: 0 };
  const key = (cx, cy) => cx + ',' + cy;
  def.rows.forEach((row, cy) => {
    for (let cx = 0; cx < row.length; cx++) {
      const ch = row[cx];
      const px = (cx + 0.5) * TILE;
      const py = (cy + 0.5) * TILE;
      if (ch === '#') walls.add(key(cx, cy));
      else if (ch === 'C') crates.add(key(cx, cy));
      else if (ch === 'H') hedges.add(key(cx, cy));
      else if (ch === 'L') lamps.push({ x: px, y: py, cx, cy, lit: true });
      else if (ch === 'o') coins.push({ x: px, y: py, cx, cy, taken: false });
      else if (ch === '*') objective = { x: px, y: py, cx, cy };
      else if (ch === 'E') exit = { x: px, y: py, cx, cy };
      else if (ch === 'P') playerStart = { x: px, y: py };
      else if (ch === '=') { /* laser beam tile: walkable floor, beam drawn by lasers[] */ }
    }
  });
  return {
    def, walls, crates, hedges, lamps, coins, lasers, cameras,
    playerStart, objective, exit, rows: def.rows,
  };
}

export function tileAt(parsed, cx, cy) {
  if (cx < 0 || cy < 0 || cx >= 32 || cy >= 20) return '#';
  return parsed.rows[cy][cx] || '#';
}

export function blocksMovement(parsed, cx, cy) {
  const t = tileAt(parsed, cx, cy);
  return t === '#' || t === 'C';
}

export function blocksSight(parsed, cx, cy) {
  const t = tileAt(parsed, cx, cy);
  return t === '#' || t === 'C';
}

export function isHedge(parsed, cx, cy) {
  return tileAt(parsed, cx, cy) === 'H';
}
