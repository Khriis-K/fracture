// Renders the sound design offline and compares its loudness with the song,
// moment by moment.  Usage:  node scripts/sfx-loudness.mjs
// Targets: beds >= 15 dB under the song, one-shot accents >= 12 dB under.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'fracture-sfx-'));
const beats = pathToFileURL(path.join(root, 'src/beats.json')).href;
const src = readFileSync(path.join(root, 'src/soundDesign.js'), 'utf8')
  .replace("import beatData from './beats.json';", `import beatData from '${beats}' with { type: 'json' };`);
writeFileSync(path.join(tmp, 'sd.mjs'), src);
const { BEDS, CUES } = await import(pathToFileURL(path.join(tmp, 'sd.mjs')).href);
writeFileSync(path.join(tmp, 'design.json'), JSON.stringify({ beds: BEDS, cues: CUES }));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(root, 'public/media/fracture.m4a'), '-ac', '1', '-ar', '22050', path.join(tmp, 'song22k.wav')]);
process.stdout.write(execFileSync('python', [path.join(root, 'scripts/sfx_mix.py'), tmp], { cwd: root }));
