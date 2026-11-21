// audio.js — every sound is synthesized with WebAudio, no audio files.
// Footsteps are the point: a guard's steps tick louder as it closes in, so
// you can hear where a guard is before you see its cone. Nothing here loads
// over the network, and the context only starts after the first key press.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.lastStepAt = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  blip(freq, dur, type, gain, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // A guard's footstep: a low tick. Volume falls with distance, so the sound
  // itself tells you how close the guard is. Called on each guard step.
  guardFootstep(distPx) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (now - this.lastStepAt < 90) return;
    this.lastStepAt = now;
    const vol = Math.max(0.02, 0.22 * (1 - distPx / 420));
    this.blip(95, 0.07, 'triangle', vol);
  }

  playerStep(loud) {
    if (!this.ctx || this.muted) return;
    this.blip(loud ? 160 : 120, 0.05, 'triangle', loud ? 0.12 : 0.05);
  }

  coinPickup() {
    this.blip(880, 0.12, 'sine', 0.16);
    this.blip(1318, 0.16, 'sine', 0.12, 0.07);
  }

  objectivePickup() {
    [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.22, 'sine', 0.14, i * 0.09));
  }

  pebbleClink() {
    this.blip(1900, 0.06, 'square', 0.07);
    this.blip(1500, 0.08, 'square', 0.05, 0.06);
  }

  douseHiss() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = 0.35;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = 0.12;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  alarmSting() {
    this.blip(220, 0.3, 'sawtooth', 0.14);
    this.blip(311, 0.3, 'sawtooth', 0.12, 0.12);
  }

  caughtSting() {
    [440, 349, 262].forEach((f, i) => this.blip(f, 0.3, 'sawtooth', 0.13, i * 0.14));
  }

  levelClear() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.blip(f, 0.3, 'sine', 0.13, i * 0.1));
  }
}
