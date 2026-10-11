import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// t = when the line is sung, e = when it leaves. " / " = line break.
// fx: { w: word to target (or '*' for the whole line), fx: effect name, at?: seconds into the line }
export const LINES = [
  { t: 18, e: 25.6, text: 'I could smell smoke / as our summer’s bridge burned',
    fx: [{ w: 'smoke', fx: 'smolder' }, { w: 'burned', fx: 'smolder', at: 2.6 }] },
  { t: 27, e: 34.2, text: 'Admist a wildfire left behind',
    fx: [{ w: 'wildfire', fx: 'flicker', at: 0.9 }] },
  { t: 36, e: 41.4, text: 'I could yet breathe / with the ghosts in my world',
    fx: [{ w: 'ghosts', fx: 'ghost', at: 2.0 }] },
  { t: 42, e: 50.6, text: 'Till your spirit / became a phantom in mine',
    fx: [{ w: 'spirit', fx: 'ghost', at: 1.0 }, { w: 'phantom', fx: 'phantom', at: 2.6 }, { w: '*', fx: 'fadeGhost', at: 5.5 }] },

  { t: 52, e: 55.7, text: 'But I won’t let your image break', fx: [{ w: 'break', fx: 'nearBreak' }] },
  { t: 56, e: 58.8, text: 'Beneath the reasons you chose to forsake', fx: [{ w: 'forsake', fx: 'sink' }] },
  { t: 59, e: 63.7, text: 'My reflection of you must stay steady', cls: 'reflect', fx: [{ w: 'steady', fx: 'still' }] },
  { t: 64, e: 67.7, text: 'So should the storm settles we are ready', cls: 'reflect', fx: [{ w: 'storm', fx: 'tremble', at: 0.7 }] },
  { t: 68, e: 72.7, text: 'Oh, I can’t let your image break', cls: 'reflect', fx: [{ w: 'break', fx: 'nearBreak' }] },
  { t: 73, e: 76.7, text: 'Your semblance looms the surface like a lake', cls: 'reflect', fx: [{ w: 'lake', fx: 'wave' }] },
  { t: 77, e: 80.7, text: 'Unwavering when the water ripples', cls: 'reflect',
    fx: [{ w: 'unwavering', fx: 'still' }, { w: 'ripples', fx: 'wave', at: 1.9 }] },
  { t: 81, e: 92, text: 'As our shifting transfer of tides cripples', cls: 'reflect', fx: [{ w: '*', fx: 'tide' }] },

  { t: 96, e: 103.2, text: 'I was drawn till that night to be erased', cls: 'sketch', fx: [{ w: '*', fx: 'erase', at: 2.5 }] },
  { t: 104, e: 110.6, text: 'By impressions on paper, mere instinct', cls: 'sketch', fx: [{ w: '*', fx: 'inkIn', at: 0 }] },
  { t: 112, e: 119.2, text: 'Our prose and paintings / put in sand had shaped',
    fx: [{ w: 'sand', fx: 'sandGlint' }, { w: '*', fx: 'sandTone', at: 1.6 }, { w: '*', fx: 'blowAway' }] },
  { t: 120, e: 126.4, text: 'While you were aware I was writing in ink', fx: [{ w: 'ink', fx: 'inkBleed', at: 2.4 }, { w: '*', fx: 'permanent' }] },

  { t: 127, e: 130.7, text: 'But I won’t let your image break', fx: [{ w: 'break', fx: 'nearBreak' }] },
  { t: 131, e: 135.7, text: 'Beneath the reasons you chose to forsake', fx: [{ w: 'forsake', fx: 'sink' }] },
  { t: 136, e: 139.7, text: 'Glass shatters under weight of what we built', fx: [{ w: '*', fx: 'shatter', at: 1.0 }] },
  { t: 140, e: 143.7, text: 'Cut on our glass shards, some showered in guilt', fx: [{ w: '*', fx: 'shards', at: 0.5 }] },
  { t: 144, e: 147.7, text: 'Oh, I can’t let your image break', fx: [{ w: 'break', fx: 'nearBreak' }] },
  { t: 148, e: 151.7, text: 'Lest your light in the mirror grows opaque', fx: [{ w: 'light', fx: 'glow', at: 0.6 }, { w: '*', fx: 'opaque', at: 1.8 }] },
  { t: 152, e: 155.7, text: 'In choosing the window to break your chain', fx: [{ w: 'break', fx: 'burst', at: 0.4 }, { w: 'chain', fx: 'snap', at: 2.4 }] },
  { t: 156, e: 161.6, text: 'I’d bleed on your absence behind the pane', fx: [{ w: 'bleed', fx: 'bleed', at: 0.35 }, { w: '*', fx: 'redden', at: 1.5 }] },

  { t: 162, e: 166, text: 'But tonight my body’s under attack', cls: 'crimson pulse', fx: [{ w: '*', fx: 'slam', at: 0 }] },
  { t: 166, e: 169.7, text: 'My ribs draw tight, my lungs collapse', cls: 'crimson pulse', fx: [{ w: 'tight', fx: 'tighten', at: 1.2 }, { w: 'collapse', fx: 'collapse', at: 3.35 }] },
  { t: 170, e: 173.7, text: 'Every heartbeat strikes a bullet impact', cls: 'crimson pulse', fx: [{ w: 'impact', fx: 'impact', at: 3.42 }] },
  { t: 174, e: 183.2, text: 'Pressure beams through my blood / until bone cracks', cls: 'crimson pulse', fx: [{ w: 'cracks', fx: 'boneCrack', at: 7.97 }] },

  { t: 185, e: 188.7, text: 'But I refuse to let your image break', fx: [{ w: 'refuse', fx: 'firm', at: 0.4 }, { w: 'break', fx: 'nearBreak' }] },
  { t: 189, e: 192.7, text: 'Beneath all this weight you chose to forsake', fx: [{ w: 'weight', fx: 'sink', at: 1.2 }] },
  { t: 193, e: 196.7, text: 'My faith sheltered your flame from burning out', fx: [{ w: 'flame', fx: 'flame', at: 1.4 }] },
  { t: 197, e: 200.7, text: 'Holding onto your burden and all my doubts', fx: [{ w: 'burden', fx: 'sink', at: 1.4 }] },
  { t: 201, e: 205.25, text: 'Why can’t I let your image break?', fx: [{ w: 'break?', fx: 'trueBreak' }] },
  { t: 205.28, e: 208.9, text: 'Scorching my hands for belated mistakes', fx: [{ w: 'scorching', fx: 'scorch', at: 0 }, { w: 'hands', fx: 'scorch', at: 0.8 }] },
  { t: 209, e: 213.6, text: 'Selflessly staying with what you had dealt', fx: [{ w: 'selflessly', fx: 'dim', at: 0.6 }] },
  { t: 213.65, e: 227, text: 'Not realizing I’d abandoned myself', cls: 'last', fx: [{ w: 'myself', fx: 'abandon', at: 5.5 }] },
];

