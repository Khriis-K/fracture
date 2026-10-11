import gsap from 'gsap';

// Base choreography for the WebGL world, keyed to the song (seconds).
// Each track is a list of [time, value, ease?]; the ease shapes the segment
// that *ends* at that key. Theatre.js offsets are added on top at runtime.
//
// Song map: 0–52 quiet verse (fire, ghosts) · 52–92 chorus (mirror, lake)
// 96–127 verse (paper, sand, ink) · 127–162 chorus (glass) · 162–182 bridge
// (the body) · 182.5–185 silence · 185–214 final chorus (flame, scorch)
// 214–242 "abandoned myself" → black.
//
// "Every heartbeat strikes a bullet impact": "bul" 172.939 · "im" 173.422
// (timed by ear by the author). The whole line is a crescendo, the song
// opening up and rising into "bul", where the hit lands. "…until bone cracks": "cracks" at 181.97 is
// the bridge's last hit; the song drops out right after, into the dark.

// The four words of the attack that break out of their lines (lyrics.js HEROES),
// timed by the author: "attack" 165.5 · "collapse" 169.35 · "bul(let)" 172.939
// · "cracks" 181.97. Each gets a half-breath of nothing just before (a dim, a
// dip in the song), then everything at once.
export const HITS = [165.5, 169.35, 172.939, 181.97];

export const DURATION = 242.02;

export const DEFAULTS = {
  fade: 0, zoom: 1, focusX: 0.5, focusY: 0.5, cloud: 1,
  burn: 0, wildfire: 0, embers: 0, embersNear: 0, smoke: 0, ghost: 0,
  mirror: 0, ripple: 0.5, tide: 0,
  sketch: 0, erase: 0, sand: 0, ink: 0,
  crack: 0, shatter: 0, frost: 0, bleed: 0, impactX: 0.7, impactY: 0.38,
  red: 0, pulse: 0, tunnel: 0, shake: 0, tremor: 0, flash: 0, split: 0,
  flame: 0, heat: 0, drain: 0,
  muffle: 0, level: 0, presence: 0,
};

