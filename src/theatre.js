import { getProject, types } from '@theatre/core';
import projectState from './theatre-state.json';

// Theatre.js is the hand-tuning layer. The base choreography lives in
// choreography.js; every value here is an *offset* added on top of it, so an
// empty Theatre project plays the film exactly as authored. Open the studio
// with `?studio` in dev, keyframe offsets against the song, then export the
// project JSON over src/theatre-state.json to ship it.

const n = (range = [-1.5, 1.5]) => types.number(0, { range, nudgeMultiplier: 0.01 });

const GROUPS = {
  camera: ['zoom', 'focusX', 'focusY', 'cloud', 'fade'],
  fire: ['burn', 'wildfire', 'embers', 'embersNear', 'smoke', 'ghost'],
  water: ['mirror', 'ripple', 'tide'],
  paper: ['sketch', 'erase', 'sand', 'ink'],
  glass: ['crack', 'glassAlpha', 'shatter', 'frost', 'bleed', 'impactX', 'impactY'],
  body: ['red', 'pulse', 'tunnel', 'shake', 'tremor', 'flash', 'split'],
  ending: ['flame', 'heat', 'drain'],
  sound: ['muffle', 'level', 'presence'],
};

export async function setupTheatre({ studio }) {
  if (import.meta.env.DEV && studio) {
    const mod = await import('@theatre/studio');
    const s = mod.default?.initialize ? mod.default : mod.default.default; // CJS interop
    s.initialize();
  }
  const project = getProject('Fracture', { state: projectState });
  const sheet = project.sheet('Film');

  const props = { lyricsOffset: types.number(0, { range: [-2, 2], nudgeMultiplier: 0.01 }) };
  for (const g in GROUPS) props[g] = types.compound(Object.fromEntries(GROUPS[g].map((k) => [k, n()])));
  const obj = sheet.object('Offsets', props);

  const flat = { lyricsOffset: 0 };
  const flatten = (v) => {
    flat.lyricsOffset = v.lyricsOffset;
    for (const g in GROUPS) for (const k of GROUPS[g]) flat[k] = v[g][k];
  };
  flatten(obj.value);
  obj.onValuesChange(flatten);

  await project.ready;
  return { sequence: sheet.sequence, offsets: flat };
}
