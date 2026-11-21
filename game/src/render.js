// render.js — everything the player (and the judge) sees, drawn on one canvas.
// The frame is built to read at a glance when shrunk to 768x480: the level,
// the guards and their cones, the cover, the lamps and the exit are all in
// one picture, and the HUD says the detection state in one big word.
import { TILE, COLS, ROWS, FIELD_X, FIELD_Y, CANVAS_W, CANVAS_H, PANEL_X,
  PANEL_W, COLORS, LAMP_RADIUS, VERBS } from './config.js';
import { conePolygon, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE } from './vision.js';
import { LEVELS } from './levels.js';

const TOP_H = 52;
const FIELD_W = COLS * TILE;
const FIELD_H = ROWS * TILE;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || '#232c47';
  rr(ctx, x, y, w, h, 3);
  ctx.fill();
  if (frac > 0.01) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(6, w * Math.min(1, frac)), h, 3);
    ctx.fill();
  }
}

function label(ctx, x, y, text, size, color, weight, align) {
  ctx.fillStyle = color || COLORS.textDim;
  ctx.font = (weight || '600') + ' ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

export function drawGame(ctx, G) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0b0f1c';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawTopBar(ctx, G);
  drawField(ctx, G);
  drawRightPanel(ctx, G);
  drawVerbStrip(ctx, G);
  if (G.banner) drawBanner(ctx, G);
  if (G.screen === 'title') drawTitle(ctx, G);
  else if (G.screen === 'levelComplete') drawLevelComplete(ctx, G);
  else if (G.screen === 'caught') drawCaught(ctx, G);
  else if (G.screen === 'gameOver') drawGameOver(ctx, G);
  else if (G.screen === 'campaignComplete') drawCampaignComplete(ctx, G);
  else if (G.screen === 'paused') drawPaused(ctx, G);
}

