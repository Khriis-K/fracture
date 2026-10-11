// The song runs through a small effects chain that follows the film:
//
//   song ─┬─ analyser (beat detection reads the clean song)
//         └─ width (M/S) → lowpass → highpass → frost shelf → presence → level → dry ─┐
//                                                                  └─ reverb → wet ────┼─ master → limiter → out
//   beds (wind, fire, lake, paper…) → gain → L/R → 3D panners ─────┤
//   one-shots + heartbeat + ripples → (3D panners) → sfx ──────────┘
//
// Everything 3D is heard from one listener at the origin, facing -z, who turns
// their head a little with the pointer (or the phone's tilt).
//
// What plays when lives in soundDesign.js. Any sample that fails to load
// falls back to a synthesized stand-in (or silence), so the film never
// depends on them.

import { FILES, BEDS, CUES, CODA, envelope } from './soundDesign.js';
import { Haptics } from './haptics.js';

const lerp = (a, b, k) => a + (b - a) * k;
const RAD = Math.PI / 180;

// AudioParams where supported, the old setters on older Safari
function setPosition(node, x, y, z, now) {
  if (node.positionX) {
    node.positionX.setTargetAtTime(x, now, 0.1);
    node.positionY.setTargetAtTime(y, now, 0.1);
    node.positionZ.setTargetAtTime(z, now, 0.1);
  } else node.setPosition(x, y, z);
}

function hrtfPanner(ctx, refDistance) {
  const p = ctx.createPanner();
  p.panningModel = 'HRTF';
  p.distanceModel = 'inverse';
  p.refDistance = refDistance;
  return p;
}

function impulse(ctx, seconds = 3.6, decay = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

// Fold the tail of a recording over its head so it loops with no seam.
function makeLoop(ctx, buf, xfade = 1.5) {
  const sr = buf.sampleRate;
  const margin = Math.floor(0.06 * sr);        // skip decoder padding at both ends
  const x = Math.floor(xfade * sr);
  const len = buf.length - 2 * margin - x;
  if (len <= x) return buf;
  const out = ctx.createBuffer(buf.numberOfChannels, len, sr);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const src = buf.getChannelData(c), dst = out.getChannelData(c);
    for (let i = 0; i < len; i++) dst[i] = src[margin + i];
    for (let i = 0; i < x; i++) {
      const k = i / x;
      dst[i] = src[margin + i] * Math.sqrt(k) + src[margin + len + i] * Math.sqrt(1 - k);
    }
  }
  return out;
}

export class Soundscape {
  constructor(audio) {
    this.audio = audio;
    this.ctx = null;
    this.analyser = null;
    this.samples = {};
    this.lastT = 0;
    this.codaAt = null;
    this.haptics = new Haptics();
  }

  init() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const src = ctx.createMediaElementSource(this.audio);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.6;
    src.connect(this.analyser);

    // stereo width: mid/side matrix, side gain = width
    const split = ctx.createChannelSplitter(2);
    const merge = ctx.createChannelMerger(2);
    const g = (v) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    const lToMid = g(0.5), rToMid = g(0.5), lToSide = g(0.5), rToSide = g(-0.5);
    const mid = g(1), side = (this.side = g(1)), sideInv = g(-1);
    src.connect(split);
    split.connect(lToMid, 0); split.connect(rToMid, 1);
    split.connect(lToSide, 0); split.connect(rToSide, 1);
    lToMid.connect(mid); rToMid.connect(mid);
    lToSide.connect(side); rToSide.connect(side);
    mid.connect(merge, 0, 0); mid.connect(merge, 0, 1);
    side.connect(merge, 0, 0); side.connect(sideInv); sideInv.connect(merge, 0, 1);

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 20000;
    this.lowpass.Q.value = 0.9;
    this.highpass = ctx.createBiquadFilter();
    this.highpass.type = 'highpass';
    this.highpass.frequency.value = 20;
    this.shelf = ctx.createBiquadFilter();
    this.shelf.type = 'highshelf';
    this.shelf.frequency.value = 2800;
    this.shelf.gain.value = 0;
    this.presence = ctx.createBiquadFilter();
    this.presence.type = 'peaking';
    this.presence.frequency.value = 2800;
    this.presence.Q.value = 0.9;
    this.presence.gain.value = 0;
    this.level = g(1);
    merge.connect(this.lowpass);
    this.lowpass.connect(this.highpass);
    this.highpass.connect(this.shelf);
    this.shelf.connect(this.presence);
    this.presence.connect(this.level);

