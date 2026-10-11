import json, subprocess, sys, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR = 22050
S = sys.argv[1]
d = json.load(open(S + '/design.json'))
def load(path):
    raw = subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar',str(SR),'-f','f32le','-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
song = wavfile.read(S + '/song22k.wav')[1].astype(np.float32) / 32768
N = len(song); tt = np.arange(N) / SR
def lp(x, f): return sosfilt(butter(2, min(f, SR/2-100), 'low', fs=SR, output='sos'), x) if f else x

beds = np.zeros(N, np.float32); shots = np.zeros(N, np.float32); heart = np.zeros(N, np.float32)
for name, b in d['beds'].items():
    x = lp(load(f'public/media/sfx/{name}.mp3'), b.get('lp', 0))
    loop = np.tile(x, N // len(x) + 1)[:N]
    k = np.array(b['gain']); g = np.interp(tt, k[:,0], k[:,1])
    beds += loop * g
cache = {}
for t, name, o in d['cues']:
    if name == 'thump':
        n = int(0.6*SR); u = np.arange(n)/SR; r = o.get('rate', 1)
        f = r*90*(32/90)**(np.minimum(u,0.35)/0.35); x = 0.9*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-u*9)
    elif name == 'ring':
        n = int(3.4*SR); u = np.arange(n)/SR
        x = (np.sin(2*np.pi*3520*u) + np.sin(2*np.pi*3533*u)) * np.minimum(1, u/0.12) * np.exp(-u*2.05)
    else:
        if name not in cache: cache[name] = load(f'public/media/sfx/{name}.mp3')
        x = cache[name]
        off = int(o.get('offset',0)*SR); x = x[off: off+int(o['dur']*SR)] if o.get('dur') else x[off:]
    x = lp(x, o.get('lp', 0)) * o.get('gain', 1)
    i = int(t*SR); j = min(N, i+len(x))
    (heart if name == 'heartbeat' else shots)[i:j] += x[:j-i]

# K-weighting (BS.1770 approximation)
kw = lambda x: sosfilt(butter(2, 1700, 'high', fs=SR, output='sos'), x) * 0.585 + sosfilt(butter(2, 60, 'high', fs=SR, output='sos'), x)
def loud(x, win):
    y = kw(x) ** 2; n = int(win*SR); hop = int(0.1*SR)
    c = np.concatenate([[0], np.cumsum(y)])
    idx = np.arange(0, N-n, hop)
    return idx/SR, -0.691 + 10*np.log10((c[idx+n]-c[idx])/n + 1e-12)
ts, Ls = loud(song, 3.0); _, Lb = loud(beds, 3.0)
tm, Lsm = loud(song, 0.4); _, Lsh = loud(shots, 0.4); _, Lh = loud(heart, 0.4)
print('song integrated-ish (mean short-term):', round(np.mean(Ls[Ls>-70]),1), 'LUFS')
print('\nBEDS vs song (3 s short-term) — worst moments per section')
secs = [(0,18,'intro'),(18,52,'verse 1 fire'),(52,96,'chorus lake'),(96,127,'verse 2 paper'),(127,162,'chorus glass'),(185,214,'final chorus'),(214,242,'outro')]
for a,b,nm in secs:
    m = (ts>=a)&(ts<b)&(Lb>-70)
    if not m.any(): continue
    diff = Lb[m]-Ls[m]; i = np.argmax(diff)
    print(f'{nm:14} song {np.median(Ls[m]):6.1f}  beds {np.median(Lb[m]):6.1f}  median gap {np.median(-diff):5.1f} dB   closest {(-diff[i]):5.1f} dB at {ts[m][i]:.0f}s')
print('\nONE-SHOTS vs song (400 ms momentary, at each hit)')
for t, name, o in d['cues']:
    if name == 'heartbeat': continue
    m = (tm>=t-0.1)&(tm<t+min(2.5,o.get('dur',2.5)))
    print(f'{t:7.2f} {name:8} shot {Lsh[m].max():6.1f}  song {np.median(Lsm[m]):6.1f}  gap {np.median(Lsm[m])-Lsh[m].max():5.1f} dB')
print('\nHEARTBEAT vs song (400 ms momentary)')
for a,b,nm in [(162,177,'panic'),(177,182.1,'panic peak'),(182.1,185.3,'hush'),(185.3,214,'final chorus')]:
    m=(tm>=a)&(tm<b)&(Lh>-70)
    print(f'{nm:13} heart peak {np.percentile(Lh[m],95):6.1f}  song {np.median(Lsm[m]):6.1f}  gap {np.median(Lsm[m])-np.percentile(Lh[m],95):5.1f} dB')
