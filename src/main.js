import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { World } from './scene.js';
import { sampleTracks, DURATION, HITS } from './choreography.js';
import { buildLyrics } from './lyrics.js';
import { setupTheatre } from './theatre.js';
import { Soundscape } from './audio.js';
import { CODA, CHEST } from './soundDesign.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const studio = params.has('studio');
const coarse = matchMedia('(pointer: coarse)').matches;
const lowPower = coarse || Math.min(innerWidth, innerHeight) < 600;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = $('#gl');
const world = new World(canvas, { lowPower, reducedMotion });
const resize = () => world.resize(innerWidth, innerHeight);
resize();
addEventListener('resize', resize);

// ---------- loading ----------
const audio = new Audio();
audio.preload = 'auto';
audio.src = `${import.meta.env.BASE_URL}media/fracture.m4a`;

let loaded = 0;
const LOAD_STEPS = 4;
const step = () => { loaded++; $('#loadfill').style.width = `${(loaded / LOAD_STEPS) * 100}%`; };

const imageReady = new THREE.TextureLoader()
  .loadAsync(`${import.meta.env.BASE_URL}media/${lowPower ? 'lake-mobile.jpg' : 'lake.jpg'}`)
  .then((t) => { world.setImage(t); step(); });
const audioReady = new Promise((res) => {
  if (audio.readyState >= 3) return res();
  audio.addEventListener('canplaythrough', res, { once: true });
  audio.addEventListener('loadeddata', () => setTimeout(res, 1500), { once: true }); // iOS never fires canplaythrough before a gesture
}).then(step);
const fontsReady = document.fonts.ready.then(step);
const theatreReady = setupTheatre({ studio }).then((th) => { step(); return th; });

let lyricsTL;
let theatre;

Promise.all([imageReady, audioReady, fontsReady, theatreReady]).then(([, , , th]) => {
  theatre = th;
  lyricsTL = buildLyrics($('#lyrics'), $('#title'), $('#heroes'), { reducedMotion });
  lyricsTL.seek(0);
  const begin = $('#begin');
  begin.disabled = false;
  begin.querySelector('.btn-label').textContent = 'Begin';
  $('.loadbar').classList.add('done');
  begin.focus({ preventScroll: true });
});

// ---------- audio: reactive chain + analysis ----------
const soundscape = new Soundscape(audio);
let analyser, freq;
function initAudioGraph() {
  if (soundscape.ctx) return;
  try {
    soundscape.init();
    analyser = soundscape.analyser;
    freq = new Uint8Array(analyser.frequencyBinCount);
  } catch (e) {
    console.warn('Web Audio unavailable; playing the song untouched', e);
  }
}

// Build the graph (suspended) as the page opens, so the samples are decoded by the time Begin is tapped.
initAudioGraph();

// ---------- the title page's heartbeat ----------
// A slow, deep heartbeat under the title. Browsers keep sound off until the page is first touched,
// so it starts then; if that touch is Begin, it carries a few fading beats into the film's dark opening.
const titleBeat = { on: false, next: 0, left: Infinity, gain: 1 };
function startTitleBeat() {
  if (titleBeat.on || started) return;
  soundscape.resume();
  titleBeat.on = true;
  titleBeat.next = performance.now() / 1000 + 0.15;
}
addEventListener('pointerdown', startTitleBeat, { capture: true });
addEventListener('keydown', startTitleBeat, { capture: true });
function titleHeartbeat(now) {
  if (!titleBeat.on || now < titleBeat.next) return;
  if (titleBeat.left-- <= 0) { titleBeat.on = false; return; }
  titleBeat.next += 60 / 54;
  if (now > titleBeat.next) titleBeat.next = now + 60 / 54; // the tab was asleep
  const g = titleBeat.gain;
  soundscape.play('heartbeat', { gain: 0.24 * g, rate: 0.9, ...CHEST });
  soundscape.play('heartSub', { gain: 0.42 * g, rate: 0.82, ...CHEST });
  if (titleBeat.left !== Infinity) titleBeat.gain *= 0.6;
}

const sound = { level: 0, bass: 0, slow: 0, beat: 0, lastBeat: 0 };
function analyse(dt, now) {
  if (!analyser || audio.paused) {
    sound.level *= 0.9; sound.beat *= Math.exp(-dt * 6);
    return;
  }
  analyser.getByteFrequencyData(freq);
  let b = 0, l = 0;
  for (let i = 1; i < 6; i++) b += freq[i];
  for (let i = 0; i < 96; i++) l += freq[i];
  b /= 5 * 255; l /= 96 * 255;
  sound.level += (l - sound.level) * 0.2;
  sound.slow += (b - sound.slow) * 0.04;
  if (b - sound.slow > 0.05 && now - sound.lastBeat > 0.28) { sound.beat = 1; sound.lastBeat = now; }
  sound.beat *= Math.exp(-dt * 5.5);
}