// The four words of the panic attack that break out of their lines and take
// over the screen, at the moment they're sung (timed by the author; the same
// times are HITS in choreography.js). dur = how long the giant word is on screen.
export const HEROES = [
  { t: 165.5, word: 'attack', fx: 'attack', dur: 1.4 },
  { t: 169.35, word: 'collapse', fx: 'collapse', dur: 1.0 },
  { t: 172.939, word: 'bullet', fx: 'bullet', dur: 0.75 },
  { t: 181.97, word: 'cracks', fx: 'cracks', dur: 2.9 },
];

// deterministic randomness so a seek always lands on the same frame
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z?]/g, '');
const SHADOW = '0px 0px 22px rgba(0,0,0,0.6), 0px 1px 2px rgba(0,0,0,0.5)';

const FX = {
  smolder(tl, { chars, at, D, r }) {
    tl.to(chars, { color: '#ffd6a3', textShadow: '0px 0px 4px rgba(30,6,0,0.95), 0px 0px 18px rgba(255,100,20,0.9)', duration: 1.1, stagger: 0.06 }, at);
    tl.to(chars, { y: () => -24 - r() * 34, x: () => (r() - 0.5) * 16, rotation: () => (r() - 0.5) * 30, opacity: 0, filter: 'blur(3px)',
      duration: 1.7, stagger: 0.05, ease: 'power1.in' }, D - 2.0);
  },
  flicker(tl, { chars, at }) {
    tl.to(chars, { color: '#ffe0b8', textShadow: '0px 0px 4px rgba(30,6,0,0.95), 0px 0px 20px rgba(255,90,20,0.95)', duration: 0.6 }, at);
    tl.to(chars, { keyframes: { opacity: [1, 0.35, 0.9, 0.55, 1, 0.3, 0.85, 1] }, duration: 3.2, stagger: { each: 0.07, from: 'random' }, ease: 'none' }, at + 0.3);
  },
  ghost(tl, { word, at }) {
    tl.to(word, { opacity: 0.5, filter: 'blur(1.8px)', letterSpacing: '0.14em', duration: 2.6, ease: 'sine.inOut' }, at);
  },
  phantom(tl, { chars, at, r }) {
    tl.to(chars, { x: () => (r() - 0.5) * 14, y: () => (r() - 0.5) * 8, opacity: () => 0.4 + r() * 0.3, filter: 'blur(1.2px)',
      duration: 2.4, stagger: { each: 0.08, from: 'center' }, ease: 'sine.inOut' }, at);
  },
  fadeGhost(tl, { line, at }) {
    tl.to(line, { opacity: 0.55, filter: 'blur(1.4px)', duration: 2.2 }, at);
  },
  nearBreak(tl, { chars, at, r }) {
    tl.to(chars, { x: () => (r() - 0.5) * 9, y: () => (r() - 0.5) * 7, rotation: () => (r() - 0.5) * 14, duration: 0.28, ease: 'power4.out' }, at);
    tl.to(chars, { x: 0, y: 0, rotation: 0, duration: 1.6, ease: 'elastic.out(1, 0.45)' }, at + 0.55);
  },
  trueBreak(tl, { chars, at, r }) {
    tl.to(chars, { x: () => (r() - 0.5) * 34, y: () => (r() - 0.3) * 26, rotation: () => (r() - 0.5) * 50, duration: 0.5, stagger: 0.03, ease: 'expo.out' }, at);
    tl.to(chars, { y: '+=40', opacity: 0, rotation: () => (r() - 0.5) * 120, duration: 1.6, stagger: 0.05, ease: 'power2.in' }, at + 1.6);
  },
  sink(tl, { chars, at }) {
    tl.to(chars, { y: 6, opacity: 0.7, duration: 1.6, stagger: 0.06, ease: 'sine.inOut' }, at);
  },
  still(tl, { word, at }) {
    tl.to(word, { textShadow: '0px 0px 18px rgba(255,236,210,0.35), 0px 1px 2px rgba(0,0,0,0.5)', duration: 1.4 }, at);
  },
  tremble(tl, { chars, at }) {
    tl.to(chars, { keyframes: { x: [0, -1.5, 1.2, -0.8, 1, 0] }, duration: 1.2, stagger: 0.04, ease: 'none' }, at);
  },
  wave(tl, { chars, at, D }) {
    const rep = Math.max(1, Math.floor((D - at - 1.2) / 0.55));
    tl.to(chars, { y: -6, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: rep, stagger: { each: 0.07 } }, at);
  },
  tide(tl, { chars, D }) {
    const rep = Math.max(1, Math.floor((D - 2.4) / 0.9));
    tl.to(chars, { y: 9, rotation: 4, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: rep, stagger: { each: 0.05 } }, 0.8);
    tl.to(chars, { x: (i) => Math.sin(i * 0.6) * 6, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 1.4);
  },
  erase(tl, { chars, at }) {
    // in sync with the shader's eraser sweep (98.4s → 102.6s)
    tl.to(chars, { opacity: 0, filter: 'blur(3px)', duration: 0.45, stagger: 3.8 / chars.length, ease: 'power1.in' }, at);
  },
  inkIn(tl, { chars }) {
    tl.fromTo(chars, { color: 'rgba(239,230,218,0)' }, { color: 'rgba(239,230,218,0.95)', duration: 1.4, stagger: 0.07 }, 1.2);
  },
  // "sand": warm and grainy-bright, like the sand the shader turns the world to
  sandGlint(tl, { word, at }) {
    tl.to(word, { color: '#f0d29a', textShadow: '0px 0px 20px rgba(240,190,110,0.5), 0px 1px 2px rgba(0,0,0,0.5)', duration: 1.8 }, at);
  },
  sandTone(tl, { line, at }) {
    tl.to(line, { color: '#dcc19b', duration: 2 }, at);
  },
  blowAway(tl, { chars, D, r }) {
    tl.to(chars, { x: () => 30 + r() * 120, y: () => (r() - 0.6) * 40, rotation: () => (r() - 0.5) * 80, opacity: 0, filter: 'blur(2px)',
      duration: 1.7, stagger: 0.025, ease: 'power2.in' }, D - 2.4);
  },
  inkBleed(tl, { word, at }) {
    tl.to(word, { color: '#cfd8ff', textShadow: '0px 0px 26px rgba(30,50,160,0.95), 0px 0px 3px rgba(0,0,0,0.8)', scale: 1.06, duration: 2.2 }, at);
  },
  permanent() { /* ink doesn't blur on exit; handled by `keep` below */ },
  shatter(tl, { chars, at, D, r }) {
    tl.to(chars, { x: () => (r() - 0.5) * 8, y: () => (r() - 0.5) * 9, rotation: () => (r() - 0.5) * 18, duration: 0.6, ease: 'expo.out',
      stagger: { each: 0.012, from: 'center' } }, at);
    tl.to(chars, { y: () => 40 + r() * 70, rotation: () => (r() - 0.5) * 140, opacity: 0, duration: 1.3, ease: 'power2.in',
      stagger: { each: 0.03, from: 'random' } }, D - 1.6);
  },
  shards(tl, { chars, at, r }) {
    tl.to(chars, { rotation: () => (r() - 0.5) * 16, y: () => (r() - 0.5) * 6, skewX: () => (r() - 0.5) * 14, duration: 0.5, ease: 'expo.out',
      stagger: { each: 0.03, from: 'center' } }, at);
  },
  glow(tl, { word, at }) {
    tl.to(word, { textShadow: '0px 0px 24px rgba(255,240,215,0.9), 0px 1px 2px rgba(0,0,0,0.5)', duration: 1.2 }, at);
  },
  opaque(tl, { line, at }) {
    tl.to(line, { filter: 'blur(3.6px)', opacity: 0.5, duration: 1.8, ease: 'sine.in' }, at);
  },
  burst(tl, { chars, at, r }) {
    tl.to(chars, { x: () => (r() - 0.5) * 28, y: () => (r() - 0.5) * 22, rotation: () => (r() - 0.5) * 40, duration: 0.5, ease: 'expo.out' }, at);
  },
  snap(tl, { chars, at }) {
    const mid = (chars.length - 1) / 2;
    tl.to(chars, { x: (i) => (i - mid) * 9, duration: 0.25, ease: 'expo.out' }, at);
    tl.to(chars, { y: (i) => (i % 2 ? 5 : -4), rotation: (i) => (i - mid) * 7, duration: 0.6, ease: 'power2.out' }, at + 0.2);
  },
  bleed(tl, { chars, at, r }) {
    tl.to(chars, { color: '#e8174a', duration: 0.6 }, at);
    tl.to(chars, { y: () => 4 + r() * 12, scaleY: 1.15, duration: 3.2, stagger: { each: 0.2, from: 'random' }, ease: 'power1.in' }, at + 0.3);
  },
  redden(tl, { line, at }) {
    tl.to(line, { color: '#dd6a78', duration: 3 }, at);
  },
  slam(tl, { chars }) {
    tl.fromTo(chars, { scale: 1.9, opacity: 0, filter: 'blur(10px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.35, stagger: 0.02, ease: 'expo.out', immediateRender: false }, 0.02);
  },
  tighten(tl, { chars, at }) {
    tl.to(chars, { scaleX: 0.72, letterSpacing: '-0.04em', duration: 0.6, ease: 'power3.out' }, at);
  },
  collapse(tl, { chars, at, r }) {
    tl.to(chars, { y: () => 4 + r() * 14, rotation: () => (r() - 0.5) * 28, scaleY: 0.62, duration: 0.7, stagger: 0.04, ease: 'power3.in' }, at);
  },
  impact(tl, { chars, at, r }) {
    tl.to(chars, { keyframes: { x: [0, -6, 5, -3, 2, 0], y: [0, 3, -2, 1, 0, 0] }, duration: 0.45, ease: 'none' }, at);
    tl.to(chars, { rotation: () => (r() - 0.5) * 10, duration: 0.2 }, at);
  },
  boneCrack(tl, { chars, at, r }) {
    const mid = (chars.length - 1) / 2;
    tl.to(chars, { x: (i) => (i - mid) * (6 + r() * 6), skewX: () => (r() - 0.5) * 30, color: '#ffffff', duration: 0.18, ease: 'expo.out' }, at);
    tl.to(chars, { color: '#ff5a7e', duration: 1.2 }, at + 0.25);
  },
  firm(tl, { word, at }) {
    tl.to(word, { textShadow: '0px 0px 18px rgba(255,236,210,0.55), 0px 1px 2px rgba(0,0,0,0.5)', scale: 1.04, duration: 0.8 }, at);
  },
  flame(tl, { chars, at }) {
    tl.to(chars, { color: '#ffc27d', textShadow: '0px 0px 22px rgba(255,130,40,0.95), 0px 0px 2px rgba(0,0,0,0.6)', duration: 1, stagger: 0.08 }, at);
    tl.to(chars, { keyframes: { opacity: [1, 0.75, 1, 0.85, 1] }, duration: 2, ease: 'none', stagger: { each: 0.05, from: 'random' } }, at + 0.8);
  },
  scorch(tl, { chars, at }) {
    tl.to(chars, { color: '#ff9a4a', textShadow: '0px 0px 20px rgba(255,80,10,1), 0px 0px 2px rgba(0,0,0,0.6)', duration: 0.5, stagger: 0.05 }, at);
    tl.to(chars, { color: '#4a2416', textShadow: '0px 0px 10px rgba(255,70,10,0.7), 0px 0px 2px rgba(0,0,0,0.6)', duration: 1.6, stagger: 0.06 }, at + 0.9);
  },
  dim(tl, { line, at }) {
    tl.to(line, { opacity: 0.7, duration: 2.6 }, at);
  },
  abandon(tl, { chars, at, r }) {
    tl.to(chars, { x: () => 10 + r() * 50, y: () => -10 - r() * 30, opacity: 0, filter: 'blur(4px)', duration: 3.2,
      stagger: 0.55, ease: 'sine.in' }, at);
  },
};

function lineTimeline(line, L, idx) {
  const D = L.e - L.t;
  const beat = line.querySelector('.beat');
  const lift = line.querySelector('.lift');
  const split = SplitText.create(beat, { type: 'words,chars', wordsClass: 'word', charsClass: 'char' });
  const words = split.words;
  const allChars = split.chars;
  const total = allChars.length;
  const r = rng(1009 * (idx + 1));
  const tl = gsap.timeline();
  const isLast = L.cls?.includes('last');
  const keep = L.fx?.some((f) => f.fx === 'permanent');

  // entrance (visibility itself is driven by the clock in main.js — zero-length
  // sets don't reverse reliably when the film is scrubbed backwards)
  tl.fromTo(allChars, { opacity: 0, y: 9, filter: 'blur(7px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: isLast ? 2.2 : 0.8, stagger: isLast ? 0.08 : 0.022, ease: 'power2.out' }, 0);

  // word-level choreography
  let charIndex = 0;
  const wordStart = words.map((w) => { const s = charIndex; charIndex += w.querySelectorAll('.char').length; return s; });
  for (const f of L.fx || []) {
    const targets = f.w === '*' ? [{ word: beat, chars: allChars, start: 0 }]
      : words.map((w, i) => ({ word: w, chars: [...w.querySelectorAll('.char')], start: wordStart[i] }))
        .filter((o) => norm(o.word.textContent) === norm(f.w));
    for (const o of targets) {
      const at = f.at ?? 0.25 + (o.start / total) * Math.min(D - 1, 3.4);
      FX[f.fx](tl, { line, word: o.word, chars: o.chars, at, D, r });
    }
  }

  // exit
  if (isLast) tl.to(line, { opacity: 0, duration: 3.5, ease: 'sine.in' }, D - 3.5);
  else if (keep) tl.to(line, { opacity: 0, duration: 1.4, ease: 'sine.in' }, D - 1.4);
  else {
    tl.to(line, { opacity: 0, filter: 'blur(8px)', duration: 0.85, ease: 'power1.in' }, D - 0.85);
    tl.to(lift, { y: -8, duration: 0.85, ease: 'power1.in' }, D - 0.85);
  }
  return tl;
}

// The giant words. Each is built from stacked copies (layers) of the word:
// the colour channels for "attack", motion trails for "bullet", two jagged
// halves for "cracks". 0 = the moment it's sung.
const HERO_LAYERS = { attack: ['r', 'c', 'main'], collapse: ['main'], bullet: ['g2', 'g1', 'main'], cracks: ['top', 'bot'] };
const fromNow = { immediateRender: false };
const HERO_FX = {
  attack(tl, { hw, layers: [r, c] }) {
    tl.fromTo(hw, { scale: 0.3, opacity: 0 }, { scale: 1.12, opacity: 1, duration: 0.07, ease: 'expo.out', ...fromNow }, 0);
    tl.to(hw, { scale: 1, duration: 0.4, ease: 'power2.out' }, 0.07);
    // the channels tear apart, snap back, then glitch twice
    tl.fromTo(r, { x: '-0.1em', opacity: 0.9 }, { x: 0, opacity: 0, duration: 0.25, ease: 'expo.out', ...fromNow }, 0);
    tl.fromTo(c, { x: '0.1em', opacity: 0.9 }, { x: 0, opacity: 0, duration: 0.25, ease: 'expo.out', ...fromNow }, 0);
    for (const at of [0.42, 0.6]) {
      tl.fromTo(r, { x: '-0.05em', opacity: 0.8 }, { x: 0, opacity: 0, duration: 0.1, ease: 'none', ...fromNow }, at);
      tl.fromTo(c, { x: '0.05em', opacity: 0.8 }, { x: 0, opacity: 0, duration: 0.1, ease: 'none', ...fromNow }, at);
    }
    tl.to(hw, { opacity: 0, scale: 1.06, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' }, 0.75);
  },
  collapse(tl, { hw, chars, r }) {
    tl.fromTo(hw, { scale: 1.25, opacity: 0, filter: 'blur(12px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.12, ease: 'expo.out', ...fromNow }, 0);
    // the letters give way and fall out of the frame, from the middle outwards
    tl.to(chars, { y: () => `${45 + r() * 30}vh`, rotation: () => (r() - 0.5) * 70, scaleY: 0.55, opacity: 0,
      duration: 0.6, stagger: { each: 0.035, from: 'center' }, ease: 'power2.in' }, 0.15);
  },
  bullet(tl, { hw, layers: [g2, g1] }) {
    tl.fromTo(hw, { scale: 0.12, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.06, ease: 'expo.out', ...fromNow }, 0);
    // then it keeps coming, through the screen, trailing copies of itself
    tl.to(hw, { scale: 7, opacity: 0, filter: 'blur(14px)', duration: 0.45, ease: 'power2.in' }, 0.16);
    tl.fromTo([g1, g2], { opacity: 0 }, { opacity: (i) => (i ? 0.25 : 0.45), duration: 0.12, ...fromNow }, 0.16);
  },
  cracks(tl, { hw, layers: [top, bot] }) {
    tl.fromTo(hw, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.1, ease: 'expo.out', ...fromNow }, 0);
    // it splits along the jagged line; the halves part, redden and sink into the dark
    tl.fromTo(top, { x: 0, y: 0, rotation: 0 }, { x: '-0.12em', y: '-0.08em', rotation: -3, duration: 0.45, ease: 'expo.out', ...fromNow }, 0.11);
    tl.fromTo(bot, { x: 0, y: 0, rotation: 0 }, { x: '0.12em', y: '0.09em', rotation: 2.5, duration: 0.45, ease: 'expo.out', ...fromNow }, 0.11);
    tl.fromTo([top, bot], { color: '#ffffff' }, { color: '#ff5a7e', duration: 0.8, ...fromNow }, 0.3);
    tl.to(top, { y: '-0.3em', opacity: 0, filter: 'blur(6px)', duration: 2, ease: 'power1.in' }, 0.85);
    tl.to(bot, { y: '0.35em', opacity: 0, filter: 'blur(6px)', duration: 2, ease: 'power1.in' }, 0.85);
  },
  // with reduced motion: no flying, just the word brightening in place
  calm(tl, { hw }) {
    tl.fromTo(hw, { opacity: 0 }, { opacity: 0.85, duration: 0.08, ...fromNow }, 0);
    tl.to(hw, { opacity: 0, duration: 0.8 }, 0.5);
  },
};

function heroTimeline(layer, H, lift, reducedMotion, idx) {
  const el = document.createElement('div');
  el.className = `hero hero-${H.fx}`;
  el.setAttribute('aria-hidden', 'true');
  const shake = document.createElement('div');
  shake.className = 'hero-shake';
  const hw = document.createElement('div');
  hw.className = 'hero-word';
  hw.style.setProperty('--n', H.word.length);
  const layers = HERO_LAYERS[H.fx].map((k) => {
    const s = document.createElement('span');
    s.className = `layer ${k}`;
    s.textContent = H.word;
    hw.appendChild(s);
    return s;
  });
  shake.appendChild(hw);
  el.appendChild(shake);
  layer.appendChild(el);

  const chars = H.fx === 'collapse' ? SplitText.create(layers[0], { type: 'chars', charsClass: 'char' }).chars : [];
  const tl = gsap.timeline();
  HERO_FX[reducedMotion ? 'calm' : H.fx](tl, { hw, layers, chars, r: rng(7919 * (idx + 1)) });
  // the line it came from steps back while the word has the screen
  if (lift) {
    tl.to(lift, { opacity: 0.2, duration: 0.05 }, 0);
    tl.to(lift, { opacity: 1, duration: 0.8 }, Math.min(0.6, H.dur));
  }
  return { el, tl };
}

function titleTimeline(title) {
  const inner = title.querySelector('.title-inner');
  const top = title.querySelector('.top');
  const bot = title.querySelector('.bot');
  const tl = gsap.timeline();
  tl.fromTo(inner, { opacity: 0, filter: 'blur(14px)', scale: 1.05 }, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 5.5, ease: 'power2.out' }, 0.4);
  // the fracture
  tl.to(top, { x: -7, y: -2, rotation: -0.7, duration: 0.5, ease: 'expo.out' }, 12.6);
  tl.to(bot, { x: 8, y: 3, rotation: 0.6, duration: 0.5, ease: 'expo.out' }, 12.6);
  tl.to(top, { y: -14, opacity: 0, filter: 'blur(6px)', duration: 3, ease: 'power1.in' }, 13.4);
  tl.to(bot, { y: 18, opacity: 0, filter: 'blur(6px)', duration: 3, ease: 'power1.in' }, 13.4);
  return tl;
}

export function buildLyrics(container, title, heroLayer, { reducedMotion = false } = {}) {
  const master = gsap.timeline({ paused: true });
  master.add(titleTimeline(title), 0);
  const spans = [{ el: title, t: 0, e: 16.8, on: false }];
  LINES.forEach((L, i) => {
    const line = document.createElement('div');
    line.className = 'line ' + (L.cls || '');
    const beat = document.createElement('span');
    beat.className = 'beat';
    L.text.split(' / ').forEach((part, j) => {
      if (j) beat.appendChild(document.createElement('br'));
      beat.appendChild(document.createTextNode(part));
    });
    const lift = document.createElement('span');
    lift.className = 'lift';
    lift.appendChild(beat);
    line.appendChild(lift);
    line.setAttribute('aria-label', L.text.replace(' / ', ' '));
    container.appendChild(line);
    master.add(lineTimeline(line, L, i), L.t);
    spans.push({ el: line, t: L.t, e: L.e, on: false });
  });

  HEROES.forEach((H, i) => {
    const li = LINES.findIndex((L) => H.t >= L.t && H.t < L.e && norm(L.text).includes(norm(H.word)));
    const lift = li >= 0 ? container.children[li].querySelector('.lift') : null;
    const { el, tl } = heroTimeline(heroLayer, H, lift, reducedMotion, i);
    master.add(tl, H.t);
    spans.push({ el, t: H.t, e: H.t + H.dur, on: false });
  });

  const seek = (t) => {
    master.seek(Math.max(0, t), false);
    for (const sp of spans) {
      const on = t >= sp.t && t < sp.e;
      if (on !== sp.on) { sp.on = on; sp.el.style.visibility = on ? 'visible' : 'hidden'; }
    }
  };
  return { seek };
}
