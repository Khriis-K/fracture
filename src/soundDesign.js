import beatData from './beats.json';

// Sound design, keyed to the film (seconds). Gains are linear and sit under
// the song; envelopes interpolate linearly between keys.
//
// All samples are CC0 Freesound HQ previews, trimmed and leveled into
// public/media/sfx/ (downloads kept in assets/sfx/raw/):
//   drop      qubodup #792932          heartbeat  Lunardrive #22440
//   wind      StephanBrenn #656748     thunder    richwise #361401
//   fire      florianreichelt #563766  embers     FunWithSound #588401
//   lake      TheFlyFishingFilmmaker #614299
//   pencil    123jorre456 #46630       eraser     bdunis4 #271470
//   sand      nicoproson #627070       page       mmaruska #177867
//   whoosh    hnhnh #244926            crack      o_ciz #475443
//   bone      bewareofkites20 #147993  ring       SomeOrdinaryDude #738245

export const FILES = [
  'drop', 'heartbeat', 'wind', 'thunder', 'fire', 'embers', 'lake', 'pencil', 'eraser',
  'sand', 'page', 'whoosh', 'crack', 'bone', 'ring',
];

// ---------- ambience beds (looping) ----------
// gain: [[t, g], ...]; lp: low-pass in Hz, to push a bed into the distance.
// Beds stay well under the song: they should be felt as the room, never
// noticed as effects.
//
// Each bed is placed in 3D around the listener (HRTF). Its left and right
// channels become two sources, `spread` degrees apart around `az`.
//   az: degrees, 0 ahead, 90 right, -90 left, 180 behind (a number or [[t, az], ...])
//   dist: metres away on the ground plane; y: height (negative = below the ear)
//   orbit: degrees per second the pair drifts around the listener
export const BEDS = {
  // the storm over the lake: a breath of it in the intro, a thread underneath, back for the ending.
  // It wraps all the way round and slowly turns.
  wind: { lp: 5000, az: 0, spread: 150, dist: 4, y: 1.5, orbit: 3,
    gain: [[0, 0], [1.5, 0.01], [6, 0.035], [12, 0.08], [18, 0.08], [27, 0.07], [52, 0.05], [96, 0.06], [127, 0.04], [161.5, 0.04], [162.2, 0],
      [185.5, 0], [190, 0.03], [212, 0.05], [222, 0.07], [234, 0.04], [241.5, 0]] },
  // "our summer's bridge burned … amidst a wildfire" — far off, on the ridge ahead
  fire: { lp: 2200, az: -8, spread: 50, dist: 9, y: 1,
    gain: [[16, 0], [20, 0.05], [27, 0.08], [28.5, 0.09], [34, 0.075], [41, 0.05], [51, 0],
      // burning again as the world comes back after the panic attack, a little nearer than the first time
      [183.8, 0], [186, 0.12], [190, 0.13], [204.6, 0.12], [205.7, 0.16], [209, 0.11], [213, 0]] },
  // the lake: barely there, a little more as it becomes a mirror and the tides turn. Wide, in front, below.
  lake: { lp: 1600, az: 0, spread: 140, dist: 3, y: -1.5,
    gain: [[0, 0.04], [18, 0.03], [52, 0.03], [57, 0.08], [73, 0.1], [81, 0.15], [90, 0.13], [96, 0.04], [127, 0.04], [136, 0.07], [161.5, 0.05], [162.2, 0],
      [185.5, 0], [193, 0.06], [214, 0.05], [232, 0.015], [242, 0]] },
  // "I was drawn …" then "impressions on paper" — on a page just in front of you
  pencil: { lp: 7000, az: 15, spread: 0, dist: 0.7, y: -0.5,
    gain: [[95.5, 0], [96.6, 0.18], [98.2, 0.16], [98.7, 0], [103.8, 0], [105, 0.16], [110, 0.14], [111.5, 0]] },
  // the eraser sweeps left → right with the shader (98.4 → 102.6)
  eraser: { lp: 6000, az: [[98.4, -65], [102.6, 65]], spread: 0, dist: 0.7, y: -0.5,
    gain: [[98.2, 0], [98.6, 0.26], [102.3, 0.26], [102.9, 0]] },
  // "put in sand"
  sand: { lp: 6000, az: [[112, -25], [119, 30]], spread: 0, dist: 0.9, y: -0.7,
    gain: [[111.4, 0], [112.6, 0.2], [117, 0.22], [119.3, 0.06], [121, 0]] },
  // close crackle with the embers: swelling through "My faith…", fading from 204.6 — in your hands
  embers: { lp: 4500, az: 0, spread: 90, dist: 0.5, y: -0.4,
    gain: [[192.8, 0], [196.7, 0.42], [204.6, 0.38], [208.5, 0.14], [213.5, 0]] },
};

