// config.js — every tunable number for NIGHTJAR lives here, and nowhere else.
// The game is a top-down stealth heist in three nights. One canvas, 1280x720.
// The playfield is a 32x20 tile grid (tile 32px) on the left; a HUD panel sits right.
export const TILE = 32;
export const COLS = 32;
export const ROWS = 20;
export const FIELD_X = 8; // playfield origin, px
export const FIELD_Y = 60;
export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const PANEL_X = 1040; // right HUD panel origin, px
export const PANEL_W = 240;

export const PLAYER_RADIUS = 11;
export const PLAYER_WALK_SPEED = 118; // px per second
export const PLAYER_SNEAK_SPEED = 62;
export const PLAYER_SPRINT_SPEED = 178;
export const PLAYER_CROUCH_SPEED = 48;

export const GUARD_SPEED_PATROL = 52;
export const GUARD_SPEED_SUSPICIOUS = 74;
export const GUARD_SPEED_CHASE = 132;
export const GUARD_VIEW_RANGE = 208; // px, about 6.5 tiles
export const GUARD_VIEW_HALF_ANGLE = 0.61; // radians, ~35 degrees each side
export const GUARD_HEAR_RADIUS = 170; // pebble ring reach, px
export const GUARD_CATCH_RADIUS = 17; // px, touching the player while alarmed

// Suspicion fills 0..100. How fast it fills depends on light, stance and range.
export const SUSPICION_FILL_LIT = 46; // per second, player lit and in the cone
export const SUSPICION_FILL_SHADOW = 17; // per second, player in shadow, in the cone
export const SUSPICION_FILL_CROUCH = 9; // per second, crouched in the cone
export const SUSPICION_DECAY = 13; // per second, unseen
export const SUSPICION_SEARCH_AT = 34; // "?" — guard comes to look
export const SUSPICION_ALARM_AT = 100; // "!" — guards chase
export const ALARM_CALM_AFTER = 5.0; // seconds unseen before the alarm cools
export const SEARCH_LOOK_AROUND = 2.4; // seconds a guard scans a spot

export const LAMP_RADIUS = 96; // px of light around a lit lamp
export const NOISE_SPRINT_RADIUS = 96; // sprint footsteps are heard this far
export const NOISE_PEBBLE_RADIUS = 190; // a thrown pebble rings this far
export const MAX_PEBBLES = 3;

export const STRIKES_PER_LEVEL = 3;
export const SCORE_COIN = 50;
export const SCORE_OBJECTIVE = 200;
export const SCORE_GHOST_BONUS = 300;
export const SCORE_LEVEL_CLEAR = 150;

export const COLORS = {
  floorA: '#1c2438',
  floorB: '#202a41',
  floorEdge: '#141a29',
  wall: '#39466b',
  wallTop: '#4d5d8a',
  wallDark: '#232c47',
  hedge: '#2e7d4f',
  hedgeDark: '#1f5c38',
  hedgeLight: '#57b878',
  crate: '#8a6b3f',
  crateDark: '#6b4f2a',
  crateLight: '#b08d55',
  lampLit: '#ffd27a',
  lampOut: '#5a6478',
  coin: '#ffd94a',
  objective: '#7ef0d4',
  exitLocked: '#c94f4f',
  exitOpen: '#39d98a',
  player: '#efe7d3',
  playerHood: '#2b3350',
  guard: '#31406b',
  guardTrim: '#ff9d3c',
  guardAlarm: '#ff5347',
  coneCalm: 'rgba(140, 200, 255, 0.30)',
  coneCalmEdge: 'rgba(170, 220, 255, 0.55)',
  coneSuspicious: 'rgba(255, 210, 90, 0.38)',
  coneSuspiciousEdge: 'rgba(255, 220, 120, 0.70)',
  coneAlarm: 'rgba(255, 84, 66, 0.42)',
  coneAlarmEdge: 'rgba(255, 110, 95, 0.80)',
  text: '#e8ecf5',
  textDim: '#9aa7c4',
  textGold: '#ffd94a',
  panel: '#121827',
  panelEdge: '#2a3552',
  shadow: 'rgba(6, 8, 16, 0.55)',
};

export const VERBS = ['SNEAK', 'HIDE', 'DISTRACT', 'EXTRACT'];