// ---- top bar ---------------------------------------------------------------
function drawTopBar(ctx, G) {
  const def = LEVELS[G.levelIndex];
  ctx.fillStyle = '#101728';
  ctx.fillRect(0, 0, CANVAS_W, TOP_H);
  ctx.fillStyle = '#2a3552';
  ctx.fillRect(0, TOP_H - 1, CANVAS_W, 1);
  // Level badge
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.arc(30, 26, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101728';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(G.levelIndex + 1), 30, 27);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(def.name, 54, 30);
  // Objective
  ctx.fillStyle = COLORS.textGold;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('◆  ' + def.objective, 330, 30);
  // Timer + score, right side
  const mm = String(Math.floor(G.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(G.time % 60)).padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('TIME', 1060, 20);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(mm + ':' + ss, 1060, 42);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('SCORE', 1180, 20);
  ctx.fillStyle = COLORS.textGold;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(String(G.score), 1180, 42);
  ctx.textAlign = 'left';
  // Level dots
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < G.levelIndex ? '#39d98a' : (i === G.levelIndex ? '#ffd94a' : '#2a3552');
    ctx.beginPath();
    ctx.arc(1240 + i * 14, 26, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- the level -------------------------------------------------------------
function drawField(ctx, G) {
  const p = G.parsed;
  ctx.save();
  ctx.beginPath();
  ctx.rect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
  ctx.clip();
  // Floor checker
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const x = FIELD_X + cx * TILE;
      const y = FIELD_Y + cy * TILE;
      ctx.fillStyle = (cx + cy) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
    }
  }
  // Carpet: one designed room per night, so the floor reads as a place.
  const carpet = [
    { x: 11, y: 7, w: 10, h: 6, c: 'rgba(146, 52, 58, 0.30)' },
    { x: 22, y: 1, w: 9, h: 5, c: 'rgba(42, 110, 120, 0.30)' },
    { x: 11, y: 14, w: 10, h: 5, c: 'rgba(96, 62, 140, 0.30)' },
  ][G.levelIndex];
  ctx.fillStyle = carpet.c;
  ctx.fillRect(FIELD_X + carpet.x * TILE, FIELD_Y + carpet.y * TILE, carpet.w * TILE, carpet.h * TILE);
  ctx.strokeStyle = 'rgba(232, 236, 245, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(FIELD_X + carpet.x * TILE + 3, FIELD_Y + carpet.y * TILE + 3,
    carpet.w * TILE - 6, carpet.h * TILE - 6);
  // Hedges, crates, walls
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const x = FIELD_X + cx * TILE;
      const y = FIELD_Y + cy * TILE;
      const t = p.rows[cy][cx];
      if (t === '#') {
        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, 22);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 4);
      } else if (t === 'H') {
        drawHedge(ctx, x, y);
      } else if (t === 'C') {
        drawCrate(ctx, x, y);
      }
    }
  }
  // Lamp pools of light (lit lamps) — the light/shadow read.
  for (const lamp of p.lamps) {
    if (!lamp.lit) continue;
    const lx = FIELD_X + lamp.x;
    const ly = FIELD_Y + lamp.y;
    const g = ctx.createRadialGradient(lx, ly, 6, lx, ly, LAMP_RADIUS);
    g.addColorStop(0, 'rgba(255, 210, 122, 0.30)');
    g.addColorStop(1, 'rgba(255, 210, 122, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - LAMP_RADIUS, ly - LAMP_RADIUS, LAMP_RADIUS * 2, LAMP_RADIUS * 2);
  }
  // Vision cones (under the guards, over the floor)
  for (const guard of G.guards) {
    const poly = conePolygon(p, guard.x, guard.y, guard.angle, GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE);
    const alarming = guard.state === 'chase';
    const suspicious = guard.state === 'suspicious' || guard.state === 'search';
    ctx.fillStyle = alarming ? COLORS.coneAlarm : suspicious ? COLORS.coneSuspicious : COLORS.coneCalm;
    ctx.strokeStyle = alarming ? COLORS.coneAlarmEdge : suspicious ? COLORS.coneSuspiciousEdge : COLORS.coneCalmEdge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(FIELD_X + poly[0].x, FIELD_Y + poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(FIELD_X + poly[i].x, FIELD_Y + poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  for (const cam of G.cameras) {
    const poly = conePolygon(p, cam.x, cam.y, cam.angle, cam.range, 0.42);
    ctx.fillStyle = cam.exposure > 30 ? COLORS.coneAlarm : 'rgba(120, 190, 255, 0.30)';
    ctx.strokeStyle = 'rgba(150, 210, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(FIELD_X + poly[0].x, FIELD_Y + poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(FIELD_X + poly[i].x, FIELD_Y + poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Lasers
  for (const lz of p.lasers) {
    const y = FIELD_Y + (lz.row + 0.5) * TILE;
    const x0 = FIELD_X + lz.colFrom * TILE;
    const x1 = FIELD_X + (lz.colTo + 1) * TILE;
    ctx.strokeStyle = lz.on ? 'rgba(255, 70, 60, 0.95)' : 'rgba(255, 70, 60, 0.18)';
    ctx.lineWidth = lz.on ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    if (lz.on) {
      ctx.fillStyle = '#ff463c';
      ctx.beginPath();
      ctx.arc(x0, y, 4, 0, Math.PI * 2);
      ctx.arc(x1, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Coins, objective, exit
  for (const coin of p.coins) {
    if (coin.taken) continue;
    const cx = FIELD_X + coin.x;
    const cy = FIELD_Y + coin.y;
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6b1f';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!G.objectiveTaken) {
    const ox = FIELD_X + p.objective.x;
    const oy = FIELD_Y + p.objective.y;
    const pulse = 1 + 0.12 * Math.sin(G.now * 3);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(Math.PI / 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = COLORS.objective;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#eafff8';
    ctx.lineWidth = 2;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
    ctx.fillStyle = 'rgba(126, 240, 212, 0.18)';
    ctx.beginPath();
    ctx.arc(ox, oy, 20 + 3 * Math.sin(G.now * 3), 0, Math.PI * 2);
    ctx.fill();
  }
  drawExit(ctx, G);
  // Noise rings
  for (const ring of G.noise.rings) {
    ctx.strokeStyle = ring.color;
    ctx.globalAlpha = Math.max(0, ring.alpha);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(FIELD_X + ring.x, FIELD_Y + ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Cameras
  for (const cam of G.cameras) drawCamera(ctx, cam);
  // Guards
  for (const guard of G.guards) drawGuard(ctx, guard, G);
  // Player
  drawPlayer(ctx, G);
  // Lamps on top
  for (const lamp of p.lamps) {
    const lx = FIELD_X + lamp.x;
    const ly = FIELD_Y + lamp.y;
    ctx.fillStyle = '#3a466b';
    ctx.fillRect(lx - 2, ly - 2, 4, 4);
    ctx.fillStyle = lamp.lit ? COLORS.lampLit : COLORS.lampOut;
    ctx.beginPath();
    ctx.arc(lx, ly, lamp.lit ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    if (lamp.lit) {
      ctx.strokeStyle = 'rgba(255, 210, 122, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(lx, ly, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
  // Field frame
  ctx.strokeStyle = '#2a3552';
  ctx.lineWidth = 2;
  ctx.strokeRect(FIELD_X - 1, FIELD_Y - 1, FIELD_W + 2, FIELD_H + 2);
}

function drawHedge(ctx, x, y) {
  ctx.fillStyle = COLORS.hedgeDark;
  rr(ctx, x + 2, y + 2, TILE - 4, TILE - 4, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.hedge;
  for (const [ox, oy, r] of [[9, 10, 6], [20, 9, 6], [14, 19, 6], [24, 20, 5], [8, 21, 5]]) {
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hedgeLight;
  ctx.beginPath();
  ctx.arc(x + 12, y + 12, 3, 0, Math.PI * 2);
  ctx.arc(x + 21, y + 18, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrate(ctx, x, y) {
  ctx.fillStyle = COLORS.crateDark;
  ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = COLORS.crate;
  ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
  ctx.strokeStyle = COLORS.crateLight;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + TILE - 4, y + TILE - 4);
  ctx.moveTo(x + TILE - 4, y + 4);
  ctx.lineTo(x + 4, y + TILE - 4);
  ctx.stroke();
}

function drawExit(ctx, G) {
  const p = G.parsed;
  const ex = FIELD_X + p.exit.x;
  const ey = FIELD_Y + p.exit.y;
  const open = G.exitOpen;
  ctx.fillStyle = open ? 'rgba(57, 217, 138, 0.25)' : 'rgba(201, 79, 79, 0.18)';
  ctx.beginPath();
  ctx.arc(ex, ey, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = open ? COLORS.exitOpen : COLORS.exitLocked;
  rr(ctx, ex - 13, ey - 13, 26, 26, 5);
  ctx.fill();
  ctx.fillStyle = '#0b0f1c';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? '▶' : '✕', ex, ey + 1);
  ctx.textAlign = 'left';
  label(ctx, ex - 12, ey - 20, open ? 'EXIT OPEN' : 'EXIT', 10, open ? '#39d98a' : '#ff9d9d', '700');
}

function drawCamera(ctx, cam) {
  const cx = FIELD_X + cam.x;
  const cy = FIELD_Y + cam.y;
  ctx.fillStyle = '#2a3552';
  ctx.fillRect(cx - 6, cy - 6, 12, 12);
  ctx.fillStyle = '#8cc8ff';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8cc8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(cam.angle) * 14, cy + Math.sin(cam.angle) * 14);
  ctx.stroke();
  label(ctx, cx - 8, cy - 12, 'CAM', 9, '#8cc8ff', '700');
}

function drawGuard(ctx, guard, G) {
  const gx = FIELD_X + guard.x;
  const gy = FIELD_Y + guard.y;
  const alarming = guard.state === 'chase';
  // Body
  ctx.fillStyle = alarming ? '#7a2b26' : COLORS.guard;
  ctx.beginPath();
  ctx.arc(gx, gy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alarming ? '#ff5347' : COLORS.guardTrim;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Facing nose
  ctx.fillStyle = '#e8ecf5';
  ctx.beginPath();
  ctx.arc(gx + Math.cos(guard.angle) * 8, gy + Math.sin(guard.angle) * 8, 3, 0, Math.PI * 2);
  ctx.fill();
  // Name tag
  ctx.fillStyle = '#cdd6ea';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, gx, gy - 17);
  ctx.textAlign = 'left';
  // Suspicion bubble
  if (guard.mark) {
    const bx = gx + 14;
    const by = gy - 22;
    ctx.fillStyle = alarming ? '#ff5347' : '#ffd25a';
    ctx.beginPath();
    ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101728';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(guard.mark, bx, by + 0.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (!alarming) {
      label(ctx, gx - 42, gy + 30, 'WHAT WAS THAT?', 10, '#ffd25a', '700');
    }
  }
}

function drawPlayer(ctx, G) {
  const pl = G.player;
  const px = FIELD_X + pl.x;
  const py = FIELD_Y + pl.y;
  // Soft shadow under the thief
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(px, py + 9, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const r = pl.crouched ? 9 : 11;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.playerHood;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood + facing
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath();
  ctx.arc(px + Math.cos(pl.angle) * 4, py + Math.sin(pl.angle) * 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.arc(px + Math.cos(pl.angle) * 6, py + Math.sin(pl.angle) * 6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (pl.hidden) {
    label(ctx, px - 24, py - 18, 'HIDDEN', 10, '#57b878', '700');
  } else if (pl.crouched) {
    label(ctx, px - 26, py - 18, 'CROUCHED', 10, '#9aa7c4', '700');
  }
}

// ---- right panel -----------------------------------------------------------
function drawRightPanel(ctx, G) {
  const x = PANEL_X;
  const w = PANEL_W;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, TOP_H, w, CANVAS_H - TOP_H);
  ctx.fillStyle = COLORS.panelEdge;
  ctx.fillRect(x, TOP_H, 1, CANVAS_H - TOP_H);
  const px = x + 14;
  let y = TOP_H + 24;
  // Detection state — one big word.
  label(ctx, px, y, 'DETECTION', 11, COLORS.textDim, '700');
  y += 30;
  const state = G.alarmState;
  const stateColor = state === 'SPOTTED' ? '#ff5347' : state === 'CALM' ? '#39d98a' : '#ffd25a';
  const stateMark = state === 'SPOTTED' ? '!' : state === 'CALM' ? '' : '?';
  ctx.fillStyle = stateColor;
  rr(ctx, px, y - 20, w - 28, 34, 5);
  ctx.fill();
  ctx.fillStyle = '#101728';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state + (stateMark ? '  ' + stateMark : ''), px + 10, y + 4);
  y += 30;
  label(ctx, px, y, state === 'CALM' ? 'Unseen. Move quietly.'
    : state === 'SPOTTED' ? 'They see you — break line of sight!'
    : 'Something caught an eye. Freeze.', 11, COLORS.textDim);
  y += 26;
  // Bars
  label(ctx, px, y, 'ALARM', 11, COLORS.textDim, '700');
  label(ctx, x + w - 14, y, state === 'CALM' ? 'QUIET' : state, 11, stateColor, '700', 'right');
  y += 8;
  bar(ctx, px, y, w - 28, 8, G.suspicion / 100, stateColor);
  y += 26;
  label(ctx, px, y, 'VISIBILITY', 11, COLORS.textDim, '700');
  const visText = G.player.hidden ? 'HIDDEN' : G.player.lit ? 'IN LIGHT' : 'IN SHADOW';
  const visColor = G.player.hidden ? '#39d98a' : G.player.lit ? '#ffb08a' : '#8cc8ff';
  label(ctx, x + w - 14, y, visText, 11, visColor, '700', 'right');
  y += 8;
  bar(ctx, px, y, w - 28, 8, G.player.lit ? 0.85 : G.player.hidden ? 0.08 : 0.35,
    visColor);
  y += 26;
  label(ctx, px, y, 'NOISE', 11, COLORS.textDim, '700');
  const noiseText = G.player.sprinting ? 'LOUD' : G.player.sneaking ? 'SILENT' : 'QUIET';
  label(ctx, x + w - 14, y, noiseText, 11, G.player.sprinting ? '#ffb08a' : '#39d98a', '700', 'right');
  y += 8;
  bar(ctx, px, y, w - 28, 8, G.player.sprinting ? 0.8 : G.player.sneaking ? 0.05 : 0.25,
    G.player.sprinting ? '#ffb08a' : '#39d98a');
  y += 24;
  // Loot / goal
  label(ctx, px, y, 'LOOT', 11, COLORS.textDim, '700');
  label(ctx, px + 110, y, 'PEBBLES', 11, COLORS.textDim, '700');
  y += 20;
  ctx.fillStyle = COLORS.textGold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(G.coinsTaken + ' / ' + G.coinsTotal, px, y);
  ctx.fillText('●'.repeat(Math.max(0, G.player.pebbles)) + '○'.repeat(Math.max(0, 3 - G.player.pebbles)), px + 110, y);
  y += 24;
  label(ctx, px, y, 'SPOTTED  ' + G.spottedCount + '   ·   STRIKES  ' + G.strikes + '/3', 11, COLORS.textDim, '700');
  y += 22;
  label(ctx, px, y, 'GOAL', 11, COLORS.textDim, '700');
  ctx.fillStyle = G.objectiveTaken ? '#39d98a' : COLORS.textGold;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(G.objectiveTaken ? '✓  ' + G.goalShort + ' — TAKEN' : G.goalShort, px, y + 18);
  y += 34;
  label(ctx, px, y, G.exitOpen ? '→  EXIT OPEN — EXTRACT!' : '→  Exit locked until the goal is taken', 11,
    G.exitOpen ? '#39d98a' : COLORS.textDim, '700');
  y += 22;
  // Patrol roster + footsteps
  label(ctx, px, y, 'PATROL ROSTER', 11, COLORS.textDim, '700');
  label(ctx, x + w - 14, y, 'FOOTSTEPS ' + (G.nearestGuardDist < 999 ? Math.round(G.nearestGuardDist / 32) + 'm' : '—'), 11,
    G.nearestGuardDist < 130 ? '#ffb08a' : COLORS.textDim, '700', 'right');
  y += 18;
  for (const guard of G.guards) {
    const d = Math.round(Math.hypot(guard.x - G.player.x, guard.y - G.player.y) / 32);
    ctx.fillStyle = guard.alertColor;
    ctx.beginPath();
    ctx.arc(px + 5, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, px + 14, y, guard.name + '  ·  ' + guard.state.toUpperCase(), 11, COLORS.text);
    label(ctx, x + w - 14, y, d + 'm', 11, COLORS.textDim, '400', 'right');
    y += 15;
  }
  y += 4;
  // Tactical map
  label(ctx, px, y, 'TACTICAL MAP', 11, COLORS.textDim, '700');
  y += 8;
  const mw = w - 28;
  const mh = 70;
  ctx.fillStyle = '#0b0f1c';
  ctx.fillRect(px, y, mw, mh);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.strokeRect(px, y, mw, mh);
  const sx = mw / FIELD_W;
  const sy = mh / FIELD_H;
  for (const guard of G.guards) {
    ctx.fillStyle = guard.alertColor;
    ctx.beginPath();
    ctx.arc(px + guard.x * sx, y + guard.y * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const cam of G.cameras) {
    ctx.fillStyle = '#8cc8ff';
    ctx.fillRect(px + cam.x * sx - 2, y + cam.y * sy - 2, 4, 4);
  }
  if (!G.objectiveTaken) {
    ctx.fillStyle = COLORS.objective;
    ctx.fillRect(px + G.parsed.objective.x * sx - 3, y + G.parsed.objective.y * sy - 3, 6, 6);
  }
  ctx.fillStyle = G.exitOpen ? '#39d98a' : '#c94f4f';
  ctx.fillRect(px + G.parsed.exit.x * sx - 3, y + G.parsed.exit.y * sy - 3, 6, 6);
  ctx.fillStyle = '#efe7d3';
  ctx.beginPath();
  ctx.arc(px + G.player.x * sx, y + G.player.y * sy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  y += mh + 8;
  // Legend
  label(ctx, px, y, 'LEGEND', 11, COLORS.textDim, '700');
  y += 15;
  const legend = [
    ['#8cc8ff', 'Guard + vision cone'],
    ['#2e7d4f', 'Hedge: crouch to hide'],
    ['#8a6b3f', 'Crate: blocks sight'],
    ['#ffd27a', 'Lamp: E to douse it'],
    ['#7ef0d4', 'Objective item'],
    ['#39d98a', 'Exit: opens with goal'],
  ];
  for (const [c, t] of legend) {
    ctx.fillStyle = c;
    ctx.fillRect(px, y - 9, 10, 10);
    label(ctx, px + 16, y, t, 11, COLORS.text);
    y += 13;
  }
  y += 2;
  label(ctx, px, y, 'CONTROLS', 11, COLORS.textDim, '700');
  y += 14;
  label(ctx, px, y, 'WASD move · SHIFT sneak', 11, COLORS.text);
  y += 13;
  label(ctx, px, y, 'SPACE sprint (loud) · C crouch', 11, COLORS.text);
  y += 13;
  label(ctx, px, y, 'Q / CLICK throw pebble · E douse', 11, COLORS.text);
  y += 13;
  label(ctx, px, y, 'R retry · ESC pause · M mute', 11, COLORS.text);
}

// ---- bottom verb strip -----------------------------------------------------
function drawVerbStrip(ctx, G) {
  const y = CANVAS_H - 20;
  ctx.fillStyle = '#101728';
  ctx.fillRect(FIELD_X, y, FIELD_W, 20);
  let x = FIELD_X + 10;
  for (const v of VERBS) {
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(v, x, y + 14);
    x += ctx.measureText(v).width + 18;
    if (v !== VERBS[VERBS.length - 1]) {
      ctx.fillStyle = '#2a3552';
      ctx.fillText('·', x - 10, y + 14);
    }
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(G.hint || 'Patience pays. Wait for the cone to turn.', FIELD_X + FIELD_W - 10, y + 14);
  ctx.textAlign = 'left';
}

// ---- banners & overlays ----------------------------------------------------
function drawBanner(ctx, G) {
  const b = G.banner;
  const bx = FIELD_X + FIELD_W / 2;
  const by = FIELD_Y + 54;
  ctx.save();
  ctx.fillStyle = b.color;
  const w = ctx.measureText(b.text).width + 60;
  ctx.font = 'bold 26px system-ui, sans-serif';
  const ww = ctx.measureText(b.text).width + 60;
  rr(ctx, bx - ww / 2, by - 26, ww, 44, 6);
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#101728';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, bx, by - 3);
  ctx.textBaseline = 'alphabetic';
  if (b.sub) {
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(b.sub, bx, by + 34);
  }
  ctx.restore();
  ctx.textAlign = 'left';
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 16, 0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#121827';
  rr(ctx, 340, 150, 600, 400, 10);
  ctx.fill();
  ctx.strokeStyle = accent || '#ffd94a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = accent || '#ffd94a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 220);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px system-ui, sans-serif';
  let y = 268;
  for (const line of lines) {
    ctx.fillText(line, 640, y);
    y += 28;
  }
  ctx.textAlign = 'left';
}

function drawTitle(ctx, G) {
  overlay(ctx, 'NIGHTJAR', [
    'A quiet heist in three nights.',
    '',
    'Slip past the wardens. Steal the prize. Leave unseen.',
    'Hide in hedges · Douse the lamps · Throw pebbles to lure guards away',
    'Sprint and you will be heard — every footstep draws a ring they follow.',
    '',
    'WASD move · SHIFT sneak · SPACE sprint · C crouch',
    'Q / CLICK throw pebble · E douse a lamp · R retry',
    '',
    'Press ENTER to begin Night 1 — The Ink Archive',
  ], '#ffd94a');
}

function drawLevelComplete(ctx, G) {
  const ghost = G.spottedCount === 0;
  overlay(ctx, 'NIGHT COMPLETE', [
    LEVELS[G.levelIndex].name + ' — cleared unseen: ' + (ghost ? 'YES · GHOST BONUS +300' : 'no'),
    'Loot ' + G.coinsTaken + ' / ' + G.coinsTotal + '  ·  Time ' +
      String(Math.floor(G.time / 60)).padStart(2, '0') + ':' + String(Math.floor(G.time % 60)).padStart(2, '0'),
    'Score ' + G.score,
    '',
    'Press ENTER for the next night',
  ], '#39d98a');
}

function drawCaught(ctx, G) {
  overlay(ctx, 'CAUGHT!', [
    'A warden laid hands on the nightjar.',
    'Strikes: ' + G.strikes + ' / 3 — the night restarts where you began.',
    'Next time: wait for the cone to turn, or throw a pebble first.',
    '',
    'Press ENTER to slip back in',
  ], '#ff5347');
}

function drawGameOver(ctx, G) {
  overlay(ctx, 'THE NIGHT ENDS', [
    'Three strikes — the archive keeps its ledger tonight.',
    'Score ' + G.score,
    '',
    'Press ENTER to try the night again',
  ], '#ff5347');
}

function drawCampaignComplete(ctx, G) {
  overlay(ctx, 'THE QUIET HEIST', [
    'All three nights, all three prizes — and never once caught in the act.',
    'Final score ' + G.score,
    '',
    'Press ENTER to play again from Night 1',
  ], '#7ef0d4');
}

function drawPaused(ctx, G) {
  overlay(ctx, 'PAUSED', [
    'The wardens wait. The nightjar waits longer.',
    '',
    'Press ESC to keep sneaking',
  ], '#8cc8ff');
}