// ---------- clock ----------
// audio.currentTime is coarse in some browsers; extrapolate between updates.
const clock = { ct: 0, stamp: 0 };
function filmTime(now) {
  if (studio && theatre && audio.paused) {
    const p = theatre.sequence.position;
    if (Math.abs(audio.currentTime - p) > 0.04) audio.currentTime = p;
    return p;
  }
  const ct = audio.currentTime;
  if (ct !== clock.ct || audio.paused) { clock.ct = ct; clock.stamp = now; return ct; }
  return Math.min(ct + (now - clock.stamp), ct + 0.25);
}

// ---------- keeping the screen awake ----------
// A phone would otherwise dim or lock partway through. Browsers drop the lock
// when the tab is hidden, so it's taken again on return.
let wakeLock = null;
function holdScreen(on) {
  if (!navigator.wakeLock) return;
  if (on && !wakeLock) {
    const p = (wakeLock = navigator.wakeLock.request('screen').catch(() => null));
    p.then((lock) => {
      if (!lock) { if (wakeLock === p) wakeLock = null; return; }
      lock.addEventListener('release', () => { if (wakeLock === p) wakeLock = null; });
    });
  } else if (!on && wakeLock) {
    const p = wakeLock;
    wakeLock = null;
    p.then((lock) => lock?.release());
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !audio.paused) holdScreen(true);
});