    this.master = ctx.createGain();
    this.dry = g(1);
    this.wet = g(0);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulse(ctx);
    // the song ducks for a moment on each heartbeat, so the beat punches through it (pump())
    this.duck = g(1);
    this.level.connect(this.duck);
    this.duck.connect(this.dry);
    this.duck.connect(this.reverb);
    this.reverb.connect(this.wet);
    this.dry.connect(this.master);
    this.wet.connect(this.master);

    // sound effects get a touch of the same space
    this.sfx = g(1);
    this.sfxVerb = g(0.25);
    this.sfx.connect(this.master);
    this.sfx.connect(this.sfxVerb);
    this.sfxVerb.connect(this.reverb);
    // …except sounds from inside the body, which skip the room
    this.sfxDry = g(1);
    this.sfxDry.connect(this.master);

    this.beds = {};
    this.bedBus = g(1);
    this.bedBus.connect(this.master);

    // a brickwall-ish limiter, so pushes above the song's own level (the crescendo, the hits) don't clip
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.15;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);
    this.loading = this.loadSamples();
  }

  resume() { return this.ctx?.resume(); }

  // Turn the listener's head: yaw in radians, positive to the right.
  setHeading(yaw) {
    if (!this.ctx) return;
    const l = this.ctx.listener, x = Math.sin(yaw), z = -Math.cos(yaw);
    if (l.forwardX) {
      const now = this.ctx.currentTime;
      l.forwardX.setTargetAtTime(x, now, 0.05);
      l.forwardZ.setTargetAtTime(z, now, 0.05);
    } else l.setOrientation(x, 0, z, 0, 1, 0);
  }

  // After the song: only the lake, in the dark. Cleared by endCoda() or a replay.
  startCoda() { if (this.ctx) this.codaAt = this.ctx.currentTime; }
  endCoda() { this.codaAt = null; }

  // The headphone check: a drop on the left, then one on the right.
  async checkStereo(onSide) {
    if (!this.ctx) return;
    await this.resume();
    await Promise.race([this.loading, new Promise((r) => setTimeout(r, 700))]);
    const drop = (x) => this.play('drop', { gain: 0.5, pos: [x, -0.3, -0.6], rate: 0.95 + Math.random() * 0.1 });
    for (const [side, x] of [['left', -2], ['right', 2]]) {
      onSide?.(side);
      drop(x);
      await new Promise((r) => setTimeout(r, 420));
      drop(x);
      await new Promise((r) => setTimeout(r, 900));
    }
    onSide?.(null);
  }

  // on pause or seek: a held buzz mustn't outlive the moment it belongs to
  stopHaptics() { this.haptics.stop(); }

  async loadSamples() {
    await Promise.all(FILES.map(async (name) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}media/sfx/${name}.mp3`);
        if (!res.ok || !(res.headers.get('content-type') || '').startsWith('audio')) return;
        const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
        this.samples[name] = BEDS[name] ? makeLoop(this.ctx, buf) : buf;
      } catch { /* synthesized fallback */ }
    }));
  }

  // Called every frame with the choreography values.
  update(v, t, playing) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const ramp = 0.06;

    // muffle: inside the body / under the ink. 20 kHz → ~320 Hz.
    const cutoff = 20000 * Math.pow(320 / 20000, Math.min(1, Math.max(0, v.muffle)));
    this.lowpass.frequency.setTargetAtTime(cutoff, now, ramp);
    // "not realizing I'd abandoned myself": the song thins out
    this.highpass.frequency.setTargetAtTime(lerp(20, 520, Math.max(0, v.drain) ** 1.5), now, ramp * 4);
    // frosted glass dulls the highs
    this.shelf.gain.setTargetAtTime(-13 * Math.max(0, v.frost), now, ramp);
    // the song's level (dB) and the voice's presence: the crescendo into "bul"
    this.level.gain.setTargetAtTime(10 ** (v.level / 20), now, 0.02);
    this.presence.gain.setTargetAtTime(6 * Math.max(0, v.presence), now, ramp);
    // the tunnel collapses the stereo field; the ending narrows
    const width = Math.max(0, 1 - v.tunnel * 0.85 - v.drain * 0.45 + v.flame * 0.12);
    this.side.gain.setTargetAtTime(width, now, ramp);
    // space opens up for ghosts, ink, and the ending
    const wet = Math.min(0.75, 0.05 + v.ghost * 0.22 + v.ink * 0.35 + v.muffle * 0.12 + v.drain * 0.5);
    this.wet.gain.setTargetAtTime(wet, now, ramp * 3);
    this.dry.gain.setTargetAtTime(1 - wet * 0.45, now, ramp * 3);

    // ambience beds: start each loop once its file is in, then ride its envelope
    const coda = this.codaAt === null ? null : now - this.codaAt;
    for (const name in BEDS) {
      const buf = this.samples[name];
      if (!buf) continue;
      const def = BEDS[name];
      const bed = this.beds[name] || (this.beds[name] = this.makeBed(buf, def, now));
      let target = playing ? envelope(def.gain, t) : 0;
      if (coda !== null) target = name === CODA.bed ? envelope(CODA.gain, coda) : 0;
      bed.gain.gain.setTargetAtTime(target, now, playing || coda !== null ? 0.12 : 0.25);
      this.placeBed(bed, def, t, now);
    }

    // cues fire only during normal forward playback, never on a seek
    if (playing && t > this.lastT && t - this.lastT < 0.5) {
      for (const [ct, name, opts] of CUES) {
        if (ct <= this.lastT || ct > t) continue;
        this.play(name, opts);
      }
    }
    this.lastT = t;

    // felt in step with what's heard: the output latency puts the sound a little behind t
    this.haptics.update(t, playing, this.ctx.outputLatency || this.ctx.baseLatency || 0);
  }

  // loop → low-pass → gain → split L/R → one HRTF panner per channel
  makeBed(buf, def, now) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = def.lp || 20000;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const split = ctx.createChannelSplitter(2);
    src.connect(lp); lp.connect(gain); gain.connect(split);
    // a mono file feeds both sources, at half level each so it sums back to the same loudness
    const mono = buf.numberOfChannels === 1;
    // refDistance = the bed's distance, so placement changes direction, not level
    const ref = Math.hypot(def.dist, def.y);
    const panners = [0, 1].map((c) => {
      const p = hrtfPanner(ctx, ref);
      if (mono) {
        const half = ctx.createGain();
        half.gain.value = 0.5;
        split.connect(half, 0); half.connect(p);
      } else split.connect(p, c);
      p.connect(this.bedBus);
      return p;
    });
    src.start(now, Math.random() * buf.duration);
    return { gain, panners };
  }

  placeBed(bed, def, t, now) {
    const az = (typeof def.az === 'number' ? def.az : envelope(def.az, t)) + (def.orbit || 0) * t;
    bed.panners.forEach((p, i) => {
      const a = (az + (i ? 0.5 : -0.5) * (def.spread || 0)) * RAD;
      setPosition(p, Math.sin(a) * def.dist, def.y, -Math.cos(a) * def.dist, now);
    });
  }

  // A drop where the lake was touched. x: 0..1 across, depth: 0 horizon .. 1 near.
  ripple(x, depth, strength = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.play('drop', {
      gain: (0.1 + depth * 0.35) * strength,
      pos: [(x - 0.5) * 6, -1.2, -(1 + (1 - depth) * 9)],
      rate: 0.9 + Math.random() * 0.25,
    });
  }

  // Duck the song by `db` at time t and let it swell back, like a sidechain pump.
  pump(t, db) {
    const g = this.duck.gain;
    g.setTargetAtTime(10 ** (-db / 20), t, 0.006);
    g.setTargetAtTime(1, t + 0.08, 0.11);
  }

  // dry: skip the reverb (sounds from inside the body). pump: duck the song (dB) under it
  play(name, { gain = 1, pos = null, rate = 1, offset = 0, dur, pan = 0, lp = 0, dry = false, pump = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const bus = dry ? this.sfxDry : this.sfx;
    const t0 = ctx.currentTime + 0.005;
    if (pump) this.pump(t0, pump);
    const out = ctx.createGain();
    out.gain.value = gain;
    let input = out;
    if (lp) {
      input = ctx.createBiquadFilter();
      input.type = 'lowpass';
      input.frequency.value = lp;
      input.connect(out);
    }
    if (pos) {
      const p = hrtfPanner(ctx, 2);
      if (p.positionX) { p.positionX.value = pos[0]; p.positionY.value = pos[1]; p.positionZ.value = pos[2]; }
      else p.setPosition(...pos);
      out.connect(p); p.connect(bus);
    } else if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      out.connect(p); p.connect(bus);
    } else out.connect(bus);

    const buf = this.samples[name];
    if (buf) {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rate;
      s.connect(input);
      if (dur) {
        // play a slice with a short fade so it never clicks
        out.gain.setValueAtTime(gain, t0 + Math.max(0, dur / rate - 0.4));
        out.gain.linearRampToValueAtTime(0, t0 + dur / rate);
        s.start(t0, offset, dur);
      } else s.start(t0, offset);
      return;
    }
    SYNTH[name]?.(ctx, input, t0, rate);
  }
}

// ---------- synthesized stand-ins ----------

let DRIVE = null;
function driveCurve() {
  if (!DRIVE) {
    DRIVE = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) DRIVE[i] = Math.tanh(((i / 1023) * 2 - 1) * 3.5);
  }
  return DRIVE;
}

const SYNTH = {
  // a resonant water "plip": fast upward pitch sweep, quick decay
  drop(ctx, out, t, rate) {
    const o = ctx.createOscillator();
    const e = ctx.createGain();
    o.type = 'sine';
    const f = 520 * rate;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.045);
    o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.16);
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(0.32, t + 0.006);
    e.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(e); e.connect(out);
    o.start(t); o.stop(t + 0.25);
  },
  // lub-dub, felt more than heard
  heartbeat(ctx, out, t) {
    const thump = (at, f, amp) => {
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.frequency.setValueAtTime(f, at);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, at + 0.14);
      e.gain.setValueAtTime(0, at);
      e.gain.linearRampToValueAtTime(amp, at + 0.012);
      e.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
      o.connect(e); e.connect(out);
      o.start(at); o.stop(at + 0.25);
    };
    thump(t, 62, 0.9);
    thump(t + 0.24, 52, 0.6);
  },
  // The body of the heartbeat, under the sampled lub-dub (0.17 s apart, like the sample): a sub
  // thump that drops in pitch, felt in the chest, plus a driven copy whose overtones carry the
  // beat on small speakers that can't play the sub itself.
  heartSub(ctx, out, t, rate) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = driveCurve();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 340;
    const drive = ctx.createGain();
    drive.gain.value = 0.4;
    shaper.connect(tone); tone.connect(drive); drive.connect(out);
    const hit = (at, f, amp, len) => {
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.frequency.setValueAtTime(f * rate, at);
      o.frequency.exponentialRampToValueAtTime(f * 0.58 * rate, at + 0.13);
      e.gain.setValueAtTime(0, at);
      e.gain.linearRampToValueAtTime(amp, at + 0.007);
      e.gain.exponentialRampToValueAtTime(0.001, at + len);
      o.connect(e); e.connect(out); e.connect(shaper);
      o.start(at); o.stop(at + len + 0.02);
    };
    hit(t, 72, 0.8, 0.3);
    hit(t + 0.17, 60, 0.56, 0.34);
  },
  // Glass under strain giving way: a quick run of tiny, bright clicks (the Begin tap).
  strain(ctx, out, t) {
    const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.04), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    for (let i = 0; i < 9; i++) {
      const len = 0.004 + Math.random() * 0.01;
      const s = ctx.createBufferSource();
      s.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2500 + Math.random() * 5000;
      bp.Q.value = 2.5;
      const e = ctx.createGain();
      e.gain.setValueAtTime(0.5 + Math.random() * 0.5, t);
      e.gain.exponentialRampToValueAtTime(0.001, t + len);
      s.connect(bp); bp.connect(e); e.connect(out);
      s.start(t); s.stop(t + len + 0.01);
      t += 0.012 + Math.random() * 0.04;
    }
  },
  // the sub-bass hit under "bone cracks" (and, deeper, the bullet)
  thump(ctx, out, t, rate) {
    const o = ctx.createOscillator();
    const e = ctx.createGain();
    o.frequency.setValueAtTime(90 * rate, t);
    o.frequency.exponentialRampToValueAtTime(32 * rate, t + 0.35);
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(0.9, t + 0.008);
    e.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(e); e.connect(out);
    o.start(t); o.stop(t + 0.65);
  },
  // the ears ringing after the bullet: two close high tones, beating, fading out
  ring(ctx, out, t) {
    const e = ctx.createGain();
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(1, t + 0.12);
    e.gain.exponentialRampToValueAtTime(0.001, t + 3.4);
    e.connect(out);
    for (const f of [3520, 3533]) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(e);
      o.start(t); o.stop(t + 3.5);
    }
  },
};
