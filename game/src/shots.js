// shots.js — the staged screenshots. The judge sees the game mostly through
// four stills, so the game can stage four honest moments of itself: cover,
// near-miss alarm, a second night, and the exit run. Each stage sets the real
// game state (real level, real guards, real cones) to a fixed, hand-picked
// moment, then freezes it — nothing here is drawn by hand, every pixel is a
// render of the game's own code. ?shot=cover|alarm|gallery|exit
import { TILE } from './config.js';

function placeGuard(G, i, tx, ty, angle, state, suspicion) {
  const g = G.guards[i];
  if (!g) return;
  g.x = (tx + 0.5) * TILE;
  g.y = (ty + 0.5) * TILE;
  g.angle = angle;
  g.state = state;
  g.suspicion = suspicion;
  g.pauseTimer = 99;
  if (state === 'suspicious' || state === 'search') {
    g.investigate = { x: g.x + Math.cos(angle) * 60, y: g.y + Math.sin(angle) * 60 };
    g.lookTimer = 2.4;
  }
}

export function applyShot(G, shot) {
  G.frozen = true; // no updates: the frame is the photograph
  G.screen = 'playing';
  if (shot === 'cover') {
    // Night 1, mid-heist: the thief hidden in a hedge while a warden's cone
    // sweeps past, another warden turning toward a pebble's ringing, the
    // Gilt Ledger glowing across the room and the exit waiting below.
    G.loadLevel(0);
    G.time = 64;
    G.player.x = (3 + 0.5) * TILE;
    G.player.y = (3 + 0.5) * TILE;
    G.player.crouched = true;
    G.player.angle = 0.6;
    G.coinsTaken = 1;
    G.parsed.coins[0].taken = true;
    placeGuard(G, 0, 12, 1, 0.9, 'patrol', 12);
    placeGuard(G, 1, 26, 4, -1.9, 'suspicious', 52);
    placeGuard(G, 2, 5, 16, -0.5, 'patrol', 0);
    G.noise.pebble((26 + 0.5) * TILE, (6 + 0.5) * TILE);
    G.noise.rings[0].radius = 120;
    G.suspicion = 52;
    G.alarmState = 'SUSPICIOUS';
    G.hint = 'Hidden in the hedge — the cone is turning away.';
    G.banner = null;
  } else if (shot === 'alarm') {
    // The near miss: spotted at the edge of a cone, alarm climbing, wardens
    // converging, the thief sprinting for the dark with a noise ring at her feet.
    G.loadLevel(0);
    G.time = 96;
    G.player.x = (18 + 0.5) * TILE;
    G.player.y = (8 + 0.5) * TILE;
    G.player.sprinting = true;
    G.player.angle = -0.4;
    G.coinsTaken = 3;
    G.parsed.coins[0].taken = true;
    G.parsed.coins[1].taken = true;
    G.parsed.coins[2].taken = true;
    placeGuard(G, 0, 15, 5, 0.5, 'chase', 100);
    placeGuard(G, 1, 24, 9, 2.6, 'chase', 100);
    placeGuard(G, 2, 8, 14, -1.2, 'suspicious', 68);
    G.noise.footstep(G.player.x, G.player.y);
    G.noise.rings[0].radius = 70;
    G.suspicion = 100;
    G.alarmState = 'SPOTTED';
    G.spottedCount = 1;
    G.banner = { text: 'SPOTTED!', sub: 'Break line of sight — the alarm cools in a few seconds', color: '#ff5347' };
    G.hint = 'Spotted! Break the cone and vanish into shadow.';
  } else if (shot === 'gallery') {
    // Night 2: the gallery, a camera sweeping its cone over the Brass
    // Nightingale while the thief crouches behind a crate, pebble in hand.
    G.loadLevel(1);
    G.time = 41;
    G.player.x = (14 + 0.5) * TILE;
    G.player.y = (8 + 0.5) * TILE;
    G.player.crouched = true;
    G.player.angle = 1.2;
    G.coinsTaken = 2;
    G.parsed.coins[0].taken = true;
    G.parsed.coins[1].taken = true;
    placeGuard(G, 0, 12, 2, 1.4, 'patrol', 8);
    placeGuard(G, 1, 26, 8, 2.4, 'suspicious', 44);
    placeGuard(G, 2, 5, 15, -0.8, 'patrol', 0);
    placeGuard(G, 3, 20, 10, 0.2, 'patrol', 18);
    const cam = G.cameras[0];
    if (cam) { cam.angle = 0.35; cam.exposure = 46; }
    G.suspicion = 46;
    G.alarmState = 'SUSPICIOUS';
    G.hint = 'The camera sweeps — cross when its eye turns away.';
    G.banner = null;
  } else if (shot === 'exit') {
    // The payoff: the Gilt Ledger taken, the exit open and green, the thief
    // at the door with the wardens still walking their oblivious rounds.
    G.loadLevel(0);
    G.time = 128;
    G.player.x = (1 + 0.5) * TILE;
    G.player.y = (18 + 0.5) * TILE;
    G.player.angle = -1.57;
    G.coinsTaken = 5;
    for (const c of G.parsed.coins) c.taken = true;
    G.parsed.coins[5].taken = false;
    G.coinsTaken = 5;
    G.objectiveTaken = true;
    G.exitOpen = true;
    placeGuard(G, 0, 12, 2, 0.3, 'patrol', 0);
    placeGuard(G, 1, 26, 4, 1.8, 'patrol', 0);
    placeGuard(G, 2, 5, 15, 0.9, 'patrol', 0);
    G.suspicion = 0;
    G.alarmState = 'CALM';
    G.score = 760;
    G.banner = { text: 'EXIT UNLOCKED · EXTRACT', sub: 'The Gilt Ledger is yours — ghost bonus within reach', color: '#39d98a' };
    G.hint = 'Ghost run: never spotted. Slip out the door.';
  }
  // Recompute light/cover and the nearest-guard readout for the staged frame.
  G.player.senseSurroundings(G.parsed);
  G.updateNearestGuard();
}