// ---------- the phone's tilt ----------
// Tilting the phone moves the picture a little, as if looking past the edge of a
// window (the mouse doesn't: on desktop the picture holds still). The rest
// position drifts toward however the phone is being held.
const tilt = { rest: null, x: 0, y: 0, sx: 0, sy: 0, k: 0 };
// how far the picture moves at full tilt (a fraction of the screen), and the zoom that leaves room for it
const TILT_SHIFT = 0.08, TILT_OVERSCAN = 1.06;
function onTilt(e) {
  if (e.beta == null || e.gamma == null) return;
  const a = ((screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI) / 180;
  const x = e.gamma * Math.cos(a) + e.beta * Math.sin(a);
  const y = e.beta * Math.cos(a) - e.gamma * Math.sin(a);
  if (!tilt.rest) tilt.rest = { x, y };
  tilt.rest.x += (x - tilt.rest.x) * 0.004;
  tilt.rest.y += (y - tilt.rest.y) * 0.004;
  const clamp = (v) => Math.max(-0.5, Math.min(0.5, v));
  tilt.x = clamp((x - tilt.rest.x) / 40);
  tilt.y = clamp((y - tilt.rest.y) / 40);
  pointer.x = 0.5 + tilt.x;
  pointer.y = 0.5 + tilt.y;
}
// Listen from the start (the title page tilts too). Browsers that ask for permission (iOS, and
// newer Chrome) send nothing until it's granted, which can only be asked from inside a tap.
let tiltAsked = false;
function listenForTilt() {
  const DOE = window.DeviceOrientationEvent;
  if (!coarse || !DOE) return;
  addEventListener('deviceorientation', onTilt); // the same listener is only ever added once
  if (typeof DOE.requestPermission === 'function' && !tiltAsked) {
    tiltAsked = true;
    DOE.requestPermission().catch(() => {});
  }
}
if (coarse && window.DeviceOrientationEvent) addEventListener('deviceorientation', onTilt);
addEventListener('pointerdown', listenForTilt, { capture: true, once: true });

// ---------- playback ----------
let started = false;
let ending = false; // the song has finished; the lake plays on in the dark
let codaTimer;
const pre = { k: 1, lift: 0 }; // blend from the idle intro look into the film; lift: the scene waking on Begin

// ---------- the title page ----------
// Every so often a hairline crack runs through "Fracture", the halves slip a hair apart, then it seals.
const introTitle = $('#intro .intro-title');
const crack = (() => {
  if (reducedMotion) return null;
  const word = introTitle.textContent.trim();
  introTitle.setAttribute('aria-label', word);
  introTitle.innerHTML = `<span class="ct-top" aria-hidden="true">${word}</span><span class="ct-bot" aria-hidden="true">${word}</span>`
    + `<span class="ct-wrap" aria-hidden="true"><span class="ct-seam">${word}</span></span>`;
  const [top, bot, wrap] = introTitle.children;
  let call = null, tl = null;
  const run = () => {
    const off = parseFloat(getComputedStyle(introTitle).fontSize) * 0.022;
    tl = gsap.timeline({ onComplete: () => { call = gsap.delayedCall(6 + Math.random() * 5, run); } })
      .set(wrap, { clipPath: 'inset(0 100% 0 0)', opacity: 1 })
      .to(wrap, { clipPath: 'inset(0 0% 0 0)', duration: 0.34, ease: 'power2.in' })
      .to(top, { x: -off, y: -off * 0.7, duration: 0.2, ease: 'expo.out' }, 0.3)
      .to(bot, { x: off, y: off * 0.7, duration: 0.2, ease: 'expo.out' }, 0.3)
      .to([top, bot], { x: 0, y: 0, duration: 1.6, ease: 'sine.inOut' }, 1.7)
      .to(wrap, { opacity: 0, duration: 1.8, ease: 'sine.inOut' }, 1.6);
  };
  call = gsap.delayedCall(2.5, run);
  return { stop() { call?.kill(); tl?.kill(); } };
})();

// Far-off lightning inside the clouds, in the part of the sky the title card leaves visible.
const bolt = { x: 0.5, y: 0.7, z: 0, next: performance.now() / 1000 + 3 };
function lightning(now) {
  if (reducedMotion || now < bolt.next) return;
  bolt.next = now + 8 + Math.random() * 7;
  bolt.x = 0.3 + Math.random() * 0.4;
  bolt.y = 0.6 + Math.random() * 0.2;
  const strong = 1.0 + Math.random() * 0.6;
  gsap.timeline()
    .to(bolt, { z: strong, duration: 0.04, ease: 'none' })
    .to(bolt, { z: strong * 0.15, duration: 0.12, ease: 'power2.out' })
    .to(bolt, { z: strong * 0.75, duration: 0.04, ease: 'none' }, '+=0.06')
    .to(bolt, { z: 0, duration: 0.7, ease: 'power2.out' });
}
const playBtn = $('#play');
const scrub = $('#scrub');
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function play() {
  initAudioGraph();
  soundscape.resume();
  audio.play().catch(() => {});
}
function togglePlay() {
  if (!started) return;
  if (audio.paused) play(); else audio.pause();
}

// "Sound on · headphones recommended · check left / right"
const check = $('#check');
check.addEventListener('click', () => {
  if (check.disabled) return;
  check.disabled = true;
  initAudioGraph();
  const label = check.textContent;
  soundscape.checkStereo((side) => {
    check.textContent = side === 'left' ? '← left' : side === 'right' ? 'right →' : label;
  }).catch(() => {}).finally(() => { check.textContent = label; check.disabled = false; });
});

$('#begin').addEventListener('click', (e) => {
  // fullscreen has to be asked for inside the click, before anything else
  if (!studio && !document.fullscreenElement) {
    document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {});
  }
  started = true;
  audio.currentTime = params.has('t') ? +params.get('t') : 0;
  play();
  listenForTilt();
  // stepping in: a ripple spreads across the lake below where you tapped, and the title lifts away like breath off glass
  crack?.stop();
  const [ix] = world.screenToImage(e.clientX || innerWidth / 2, 0, innerWidth, innerHeight, current);
  world.addRipple(ix, 0.19, 2.6);
  setTimeout(() => world.addRipple(ix, 0.19, 1.2), 260);
  gsap.timeline().to(pre, { lift: 1, duration: 0.5, ease: 'sine.out' }).to(pre, { lift: 0, duration: 1.8, ease: 'sine.in' }, 1.0);
  soundscape.play('strain');
  if (titleBeat.on) { titleBeat.left = 3; titleBeat.gain *= 0.75; }
  gsap.to(introTitle, { y: -26, opacity: 0, filter: 'blur(10px)', duration: 1.5, ease: 'power2.in' });
  $('#intro').classList.add('hidden');
  gsap.to(pre, { k: 0, duration: 2, delay: 0.9, ease: 'sine.inOut' });
  wake();
});

$('#replay').addEventListener('click', () => {
  $('#outro').classList.add('hidden');
  audio.currentTime = 0;
  play();
  wake();
});

// The song ends; the screen stays black and the lake is left on its own for a
// while before the outro card comes up.
function startCoda() {
  ending = true;
  $('#controls').classList.add('hidden');
  document.body.classList.add('idle');
  soundscape.startCoda();
  clearTimeout(codaTimer);
  codaTimer = setTimeout(() => {
    ending = false;
    document.body.classList.remove('idle');
    $('#outro').classList.remove('hidden');
    holdScreen(false);
  }, CODA.outroAt * 1000);
}
function cancelCoda() {
  clearTimeout(codaTimer);
  ending = false;
  soundscape.endCoda();
}
function seek(time) {
  cancelCoda();
  soundscape.stopHaptics();
  audio.currentTime = time;
  $('#outro').classList.add('hidden');
}

