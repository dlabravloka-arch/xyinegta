// Synthesised SFX — no external assets required. Builds a screamer-style
// sound, weapon shots, and a knife slash via WebAudio.

export class AudioFx {
  constructor() {
    this.ctx = null;
  }

  _ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  fire(weapon) {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    if (weapon === "knife") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(800, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.18);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.2);
      return;
    }
    // gun shot: noise burst + low click
    const buf = ctx.createBuffer(1, 0.18 * ctx.sampleRate, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      const k = i / ch.length;
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = weapon === "shotgun" ? 1100 : 2200;
    const ng = ctx.createGain();
    ng.gain.value = weapon === "shotgun" ? 0.6 : 0.32;
    noise.connect(filter).connect(ng).connect(ctx.destination);
    noise.start(t);

    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(weapon === "shotgun" ? 90 : 160, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    og.gain.setValueAtTime(0.5, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.13);
  }

  scream() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const dur = 1.6;

    // dissonant detuned voices
    for (const detune of [-30, 0, 25, 50]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(900, t);
      o.frequency.exponentialRampToValueAtTime(180, t + dur);
      o.detune.value = detune;
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.05);
      g.gain.linearRampToValueAtTime(0.18, t + dur - 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    // noise layer
    const buf = ctx.createBuffer(1, dur * ctx.sampleRate, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0, t);
    ng.gain.linearRampToValueAtTime(0.5, t + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    noise.connect(filter).connect(ng).connect(ctx.destination);
    noise.start(t);
  }

  hit() {
    const ctx = this._ensure();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.13);
  }
}
