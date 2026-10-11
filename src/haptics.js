// Phones only let a page switch the vibration motor on and off; there's no
// strength setting. Strength is faked by pulsing faster than the hand can tell
// apart (pulse-width modulation, as in the Pulsar library): in each 25 ms
// period the motor runs for longer the stronger the moment should feel.
//
// What to feel, and how strongly, is `hapticAt(t)` in soundDesign.js: a
// strength from 0 to 1 over the film. This turns the next second of it into a
// navigator.vibrate pattern and re-sends it as the film plays. Chrome caps a
// pattern at 99 entries, which a second of pulses stays under. Short chunks
// also mean a seek or a pause takes effect at once.

import { hapticAt } from './soundDesign.js';

const PERIOD = 25; // ms
const CHUNK = 1.0; // s of pattern per call
const REFRESH = 0.6; // s before the chunk runs out, send the next one
const MIN_ON = 5; // ms; shorter pulses don't spin the motor up

// strength 0..1 over [from, from + CHUNK) → [on, off, on, off, …] in ms, or null if nothing to feel
function render(from) {
  const segs = [];
  const add = (on, ms) => {
    if (ms <= 0) return;
    const last = segs[segs.length - 1];
    if (last && last[0] === on) last[1] += ms;
    else segs.push([on, ms]);
  };
  let any = false;
  for (let ms = 0; ms < CHUNK * 1000; ms += PERIOD) {
    const s = hapticAt(from + (ms + PERIOD / 2) / 1000);
    const on = s < 0.06 ? 0 : s > 0.94 ? PERIOD : Math.round(MIN_ON + s * (PERIOD - MIN_ON));
    if (on) any = true;
    add(true, on);
    add(false, PERIOD - on);
  }
  if (!any) return null;
  if (!segs[0][0]) segs.unshift([true, 0]); // a pattern always starts with a vibration
  return segs.map((s) => s[1]);
}

export class Haptics {
  constructor() {
    this.from = null; // film time the current chunk started at
    this.sentAt = 0; // when it was sent (performance.now, s)
    this.on = false;
  }

  // Each frame. lag = the audio's output latency (s): the film time being
  // heard right now is t - lag, and that's what the hand should feel.
  update(t, playing, lag = 0) {
    if (!navigator.vibrate) return;
    if (!playing) { this.stop(); return; }
    const now = performance.now() / 1000;
    const heard = t - lag;
    if (this.from !== null) {
      const expected = this.from + (now - this.sentAt);
      // still in step and the chunk has time left: nothing to do
      if (Math.abs(heard - expected) < 0.12 && expected < this.from + REFRESH) return;
    }
    const pattern = render(heard);
    this.from = heard;
    this.sentAt = now;
    if (pattern) { navigator.vibrate(pattern); this.on = true; }
    else if (this.on) { navigator.vibrate(0); this.on = false; }
  }

  stop() {
    this.from = null;
    if (this.on) { navigator.vibrate(0); this.on = false; }
  }
}