audio.addEventListener('play', () => {
  cancelCoda();
  playBtn.classList.remove('paused');
  playBtn.setAttribute('aria-label', 'Pause');
  holdScreen(true);
});
audio.addEventListener('pause', () => {
  playBtn.classList.add('paused');
  playBtn.setAttribute('aria-label', 'Play');
  soundscape.stopHaptics();
  if (audio.ended) return; // the coda takes over
  holdScreen(false);
  wake();
});
audio.addEventListener('ended', startCoda);

playBtn.addEventListener('click', togglePlay);
scrub.addEventListener('input', () => {
  seek(+scrub.value);
  if (studio && theatre) theatre.sequence.position = +scrub.value;
});
// The way back into fullscreen after leaving it (on phones too). Hidden where
// a page can't go fullscreen at all, like iPhone Safari (videos only).
// The title page has one too.
for (const id of ['#fs', '#fs-intro']) {
  const btn = $(id);
  if (!document.fullscreenEnabled) { btn.hidden = true; continue; }
  btn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {});
  });
}

addEventListener('keydown', (e) => {
  if (!started || e.target.closest?.('input, [contenteditable]')) return;
  if (e.code === 'Space' || e.code === 'KeyK') { e.preventDefault(); togglePlay(); wake(); }
  else if (e.code === 'ArrowRight') { seek(Math.min(DURATION, audio.currentTime + 5)); wake(); }
  else if (e.code === 'ArrowLeft') { seek(Math.max(0, audio.currentTime - 5)); wake(); }
  else if (e.code === 'KeyF') $('#fs').click();
});

// The controls come up on a tap, a key, a pause, or the mouse reaching the
// bottom of the screen. Moving the mouse anywhere else only shows the cursor,
// so stirring the lake doesn't summon them. Both fade while the film plays.
let idleTimer, cursorTimer;
const NEAR_CONTROLS = 140; // px from the bottom edge
function wake() {
  if (!started || ending) return;
  $('#controls').classList.remove('hidden');
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!audio.paused && !studio) {
      $('#controls').classList.add('hidden');
      document.body.classList.add('idle');
    }
  }, 2600);
}
function showCursor() {
  if (!started) return;
  document.body.classList.remove('idle');
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => {
    if ((ending || !audio.paused) && $('#controls').classList.contains('hidden')) document.body.classList.add('idle');
  }, 1600);
}

// ---------- touching the lake ----------
const pointer = { x: 0.5, y: 0.5, sx: 0, lastTrail: 0 };
let current = sampleTracks(0);
canvas.addEventListener('pointerdown', (e) => {
  const [ix, iy] = world.screenToImage(e.clientX, e.clientY, innerWidth, innerHeight, current);
  if (world.addRipple(ix, iy, 1.2)) soundscape.ripple(e.clientX / innerWidth, 1 - iy / 0.229);
  if (e.pointerType === 'mouse') showCursor(); else wake();
});
addEventListener('pointermove', (e) => {
  pointer.x = e.clientX / innerWidth;
  pointer.y = e.clientY / innerHeight;
  if (e.pointerType === 'mouse' && innerHeight - e.clientY < NEAR_CONTROLS) wake();
  else showCursor();
  const now = performance.now();
  if (e.pointerType === 'mouse' && now - pointer.lastTrail > 140) {
    pointer.lastTrail = now;
    const [ix, iy] = world.screenToImage(e.clientX, e.clientY, innerWidth, innerHeight, current);
    world.addRipple(ix, iy, 0.3);
  }
});

// ---------- frame loop ----------
const root = document.documentElement.style;
const v = {};
let last = performance.now() / 1000;
let lastScrubUpdate = 0;

function frame() {
  requestAnimationFrame(frame);
  renderFrame();
}

// The chorus's glass breaks over the gap in the clouds. Its impact is keyed for a
// 16:9 screen; on any other shape it's pinned to the same spot on the photo. On a
// portrait phone that spot is just off the right edge, so the impact slides in to
// the nearest glow that is in view (the camera never pans for it).
const KEYED_ASPECT = 16 / 9;
const GLASS_ENDS = 162.5; // after this the impact is the bullet, centred on screen
const IMPACT_MAX_X = 0.72;
function pinImpact(t) {
  if (t >= GLASS_ENDS) return;
  const [ix, iy] = World.toImage(v.impactX, v.impactY, KEYED_ASPECT, v);
  const [x, y] = World.toScreen(ix, iy, world.aspect, v);
  v.impactX = Math.min(x, IMPACT_MAX_X);
  v.impactY = y;
}

