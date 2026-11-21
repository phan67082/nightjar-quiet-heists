// input.js — keyboard and mouse, nothing else. WASD or arrows to move,
// Shift to sneak, Space to sprint, C to crouch, E to douse a lamp, Q or a
// mouse click to throw a pebble, M to mute, Esc to pause, R to retry,
// Enter to confirm. Edge-triggered actions (pressed once per key press) are
// consumed by the game loop so a held key never double-fires.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, cleared each frame by consume()
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;
    this.onFirstGesture = null;
    this.gestureSeen = false;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = e.key.toLowerCase();
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
      this.noteGesture();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.clickY = ((e.clientY - r.top) / r.height) * canvas.height;
      this.mouse.clicked = true;
      this.noteGesture();
    });
  }

  noteGesture() {
    if (!this.gestureSeen) {
      this.gestureSeen = true;
      if (this.onFirstGesture) this.onFirstGesture();
    }
  }

  isDown(k) {
    return this.keys.has(k);
  }

  wasPressed(k) {
    return this.pressed.has(k);
  }

  // Movement vector from WASD or arrow keys, normalised.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.isDown('a') || this.isDown('arrowleft')) x -= 1;
    if (this.isDown('d') || this.isDown('arrowright')) x += 1;
    if (this.isDown('w') || this.isDown('arrowup')) y -= 1;
    if (this.isDown('s') || this.isDown('arrowdown')) y += 1;
    return { x, y };
  }

  consume() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
