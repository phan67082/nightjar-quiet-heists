// main.js — the nightjar's heart: screens, the update loop, detection,
// pickups, the exit, and the strikes that say how a night ends.
// Detection is never an instant fail: suspicion fills, guards investigate,
// the alarm cools when you break line of sight, and only a warden's hands
// on you costs a strike. Three strikes end the night.
import { TILE, FIELD_X, FIELD_Y, SUSPICION_FILL_LIT, SUSPICION_FILL_SHADOW,
  SUSPICION_FILL_CROUCH, SUSPICION_DECAY, SUSPICION_ALARM_AT, STRIKES_PER_LEVEL,
  SCORE_COIN, SCORE_OBJECTIVE, SCORE_GHOST_BONUS, SCORE_LEVEL_CLEAR,
  GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { Guard, Camera } from './guards.js';
import { Player } from './player.js';
import { NoiseManager } from './noise.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { watcherSeesPlayer } from './vision.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sound = new SoundEngine();
input.onFirstGesture = () => sound.ensure();

export const G = {
  screen: 'title', // title | playing | levelComplete | caught | gameOver | campaignComplete | paused
  levelIndex: 0,
  parsed: null,
  guards: [],
  cameras: [],
  player: new Player(48, 80),
  noise: new NoiseManager(),
  suspicion: 0, // worst suspicion across all watchers, 0..100
  alarmState: 'CALM', // CALM | SUSPICIOUS | SEARCHING | SPOTTED
  coinsTaken: 0,
  coinsTotal: 0,
  objectiveTaken: false,
  exitOpen: false,
  goalShort: '',
  spottedCount: 0,
  strikes: 0,
  score: 0,
  time: 0,
  now: 0,
  banner: null,
  bannerUntil: 0,
  hint: '',
  nearestGuardDist: 9999,
  frozen: false,
  alarmLatched: false,
  caughtLatch: false,
  cameraAlarmLatched: false,
  laserCooldown: 0,

  loadLevel(index) {
    this.levelIndex = index;
    const def = LEVELS[index];
    this.parsed = parseLevel(def);
    this.guards = def.guards.map((g) => new Guard(g, this.parsed));
    this.cameras = this.parsed.cameras.map((c) => new Camera(c));
    this.player.reset(this.parsed.playerStart.x, this.parsed.playerStart.y);
    this.noise.reset();
    this.suspicion = 0;
    this.alarmState = 'CALM';
    this.coinsTaken = 0;
    this.coinsTotal = this.parsed.coins.length;
    this.objectiveTaken = false;
    this.exitOpen = false;
    this.goalShort = def.name === 'THE INK ARCHIVE' ? 'Gilt Ledger'
      : def.name === 'THE CLOCKWORK GALLERY' ? 'Brass Nightingale' : 'Ember Crown';
    this.spottedCount = 0;
    this.time = 0;
    this.banner = null;
    this.hint = '';
    this.alarmLatched = false;
    this.caughtLatch = false;
    this.cameraAlarmLatched = false;
    this.laserCooldown = 0;
    this.updateNearestGuard();
  },

  updateNearestGuard() {
    let best = 9999;
    for (const g of this.guards) {
      const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (d < best) best = d;
    }
    this.nearestGuardDist = best;
  },

  showBanner(text, sub, color, seconds) {
    this.banner = { text, sub: sub || '', color };
    this.bannerUntil = this.now + (seconds || 3);
  },
};

function startCampaign() {
  G.score = 0;
  G.strikes = 0;
  G.loadLevel(0);
  G.screen = 'playing';
}

function nextLevel() {
  if (G.levelIndex + 1 >= LEVELS.length) {
    G.screen = 'campaignComplete';
    return;
  }
  G.strikes = 0;
  G.loadLevel(G.levelIndex + 1);
  G.screen = 'playing';
}

function onCatch() {
  if (G.caughtLatch || G.screen !== 'playing') return;
  G.caughtLatch = true;
  G.strikes += 1;
  sound.caughtSting();
  if (G.strikes >= STRIKES_PER_LEVEL) {
    G.screen = 'gameOver';
  } else {
    G.screen = 'caught';
  }
}

function onGuardStep(guard) {
  const d = Math.hypot(guard.x - G.player.x, guard.y - G.player.y);
  sound.guardFootstep(d);
}

function updatePlaying(dt) {
  const p = G.parsed;
  const pl = G.player;
  // Stances
  pl.sneaking = input.isDown('shift');
  pl.sprinting = input.isDown(' ') && !pl.sneaking && !pl.crouched;
  if (input.wasPressed('c')) pl.crouched = !pl.crouched;
  if (input.wasPressed('m')) sound.toggleMute();
  if (input.wasPressed('escape') || input.wasPressed('p')) {
    G.screen = 'paused';
    input.consume();
    return;
  }
  if (input.wasPressed('r')) {
    G.loadLevel(G.levelIndex);
    input.consume();
    return;
  }
  // Movement
  const mv = input.moveVector();
  pl.move(dt, mv.x, mv.y, p, (loud) => {
    sound.playerStep(loud);
    if (loud) G.noise.footstep(pl.x, pl.y);
  });
  pl.senseSurroundings(p);
  // Pebble: Q or a click throws toward the mouse.
  if (input.wasPressed('q') || input.mouse.clicked) {
    const tx = input.mouse.clicked ? input.mouse.clickX - FIELD_X : pl.x + Math.cos(pl.angle) * 120;
    const ty = input.mouse.clicked ? input.mouse.clickY - FIELD_Y : pl.y + Math.sin(pl.angle) * 120;
    const landing = pl.throwPebble(tx, ty);
    if (landing) {
      G.noise.pebble(landing.x, landing.y);
      sound.pebbleClink();
      G.hint = 'The pebble rings — they will look there, not at you.';
    } else {
      G.hint = 'No pebbles left. Find the shadows instead.';
    }
  }
  // Douse a lamp with E.
  if (input.wasPressed('e')) {
    const lamp = pl.douseNearestLamp(p);
    if (lamp) {
      G.noise.douseHiss(lamp.x, lamp.y);
      sound.douseHiss();
      G.hint = 'Lamp doused — a pool of shadow, made by you.';
    }
  }
  // Lasers pulse; crossing a live wire spikes suspicion.
  G.laserCooldown = Math.max(0, G.laserCooldown - dt);
  for (const lz of p.lasers) {
    lz.t = (lz.t + dt) % lz.period;
    lz.on = lz.t < lz.period / 2;
    if (lz.on && G.laserCooldown <= 0) {
      const pcx = Math.floor(pl.x / TILE);
      const pcy = Math.floor(pl.y / TILE);
      if (pcy === lz.row && pcx >= lz.colFrom && pcx <= lz.colTo) {
        G.suspicion = Math.min(100, G.suspicion + 45);
        for (const g of G.guards) {
          g.suspicion = Math.min(100, g.suspicion + 45);
          if (g.state === 'patrol') {
            g.state = 'suspicious';
            g.investigate = { x: pl.x, y: pl.y };
            g.lookTimer = 2.4;
          }
        }
        G.laserCooldown = 1.0;
        G.hint = 'A laser wire! The alarm heard that.';
        sound.alarmSting();
      }
    }
  }
  // Cameras sweep and watch.
  let worstCamera = 0;
  for (const cam of G.cameras) {
    cam.update(dt);
    const seen = watcherSeesPlayer(p, cam, pl, cam.range, 0.42);
    if (seen.seen) {
      cam.exposure = Math.min(100, cam.exposure + (pl.lit ? 70 : 40) * dt);
    } else {
      cam.exposure = Math.max(0, cam.exposure - 22 * dt);
    }
    worstCamera = Math.max(worstCamera, cam.exposure);
    if (cam.exposure >= 100 && !G.cameraAlarmLatched) {
      G.cameraAlarmLatched = true;
      G.spottedCount += 1;
      sound.alarmSting();
      G.showBanner('SEEN BY CAMERA!', 'Every warden is coming to your spot', '#ff5347', 3);
      for (const g of G.guards) {
        g.state = 'chase';
        g.suspicion = 100;
        g.investigate = { x: pl.x, y: pl.y };
        g.unseenTimer = 0;
      }
    }
    if (cam.exposure < 60) G.cameraAlarmLatched = false;
  }
  // Guards see, suspect, investigate, chase — and calm down again.
  let worst = worstCamera * 0.8;
  let anyChase = false;
  let anySearch = false;
  for (const guard of G.guards) {
    const seen = watcherSeesPlayer(p, guard, pl, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE);
    if (seen.seen) {
      const closeness = 1.35 - 0.55 * (seen.dist / GUARD_VIEW_RANGE);
      let rate = pl.lit ? SUSPICION_FILL_LIT : SUSPICION_FILL_SHADOW;
      if (pl.crouched) rate = SUSPICION_FILL_CROUCH;
      if (pl.sprinting) rate *= 1.5;
      guard.suspicion = Math.min(100, guard.suspicion + rate * closeness * dt);
      guard.unseenTimer = 0;
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
    }
    if (guard.suspicion >= SUSPICION_ALARM_AT && guard.state !== 'chase') {
      guard.state = 'chase';
      guard.investigate = { x: pl.x, y: pl.y };
      if (!G.alarmLatched) {
        G.alarmLatched = true;
        G.spottedCount += 1;
        sound.alarmSting();
        G.showBanner('SPOTTED!', 'Break line of sight — the alarm cools in a few seconds', '#ff5347', 3);
      }
    }
    if (guard.suspicion < SUSPICION_ALARM_AT) G.alarmLatched = false;
    guard.notice(dt, seen.seen, { x: pl.x, y: pl.y }, null);
    guard.update(dt, {
      parsed: p, player: pl, onGuardStep,
      onCatch, playerSeen: seen.seen,
    });
    if (guard.state === 'chase') anyChase = true;
    if (guard.state === 'suspicious' || guard.state === 'search') anySearch = true;
    worst = Math.max(worst, guard.suspicion);
  }
  // Noise rings travel; guards that hear one go to look at its origin.
  const heard = G.noise.update(dt, G.guards);
  for (const h of heard) {
    h.guard.notice(dt, false, null, h.at);
  }
  G.suspicion = worst;
  G.alarmState = anyChase ? 'SPOTTED' : anySearch ? 'SEARCHING' : worst >= 20 ? 'SUSPICIOUS' : 'CALM';
  G.updateNearestGuard();
  // Pickups: coins and the objective.
  for (const coin of p.coins) {
    if (!coin.taken && Math.hypot(coin.x - pl.x, coin.y - pl.y) < 18) {
      coin.taken = true;
      G.coinsTaken += 1;
      G.score += SCORE_COIN;
      sound.coinPickup();
    }
  }
  if (!G.objectiveTaken && Math.hypot(p.objective.x - pl.x, p.objective.y - pl.y) < 20) {
    G.objectiveTaken = true;
    G.exitOpen = true;
    G.score += SCORE_OBJECTIVE;
    sound.objectivePickup();
    G.showBanner(G.goalShort.toUpperCase() + ' TAKEN', 'The exit is open — extract, ghost intact if never spotted', '#39d98a', 3.5);
  }
  // The exit, once open.
  if (G.exitOpen && Math.hypot(p.exit.x - pl.x, p.exit.y - pl.y) < 22) {
    G.score += SCORE_LEVEL_CLEAR;
    if (G.spottedCount === 0) G.score += SCORE_GHOST_BONUS;
    sound.levelClear();
    G.screen = 'levelComplete';
  }
  G.time += dt;
  if (G.banner && G.now > G.bannerUntil) G.banner = null;
}

function update(dt) {
  G.now += dt;
  if (G.frozen) return;
  if (G.screen === 'playing') {
    updatePlaying(dt);
  } else if (G.screen === 'title') {
    if (input.wasPressed('enter')) startCampaign();
  } else if (G.screen === 'levelComplete') {
    if (input.wasPressed('enter')) nextLevel();
  } else if (G.screen === 'caught') {
    if (input.wasPressed('enter')) {
      G.loadLevel(G.levelIndex);
      G.screen = 'playing';
    }
  } else if (G.screen === 'gameOver') {
    if (input.wasPressed('enter')) {
      G.strikes = 0;
      G.loadLevel(G.levelIndex);
      G.screen = 'playing';
    }
  } else if (G.screen === 'campaignComplete') {
    if (input.wasPressed('enter')) startCampaign();
  } else if (G.screen === 'paused') {
    if (input.wasPressed('escape') || input.wasPressed('enter')) G.screen = 'playing';
  }
  input.consume();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawGame(ctx, G);
  requestAnimationFrame(frame);
}

// Boot: a staged shot (?shot=...) renders one frozen moment for the camera;
// otherwise the title screen waits for ENTER.
G.loadLevel(0);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(G, shot);
} else {
  G.screen = 'title';
}
window.__nightjar = { G, LEVELS, startCampaign, nextLevel };
requestAnimationFrame(frame);