// On each of the four hits the world freezes for a moment while only the word
// moves (a "hit-stop"): the world's clock stops, the film's doesn't.
const HIT_STOP = 0.085;
let worldTime = 0;

function renderFrame() {
  const now = performance.now() / 1000;
  const dt = Math.min(0.1, now - last);
  last = now;

  const t = started ? filmTime(now) : 0;
  if (!HITS.some((h) => t >= h && t < h + HIT_STOP)) worldTime += dt;
  const wt = worldTime;
  if (studio && theatre && !audio.paused) theatre.sequence.position = t;
  analyse(dt, now);

  sampleTracks(t, v);
  const off = theatre?.offsets;
  if (off) for (const k in v) if (off[k]) v[k] += off[k];

  // the idle look behind the title card: a dim, slowly boiling storm
  if (pre.k > 0) {
    v.fade = v.fade * (1 - pre.k) + (0.62 - 0.3 * pre.lift) * pre.k;
    v.cloud = v.cloud * (1 - pre.k) + 0.35 * pre.k;
    lightning(now);
  }
  titleHeartbeat(now);
  world.uniforms.uBolt.value.set(bolt.x, bolt.y, bolt.z * pre.k);

  // the pointer / tilt turns the listener's head; only the phone's tilt moves the picture
  pointer.sx += ((pointer.x - 0.5) - pointer.sx) * 0.03;
  pinImpact(t); // before the tilt, so the glass stays put on the screen while the world behind it moves
  tilt.sx += (tilt.x - tilt.sx) * 0.06;
  tilt.sy += (tilt.y - tilt.sy) * 0.06;
  tilt.k += ((tilt.rest && !reducedMotion ? 1 : 0) - tilt.k) * 0.02; // eases in with the first reading
  if (tilt.k > 0.001) {
    v.zoom *= 1 + (TILT_OVERSCAN - 1) * tilt.k;
    const { sx, sy } = World.view(world.aspect, v);
    v.focusX += tilt.sx * TILT_SHIFT * sx * tilt.k;
    v.focusY -= tilt.sy * TILT_SHIFT * sy * tilt.k;
  }
  current = v;
  // the listener's head turns a little with the pointer / the phone's tilt
  soundscape.setHeading(pointer.sx * 0.35);
  // a seek or a stall counts as paused: the song is silent and t isn't moving, so the
  // stems would otherwise be torn down and restarted at the same spot every frame or so
  soundscape.update(v, t, started && !audio.paused && !audio.seeking && audio.readyState >= 3);

  const beat = sound.beat;
  world.render(v, { time: wt, audio: sound.level, beat });

  // text rides the same heartbeat and shake as the world
  root.setProperty('--pulse', (beat * v.pulse).toFixed(3));
  const sh = v.shake * beat * (reducedMotion ? 1 : 5);
  const tr = v.tremor * (reducedMotion ? 0.6 : 3.5); // the same tremor as the world, in px
  const tx = Math.sin(wt * 23.1) + Math.sin(wt * 37.7 + 1.3) * 0.6 + Math.sin(wt * 61.3 + 2.1) * 0.4;
  const ty = Math.cos(wt * 19.7) + Math.cos(wt * 41.9 + 0.7) * 0.6 + Math.sin(wt * 53.1 + 0.4) * 0.4;
  root.setProperty('--sx', `${(Math.sin(wt * 91) * sh + tx * tr * 0.5).toFixed(2)}px`);
  root.setProperty('--sy', `${(Math.cos(wt * 77) * sh + ty * tr * 0.5).toFixed(2)}px`);

  if (lyricsTL) lyricsTL.seek(t + (off?.lyricsOffset || 0));

  if (started && now - lastScrubUpdate > 0.25) {
    lastScrubUpdate = now;
    scrub.value = t;
    scrub.style.setProperty('--p', `${(t / DURATION) * 100}%`);
    $('#time').textContent = fmt(t);
  }
}
requestAnimationFrame(frame);

// debugging: start at a moment with ?t=136, or call __fracture.preview(136) in the console
window.__fracture = {
  world, audio, sampleTracks, sound, renderFrame, soundscape,
  preview(time) {
    started = true; pre.k = 0;
    $('#intro').classList.add('hidden');
    audio.pause();
    audio.currentTime = time;
    if (studio && theatre) theatre.sequence.position = time;
    clock.ct = time;
    renderFrame();
    // grab the frame directly (works even when the tab isn't painting)
    return canvas.toDataURL('image/jpeg', 0.7);
  },
};
