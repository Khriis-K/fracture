# Fracture

The poem *Fracture* (October 11, 2025), rebuilt from its music video as a living, audio-synced WebGL film.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

## How it's put together

| File | What it does |
|---|---|
| `src/choreography.js` | The base film: keyframed tracks (fire, mirror, sand, ink, glass, red, flame…) timed to the song. Edit times/values here. |
| `src/lyrics.js` | Every lyric line, its timing, and its kinetic word effects (GSAP + SplitText). |
| `src/shaders/world.js` | The world shader. One photo of the lake, split into sky / ridge / water, re-lit per stanza. |
| `src/shaders/embers.js` | Ember particles rising off the ridge, plus close-up embers for "scorching my hands". |
| `src/scene.js` | Three.js renderer + postprocessing (bloom, grain, vignette, chromatic aberration, glitch). |
| `src/theatre.js` | Theatre.js offset layer for hand-tuning. |
| `src/ridge.json` | The traced mountain silhouette and waterline of `public/media/lake.jpg`. |

The audio element is the master clock. Lyrics, visuals and the Web Audio analyser (which drives the heartbeat pulse, shake and lake shimmer) all follow `audio.currentTime`.

## Sound

`src/audio.js` runs the song through a chain that follows the film:
- A low-pass filter muffles it under the ink and inside the body. This is the `muffle` track, and it snaps open on "bone cracks".
- A high shelf dulls the highs when the glass frosts.
- The stereo field narrows with the tunnel and the ending.
- Reverb opens up for the ghosts, the ink and the ending.
- A high-pass filter thins the song on "abandoned myself".
- A limiter at -1 dBFS on the master keeps pushes above the song's own level clean. In practice it only acts on the "bul" peak.

Beat detection reads the clean song before any of these effects.

What plays when is in `src/soundDesign.js`:
- `BEDS`: looping ambience (wind, fire, lake, pencil, eraser, sand, embers), each with a volume envelope over the film. Each bed is placed in 3D (HRTF): its left and right channels become two sources around the listener (`az`, `spread`, `dist`, `y`, `orbit`). The wind slowly circles, the fire sits on the ridge ahead, the pencil and embers are close, in your hands. The page crossfades each loop's seam.
- The listener's head turns a little with the pointer, or with the phone's tilt.
- `CODA`: when the song ends, the screen stays black and only the lake plays. The outro card comes up 7 s later while the water fades.
- `SHOTS`: one-shots at fixed times (thunder, the title tick, the fire whoosh, page turn, glass crack and shatter, the bone crack plus a sub thump).
- The heartbeat is generated from `src/beats.json`, the song's tracked beats at about 117.5 BPM. It's heard from inside the chest: centred, just below and in front of the head (HRTF), low-passed at 900 Hz like sound carried through the body, and kept out of the reverb. It plays on every beat through the panic attack (2:42–3:02), every other beat in the hush (3:02–3:05), and softly under the last chorus. On Android phones it's also felt. Phones can only switch the motor on and off, so `src/haptics.js` fakes strength with fast pulses (pulse-width modulation, as in the Pulsar library): in every 25 ms the motor runs longer the stronger the moment. What to feel is `hapticAt(t)` in `soundDesign.js`, a 0–1 strength over the film: lub-dub heartbeats that grow harder through the panic, a hard hit on "attack", a hit and a fading give on "collapse", and from "bul" (2:52.939) a full-strength hit, then a held buzz that sinks back and swells until "cracks" (3:01.97), with the heartbeat throbbing through it. The hush then gets soft lub-dubs. The pattern is sent a second at a time (Chrome caps patterns at 99 entries), offset by the audio's output latency, so seeking resyncs it and pausing stops it at once. iOS has no vibration API.

"Every heartbeat strikes a bullet impact" (2:50) is the big hit. The whole line is a crescendo: the song drops 6 dB as the line starts, then rises to +3 dB (`level` track, in dB), opens up (`muffle` falls to 0) and brings the voice forward (`presence`, up to +6 dB at 2.8 kHz), all peaking on "bul" (172.939). There, on the song's own heartbeat, a deep thump, a low thunder boom and a faint ear-ring land with a flash, a zoom punch and a jolt of the `tremor` track. The `tremor` track shakes the world and the lyrics through the whole attack, 2:42–3:03. Four words of the attack break out of their lines and take over the screen (`HEROES` in `lyrics.js`, the same times as `HITS` in `choreography.js`): "attack" (165.5) tears its colour channels apart, "collapse" (169.35) implodes and its letters fall out of frame, "bullet" (172.939) flies through the screen, and "cracks" (181.97) splits along a jagged line. Each gets a short dim (and a dip in the song before "attack" and "bul"), then the word, a flash or jolt, a sound, a buzz, and a ~85 ms hit-stop where the world freezes while the word moves. With reduced motion, the words only brighten in place. The crimson bridge lines are 30% bigger than the rest. The bridge ends on "bone cracks" (181.97): the bone crack and sub thump, a flash, the tunnel closing to a red circle of fresh fractures, then the hush in the dark.

The loudness script mixes in mono and ignores 3D placement. Each bed's `refDistance` equals its distance, so placement changes direction, not level.

After changing any gain, run `node scripts/sfx-loudness.mjs`. It renders the sound design offline and reports how far below the song each bed and one-shot sits at that moment, using K-weighted loudness. The targets are: beds at least 15 dB under the song, accents at least 12 dB under. The song's loudness swings about 16 dB between the quiet intro and the choruses, so fixed gains aren't enough.

Clicking the lake plays a water drop placed in 3D. Every sample is a CC0 Freesound preview, trimmed and leveled into `public/media/sfx/`. The originals are in `assets/sfx/raw/`, and the credits list is at the top of `soundDesign.js`. A missing file falls back to a synthesized stand-in or silence.

## Tuning with Theatre.js

1. Open `http://localhost:5173/?studio`.
2. In the outline, select **Fracture → Film → Offsets**. Each value there is an *offset* added on top of `choreography.js`, so zero means "as authored".
3. Scrub the Theatre timeline (it's 242 s long, the length of the song) to scrub the film, and keyframe the offsets. Press play in the page controls to hear it.
4. When you're happy, click the project in the outline → **Export** and save the JSON over `src/theatre-state.json`. That's what ships in the build. (Studio itself is dev-only and isn't bundled.)

`lyricsOffset` nudges every lyric earlier or later if the sync feels off.

## Viewing

Begin asks for fullscreen, and the screen is kept awake while the film plays (Wake Lock). The controls come up only near the bottom edge, on a tap, a key, or a pause, so moving over the lake doesn't summon them. The intro's "check left / right" plays a drop in each ear. On phones, tilt moves the horizon slightly (iOS asks for motion permission on Begin).

## Debugging

- `?t=136` starts the film at 2:16 when you press Begin.
- In the console, `__fracture.preview(162)` jumps to a moment and pauses there.

## Deploying

`npm run build` and upload `dist/` to any static host (Vercel, Netlify, GitHub Pages). The original WAV and MP4 in `assets/` aren't part of the site. It uses `public/media/fracture.m4a` (AAC 192k, 5.9 MB) and two sizes of the lake photo.