// ---------- the coda ----------
// After the song ends, the screen stays black and only the lake is left.
// gain is keyed in seconds after the song's last sample; the outro card
// appears at `outroAt`, while the water is still fading away.
export const CODA = { bed: 'lake', outroAt: 7, gain: [[0, 0], [2.5, 0.05], [8, 0.045], [18, 0]] };

// the held buzz, "bul" → "cracks"
const HOLD_FROM = 172.939, HOLD_UNTIL = 181.97;

// ---------- the falling voice ----------
// "My ribs draw tight, my lungs collapse": the voice rises over your head and,
// on "collapse", drops to the floor while the band stays where it is.
// For this stretch the song is swapped for its stems (public/media/stems/,
// cut from assets/fracture_audio_{vocals,instrumental}.wav, 164–174 s; vocals
// mono), so only the voice moves. The swaps hide under the "attack" hit and
// the "bul" hit, where the song dips and a thump covers the join.
//   pos: [[t, x, y, z]] metres around the listener (y up, -z ahead), kept
//        within 2 m so the move changes direction, not loudness
//   lp: the voice's own muffle, in place of the song's (it skips the song's
//       low-pass, so it stays clear overhead while the band is under water)
//   verb: extra reverb on the voice, the tail it leaves as it falls
//   lift: the voice's own gain, to lean into a word
//   punch: a bright, squashed copy of the voice laid on top, so a word jumps forward
//   under: the band's gain, to step back from a word (the song is already at the limiter,
//          so a word gets louder by the band making room)
//   bloom: how much of the voice goes into its own big hall (bloomGain: the hall's level)
export const STEMS = {
  clip: 164, from: 165.4, to: 172.9, xfade: 0.1,
  gain: 0.75, // the stems sum ~2.4 dB hotter than the mastered song
  pos: [[165.4, 0, 0.3, -1.6], [165.6, 0, 0.5, -1.4], [166.4, 0, 1.6, -0.7], [169.35, 0, 1.75, -0.5],
    // it falls like a weight: slow off the top, fast at the floor
    [169.42, 0, 1.45, -0.55], [169.49, 0, 0.6, -0.65], [169.56, 0, -0.9, -0.7], [169.62, 0, -1.8, -0.6],
    // "Every heartbeat strikes a bullet impact": it climbs back to the front for "bul"
    [170.6, 0, -1.7, -0.7], [172.5, 0, 0, -1.5], [172.9, 0, 0.3, -1.6]],
  lp: [[165.4, 20000], [167.2, 9000], [169.35, 9000], [169.62, 700], [170.6, 900], [172.6, 6000], [172.9, 20000]],
  verb: [[165.4, 0], [169.35, 0], [169.5, 0.6], [171, 0.1], [172.9, 0]],
  // "at-TACK": the stressed syllable hits you in the face, then blooms into a hall that hangs
  // under "My ribs draw tight". Only "-tack" goes into the hall.
  lift: [[165.4, 1], [165.62, 1], [165.66, 1.4], [165.9, 1.2], [166.3, 1]],
  punch: [[165.4, 0], [165.62, 0], [165.65, 1.6], [165.9, 1.1], [166.25, 0]],
  under: [[165.4, 1], [165.62, 1], [165.65, 0.55], [165.95, 0.7], [166.4, 1]],
  bloom: [[165.4, 0], [165.62, 0], [165.65, 1], [165.95, 1], [166.04, 0]],
  bloomGain: 1.5,
};