export const TRACKS = {
  // darkness: intro fade-in, the silence after the bridge, the ending
  fade: [[0, 1], [1.5, 1], [11, 0, 'power2.out'],
    [165.3, 0], [165.45, 0.35], [165.51, 0, 'expo.out'], [172.8, 0], [172.92, 0.35], [172.95, 0, 'expo.out'],
    [181.75, 0], [181.92, 0.35], [181.98, 0, 'expo.out'], [182.3, 0], [183.4, 0.88], [184.5, 0.88], [186.5, 0], [214, 0], [229, 0.4], [240.5, 1, 'power1.in']],
  zoom: [[0, 1.09], [52, 1.02], [92, 1.0], [96, 1.0], [127, 1.035], [161.8, 1.0], [162.2, 1.07, 'power3.out'],
    [172.9, 1.102], [173.0, 1.14, 'expo.out'], [174.5, 1.106], [181.945, 1.125], [182.075, 1.155, 'expo.out'], [184.5, 1.0], [214, 1.0], [242, 1.12, 'power1.in']],
  focusX: [[0, 0.47], [52, 0.5], [127, 0.53], [162, 0.5], [242, 0.56]],
  focusY: [[0, 0.52], [52, 0.5], [58, 0.43], [92, 0.43], [97, 0.5], [133, 0.5], [138, 0.45], [148, 0.45], [152, 0.5], [169.3, 0.5], [169.9, 0.475, 'power2.in'], [171.5, 0.5], [190, 0.5], [196, 0.45], [214, 0.45], [242, 0.47]],
  cloud: [[0, 0.45], [18, 0.7], [52, 1.1], [81, 1.5], [92, 1.0], [127, 1.2], [162, 1.9], [182.4, 0.15], [185, 1.0], [214, 0.6], [242, 0.15]],

  // I — "I could smell smoke as our summer's bridge burned / Amidst a wildfire"
  burn: [[14, 0], [18.5, 0.45], [22, 0.75], [27, 0.85], [31, 1], [36, 0.6], [44, 0.3], [52, 0.12], [60, 0]],
  wildfire: [[23, 0], [27.4, 1, 'power2.out'], [33, 0.9], [38, 0.35], [47, 0]],
  embers: [[15, 0], [20, 0.55], [27.5, 1], [34, 0.85], [40, 0.45], [50, 0]],
  smoke: [[17, 0], [23, 0.45], [30, 0.7], [40, 0.55], [52, 0]],
  // "ghosts in my world / your spirit became a phantom in mine"
  ghost: [[34.5, 0], [37, 0.55], [41.2, 0.35], [43, 0.6], [46.5, 1], [50.5, 0.35], [53.5, 0]],

  // II — "My reflection of you must stay steady … semblance looms the surface like a lake"
  mirror: [[0, 0.3], [50, 0.3], [56, 0.75], [60, 1], [92, 1], [96, 0.35], [127, 0.4], [136, 0.85], [147.5, 0.85], [151, 0.25], [162, 0.2], [185, 0.45], [193, 0.85], [209, 0.85], [214, 0.6], [224, 0]],
  ripple: [[0, 0.55], [52, 0.45], [59, 0.08], [64, 0.12], [73, 0.35], [77, 0.9], [81, 1.1], [90, 1.1], [96, 0.45], [162, 0.6], [180, 0.15], [185, 0.45], [214, 0.3], [242, 0.05]],
  tide: [[79.5, 0], [81.2, 0.65], [86, 1], [90.5, 0.85], [95, 0]],

  // III — "drawn … to be erased / impressions on paper / put in sand / writing in ink"
  sketch: [[94, 0], [97.2, 0.85], [101, 0.9], [104.5, 0.6], [108.5, 0.25], [112, 0]],
  erase: [[98.4, 0], [102.6, 1, 'power1.inOut'], [104, 1], [109, 0, 'power1.inOut']],
  sand: [[110.5, 0], [112.6, 0.9], [118, 1], [120.5, 0.45], [124, 0]],
  ink: [[119, 0], [120.6, 0.3], [124, 0.75], [127.4, 0.6], [131, 0]],

  // IV — "Glass shatters … glass shards … mirror grows opaque … the window … behind the pane"
  crack: [[135.6, 0], [136.3, 0.55, 'expo.out'], [140, 0.7], [151.8, 0.75], [152.6, 1.05, 'expo.out'], [161.7, 1.05], [162.1, 0, 'power2.in'],
    // "bullet": a bullet-hole fracture from the centre
    [172.92, 0], [173.0, 0.8, 'expo.out'], [174.5, 0.65], [176, 0],
    // "until bone cracks"
    [181.4, 0], [182.015, 1.1, 'expo.out'], [184.3, 1.1], [185.2, 0]],
  shatter: [[139.6, 0], [140.6, 0.6, 'expo.out'], [151.8, 0.55], [153, 1, 'expo.out'], [161.7, 1], [162.1, 0], [181.4, 0], [182.115, 0.7, 'expo.out'], [184.3, 0.7], [185.2, 0]],
  impactX: [[0, 0.7], [162.5, 0.7, 'none'], [162.6, 0.5, 'none']],
  impactY: [[0, 0.38], [162.5, 0.38, 'none'], [162.6, 0.4, 'none']],
  frost: [[147.6, 0], [150, 0.85], [151.7, 0.85], [152.4, 0]],
  bleed: [[155.6, 0], [158.5, 0.8], [161, 1], [162.1, 0]],

  // V — the bridge: "tonight my body's under attack"
  red: [[161.7, 0], [162.05, 1, 'expo.out'], [182.3, 1], [184, 0.5], [185.4, 0]],
  pulse: [[161.5, 0], [162, 1], [181.995, 1], [183, 0]],
  tunnel: [[165.6, 0], [167, 0.85], [169.3, 0.62], [169.45, 1.15, 'expo.out'], [170.5, 0.57], [178, 0.7], [181.995, 1], [184.6, 0]],
  shake: [[169.6, 0], [170.1, 1], [174, 0.6], [178, 0.4], [181.995, 0.5], [183, 0]],
  // a constant tremor through the whole attack, jolted by the bullet and the bone
  tremor: [[161.8, 0], [162.1, 0.6, 'expo.out'], [165, 0.4],
    [165.48, 0.42], [165.55, 1.9, 'expo.out'], [166.6, 0.45], [169.3, 0.48], [169.4, 1.2, 'expo.out'], [170.2, 0.5], [172.9, 0.95, 'power2.in'],
    [172.97, 2.4, 'expo.out'], [174.5, 0.75], [181.845, 0.7], [182.045, 2.2, 'expo.out'], [183.2, 0.3], [184.3, 0]],
  flash: [[161.8, 0], [162.0, 0.7], [162.6, 0], [165.48, 0], [165.52, 0.75], [166.1, 0], [172.91, 0], [172.96, 0.6], [173.6, 0], [181.745, 0], [181.995, 1], [182.95, 0]],

  // VI — "My faith sheltered your flame … Scorching my hands"
  flame: [[191.5, 0], [194, 1], [201, 0.85], [205.28, 1.25], [209, 0.6], [214, 0.45], [222, 0]],
  heat: [[204.68, 0], [205.78, 1], [209.2, 0.35], [212, 0]],
  embersNear: [[204.68, 0], [205.68, 1], [209.5, 0.4], [213, 0]],

  // VII — "Not realizing I'd abandoned myself"
  drain: [[207, 0], [214, 0.45], [226, 1]],

  // Sound — the song heard from inside: under the ink, inside the body.
  // "bone cracks" snaps it open for a moment; the hush after the bridge closes in.
  muffle: [[119.5, 0], [124, 0.3], [127, 0.2], [127.6, 0], [165.6, 0], [167.2, 0.72], 
    // "Every heartbeat strikes a bullet": the song opens up all the way into "bul", then sinks back
    [169.3, 0.58], [169.42, 0.9, 'expo.out'], [170.1, 0.55], [172.92, 0, 'power2.in'], [173.8, 0.05], [175, 0.35], [176, 0.55], [181.795, 0.8],
    [182.065, 0.1, 'expo.out'], [182.9, 0.85], [184.6, 0.85], [185.15, 0, 'power2.out']],
  // the song's level in dB: the crescendo starts low and peaks on "bul" (a limiter keeps the +3 clean)
  // A half-breath of nothing before "attack" and "bul" makes the hits land harder.
  level: [[165.3, 0], [165.42, -7, 'power2.in'], [165.5, 0, 'expo.out'], [169.4, 0], [170.0, -6],
    [172.8, 2.4, 'power2.in'], [172.9, -5, 'power2.in'], [172.95, 3, 'expo.out'], [173.7, 1.5], [175, 0]],
  // the voice comes forward (a presence lift, up to +6 dB around 2.8 kHz) into "bul"
  presence: [[169.8, 0], [172.93, 1, 'power1.in'], [174, 0.35], [175.5, 0]],
  // "attack": the colour channels tear apart for a moment
  split: [[165.45, 0], [165.52, 1, 'expo.out'], [166.1, 0]],
};

const easeCache = new Map();
function ease(name) {
  if (!name) name = 'sine.inOut';
  if (name === 'none') return (p) => p;
  let fn = easeCache.get(name);
  if (!fn) easeCache.set(name, (fn = gsap.parseEase(name)));
  return fn;
}

export function sampleTracks(t, out = {}) {
  Object.assign(out, DEFAULTS);
  for (const name in TRACKS) {
    const keys = TRACKS[name];
    if (t <= keys[0][0]) { out[name] = keys[0][1]; continue; }
    const last = keys[keys.length - 1];
    if (t >= last[0]) { out[name] = last[1]; continue; }
    for (let i = 1; i < keys.length; i++) {
      const b = keys[i];
      if (t < b[0]) {
        const a = keys[i - 1];
        const p = ease(b[2])((t - a[0]) / (b[0] - a[0]));
        out[name] = a[1] + (b[1] - a[1]) * p;
        break;
      }
    }
  }
  return out;
}
