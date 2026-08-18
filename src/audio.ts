let ctx: AudioContext | null = null;
let muted = false;

export function initAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(m: boolean) {
  muted = m;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.14, when = 0, slide = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.06);
}

function noise(dur: number, vol = 0.2, when = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(g);
  g.connect(ctx.destination);
  src.start(t);
}

export const sfx = {
  click() {
    tone(660, 0.07, 'triangle', 0.09);
  },
  move() {
    tone(310, 0.09, 'sine', 0.15, 0, -90);
  },
  deploy() {
    tone(392, 0.12, 'triangle', 0.13);
    tone(587, 0.15, 'triangle', 0.11, 0.07);
  },
  draw() {
    tone(520, 0.09, 'sine', 0.11, 0, 150);
  },
  hit() {
    noise(0.12, 0.16);
    tone(165, 0.12, 'sawtooth', 0.11, 0, -60);
  },
  kill() {
    noise(0.26, 0.22);
    tone(220, 0.32, 'sawtooth', 0.15, 0, -165);
    tone(110, 0.3, 'square', 0.08, 0.04, -50);
  },
  promote() {
    [523, 659, 784].forEach((f, i) => tone(f, 0.15, 'triangle', 0.12, i * 0.09));
  },
  error() {
    tone(120, 0.13, 'square', 0.09, 0, -30);
  },
  win() {
    [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'triangle', 0.13, i * 0.13));
    noise(0.4, 0.06, 0.5);
  },
  lose() {
    [392, 311, 262, 196].forEach((f, i) => tone(f, 0.26, 'sawtooth', 0.1, i * 0.15));
  },
};