// ---------- one-shots ----------
// [t, sound, { gain, offset (s into the file), dur, rate, pan, lp }]
const SHOTS = [
  // the storm, far away
  [2.5, 'thunder', { gain: 0.04, offset: 0, dur: 11.5, lp: 700 }],
  // the wildfire catches on "wildfire"
  [27.2, 'whoosh', { gain: 0.07, lp: 2500 }],
  [52, 'thunder', { gain: 0.1, offset: 12, dur: 11, pan: -0.5, lp: 700 }],
  // "impressions on paper"
  [104, 'page', { gain: 0.08, lp: 6000 }],
  // "Glass shatters under weight of what we built": the pane breaks at 2:15, full and bright,
  // with a lower layer for weight. offset skips the file's 0.13 s of lead-in, so it lands on the beat.
  [135, 'crack', { gain: 1, offset: 0.13 }],
  [135, 'crack', { gain: 0.55, offset: 0.13, rate: 0.78, lp: 3500 }],
  // "under attack" has no hit of its own: the voice itself punches and blooms (STEMS)
  // "my lungs collapse": a rush that drops past you with the voice (STEMS), then a dull,
  // low give at your feet as the air goes out
  [169.2, 'whoosh', { gain: 0.09, rate: 0.7, lp: 3000, dur: 1.4,
    path: [[0, 0, 2.2, -0.4], [0.15, 0, 1.6, -0.5], [0.3, 0, 0.2, -0.6], [0.42, 0, -1.9, -0.5], [1.4, 0, -2, -0.4]] }],
  [169.35, 'thump', { gain: 0.3, rate: 0.6, pos: [0, -1.6, -0.5] }],
  // "Every heartbeat strikes a bullet impact": the line swells and the hit lands
  // on "bul", with the song's own heartbeat (see choreography.js).
  [HOLD_FROM, 'thump', { gain: 0.6, rate: 0.72 }],
  [HOLD_FROM - 0.05, 'thunder', { gain: 0.32, offset: 2.6, dur: 3.2, lp: 450 }],
  // "until bone cracks"
  [HOLD_UNTIL, 'bone', { gain: 0.3, lp: 5000 }],
  [HOLD_UNTIL, 'thump', { gain: 0.28 }],
  // the final chorus breaks the hush
  [185.1, 'thunder', { gain: 0.12, offset: 12, dur: 11, pan: 0.35, lp: 700 }],
];

// ---------- heartbeat ----------
// Locked to the song's beat (~117 BPM). It races through the panic attack,
// slows to every other beat in the hush, then stays soft under the last chorus.
// It's heard from inside the chest: centred, just below the head and a little
// in front, muffled the way sound through the body is, with none of the room's
// reverb. On phones it's also felt (see the haptics section below).
export const CHEST = { pos: [0, -0.45, -0.12], lp: 900, dry: true };
// Each beat is the sample plus its body (audio.js heartSub), and the song ducks under it.
function beat(out, b, gain, rate, body, pump) {
  out.push([b, 'heartbeat', { gain, rate, ...CHEST }]);
  out.push([b, 'heartSub', { gain: body, rate, ...CHEST, pump }]);
}
function heartbeats() {
  const out = [];
  const beats = beatData.beats;
  let hushIndex = 0;
  for (const b of beats) {
    if (b >= 161.9 && b < HOLD_UNTIL) {
      const k = (b - 162) / (HOLD_UNTIL - 162);
      beat(out, b, 0.28 + Math.min(1, k) * 0.3, 1, 0.35 + Math.min(1, k) * 0.3, 2.5 + Math.min(1, k) * 2.5);
      lubDub(b, 0.45 + 0.55 * Math.min(1, k), 60 + 45 * Math.min(1, k));
    } else if (b >= HOLD_UNTIL + 0.3 && b < 185.3) { // the first beat after "cracks" stays silent
      if (hushIndex++ % 2 === 0) {
        beat(out, b, 0.5 - (b - HOLD_UNTIL) * 0.03, 0.97, 0.6 - (b - HOLD_UNTIL) * 0.04, 3);
        lubDub(b, 0.35, 40);
      }
    } else if (b >= 185.3 && b < 213.5) {
      if (Math.round((b - 185.52) / (60 / beatData.bpm)) % 2 === 0) {
        const fade = 1 - Math.max(0, (b - 205) / 8.5);
        beat(out, b, 0.15 * fade, 0.95, 0.2 * fade, 1.2 * fade);
      }
    }
  }
  return out;
}

// ---------- haptics ----------
// What the phone feels, as a strength from 0 to 1 over the film. haptics.js
// turns strength into fast pulses (phones can only switch the motor on and
// off). Overlapping shapes take the stronger one, so the heartbeat throbs
// through the held buzz.
const SHAPES = []; // [from, to, strength(t)]
const shape = (from, to, s) => SHAPES.push([from, to, typeof s === 'function' ? s : () => s]);
// a heartbeat in the hand: lub, then a lighter dub 0.17 s later (the sample's spacing)
function lubDub(b, s, lubMs) {
  shape(b, b + lubMs / 1000, s);
  shape(b + 0.17, b + 0.17 + (lubMs * 0.7) / 1000, s * 0.75);
}
// "attack": one hard hit
shape(165.5, 165.65, 1);
// "collapse": a hit, then the give, fading
shape(169.35, 169.44, 1);
shape(169.49, 169.65, (t) => 0.8 - ((t - 169.49) / 0.16) * 0.55);
// "bul" → "cracks": a full-strength hit, then a held buzz that sinks back and
// swells all the way to "cracks"
shape(HOLD_FROM, HOLD_UNTIL, (t) => {
  if (t - HOLD_FROM < 0.3) return 1;
  const p = (t - HOLD_FROM - 0.3) / (HOLD_UNTIL - HOLD_FROM - 0.3);
  return 0.35 + 0.65 * p * p;
});

// ---------- the ears ringing, "bul" → "cracks" ----------
// It swells in out of the hit, throbs three times (a bar each, swinging from
// one ear to the other), then turns rough and climbs until it's cut dead on
// "cracks". env: [[dt, gain]] after the cue starts; panPath: [[dt, pan]].
function ringing() {
  const beats = beatData.beats;
  const i0 = beats.findIndex((b) => b > HOLD_FROM - 0.1);
  const bar = (n) => beats[i0 + 4 * n]; // 172.92, 174.95, 177.01, 179.03
  const peaks = [0, 1, 2].map((n) => (bar(n) + bar(n + 1)) / 2);
  const rough = bar(3), end = HOLD_UNTIL - HOLD_FROM;
  // the shape, keyed in film time, eased between keys
  const keys = [[HOLD_FROM, 0], [peaks[0], 1], [bar(1), 0.35], [peaks[1], 1], [bar(2), 0.35], [peaks[2], 1], [rough, 0.5], [HOLD_UNTIL - 0.05, 1]];
  const shape = (t) => {
    let k = 1;
    while (k < keys.length - 1 && t > keys[k][0]) k++;
    const [t0, g0] = keys[k - 1], [t1, g1] = keys[k];
    const x = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    // throbs ease in and out; the rough climb gathers speed
    return g0 + (g1 - g0) * (t >= rough ? x * x : (1 - Math.cos(Math.PI * x)) / 2);
  };
  // one ear, then the other, a bar each; quicker and narrower once it turns rough
  const pan = (t) => (t < rough ? -0.6 * Math.sin((Math.PI * (t - HOLD_FROM)) / (bar(1) - bar(0))) : 0.3 * Math.sin((Math.PI * 2 * (t - rough)) / 0.5));
  const env = [], panPath = [];
  for (let dt = 0; dt < end - 0.05; dt += 0.05) {
    env.push([dt, shape(HOLD_FROM + dt)]);
    panPath.push([dt, pan(HOLD_FROM + dt)]);
  }
  env.push([end - 0.05, 1], [end, 0]); // cut dead on "cracks"
  const gritLen = HOLD_UNTIL - rough, gritEnv = [];
  for (let dt = 0; dt < gritLen - 0.05; dt += 0.1) gritEnv.push([dt, (dt / gritLen) ** 2]);
  gritEnv.push([gritLen - 0.05, 1], [gritLen, 0]);
  return [
    // dry: it's inside your head, and no room tail may blur the cut
    [HOLD_FROM, 'ring', { gain: 0.15, env, panPath, dur: end + 0.05, dry: true }],
    // the roughness: noise that brightens and distorts as it climbs (audio.js SYNTH.grit)
    [rough, 'grit', { gain: 0.05, env: gritEnv, dur: gritLen, dry: true }],
  ];
}

export const CUES = [...SHOTS, ...heartbeats(), ...ringing()].sort((a, b) => a[0] - b[0]);

export function hapticAt(t) {
  let s = 0;
  for (const [a, b, f] of SHAPES) if (t >= a && t < b) s = Math.max(s, f(t));
  return s;
}

export function envelope(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}
