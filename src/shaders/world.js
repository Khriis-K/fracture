// The whole world is one image, re-lit and re-shaped per stanza.
// Coordinates: vUv = screen (0..1, y up). `img` = image uv (y up).
// The lake image is split into sky / ridge / water using a traced ridge
// silhouette (uRidge) and a fixed waterline (WATER).

export const worldVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const MAX_RIPPLES = 8;

export const worldFragment = /* glsl */ `
precision highp float;

#ifndef OCT
#define OCT 5
#endif
#define WATER 0.229
#define PI 3.14159265
#define MAX_RIPPLES ${MAX_RIPPLES}

uniform sampler2D uImage;
uniform sampler2D uRidge;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uTime;
uniform float uZoom;
uniform vec2 uFocus;
uniform vec2 uShake;
uniform float uAudio;
uniform float uBeat;

uniform float uFade, uCloud;
uniform float uBurn, uWildfire, uSmoke, uGhost;
uniform float uMirror, uRipple, uTide;
uniform float uSketch, uErase, uSand, uInk;
uniform float uCrack, uGlassAlpha, uShatter, uFrost, uBleed;
uniform vec2 uImpact;
uniform float uRed, uPulse, uTunnel, uFlash;
uniform float uFlame, uHeat, uDrain;
uniform vec4 uRipples[MAX_RIPPLES];

varying vec2 vUv;

// ---------- noise ----------
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < OCT; i++) { v += a * vnoise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float ridgeAt(float x) { return texture2D(uRidge, vec2(clamp(x, 0.0, 1.0), 0.5)).r; }

// ---------- screen -> image (cover fit + camera) ----------
vec2 coverScale() {
  float a = uRes.x / uRes.y;
  return a > uImgAspect ? vec2(1.0, uImgAspect / a) : vec2(a / uImgAspect, 1.0);
}
vec2 toImage(vec2 s) {
  vec2 sc = coverScale() / uZoom;
  vec2 f = clamp(uFocus, sc * 0.5, 1.0 - sc * 0.5);
  return (s - 0.5) * sc + f;
}

// Animated sky: domain-warped so the storm boils without moving the hills.
vec2 skyWarp(vec2 uv, float ridge) {
  float m = smoothstep(ridge + 0.012, ridge + 0.09, uv.y);
  float t = uTime * 0.035 * uCloud;
  vec2 q = uv * vec2(2.6, 3.4);
  vec2 w = vec2(fbm(q + vec2(t, t * 0.4)), fbm(q + vec2(5.2, 1.3) - vec2(t * 0.6, t * 0.9))) - 0.5;
  vec2 w2 = vec2(fbm(q * 2.1 + w * 2.0 + t * 0.7), fbm(q * 2.1 - w * 2.0 + 3.1 - t * 0.5)) - 0.5;
  return uv + (w * 0.016 + w2 * 0.006) * m * (0.5 + 0.5 * uCloud);
}

vec3 tex(vec2 uv) { return texture2D(uImage, clamp(uv, vec2(0.001), vec2(0.999))).rgb; }

// ---------- glass ----------
// Radial + concentric crack pattern around an impact point, in screen space,
// as if a pane of glass sat between us and the lake.
struct Glass { float line; float wide; vec2 offset; float tint; float inside; };

Glass glass(vec2 s) {
  Glass g; g.line = 0.0; g.wide = 0.0; g.offset = vec2(0.0); g.tint = 1.0; g.inside = 0.0;
  float amt = max(uCrack, 0.0);
  if (amt <= 0.0) return g;
  float aspect = uRes.x / uRes.y;
  vec2 p = (s - uImpact) * vec2(aspect, 1.0);
  float r = length(p);
  float ang = atan(p.y, p.x) / (2.0 * PI) + 0.5;

  const float N = 11.0;
  float jit = (vnoise(vec2(r * 5.0, floor(ang * N) * 3.1)) - 0.5) * 0.7 + (vnoise(vec2(r * 23.0, ang * 9.0)) - 0.5) * 0.12;
  float fa = ang * N + jit;
  float sector = floor(fa);
  float dRad = min(fract(fa), 1.0 - fract(fa)) * (2.0 * PI * r / N);

  float q = log(r + 0.015) * 1.9 + hash11(sector) * 1.3 + (vnoise(vec2(ang * 30.0, 2.0)) - 0.5) * 0.4;
  float ring = floor(q);
  float dRing = min(fract(q), 1.0 - fract(q)) * (r + 0.015) / 1.9;
  float ringOn = step(0.62, hash21(vec2(sector, ring)));
  float d = min(dRad, mix(1.0, dRing, ringOn));

  float reach = amt * 1.55;
  float edge = reach + (vnoise(vec2(ang * 40.0, 1.0)) - 0.5) * 0.25 * amt;
  g.inside = 1.0 - smoothstep(edge - 0.06, edge, r);
  float px = 1.0 / uRes.y;
  float w = px * (1.1 + 1.6 * exp(-r * 6.0));
  g.line = (1.0 - smoothstep(0.0, w, d)) * g.inside * smoothstep(0.004, 0.03, r);
  g.wide = (1.0 - smoothstep(0.0, w * 6.0 + 0.004 * uBleed, d)) * g.inside;

  vec2 id = vec2(sector, ring);
  vec2 h = hash22(id) - 0.5;
  g.offset = h * 0.045 * uShatter * g.inside * smoothstep(0.0, 0.06, r);
  g.tint = 1.0 + (hash21(id + 7.0) - 0.5) * 0.28 * (0.3 + uShatter) * g.inside;
  // fading out: the whole pane dissolves in place rather than the cracks shrinking back
  float a = clamp(uGlassAlpha, 0.0, 1.0);
  g.line *= a; g.wide *= a; g.offset *= a; g.tint = mix(1.0, g.tint, a);
  return g;
}

void main() {
  vec2 s = vUv;
  float aspect = uRes.x / uRes.y;

  // heartbeat punch + shake (screen space)
  vec2 sc = (s - 0.5) / (1.0 + uPulse * uBeat * 0.025) + 0.5 + uShake;

  // heat haze for "scorching my hands"
  if (uHeat > 0.0) {
    float hz = fbm(vec2(s.x * 6.0, s.y * 3.0 - uTime * 1.6));
    sc += vec2(hz - 0.5, (hz - 0.5) * 0.4) * 0.012 * uHeat * smoothstep(0.75, 0.0, s.y);
  }

  Glass g = glass(s);
  sc += g.offset;

  vec2 uv = toImage(sc);
  float ridge = ridgeAt(uv.x);
  float isWater = 1.0 - smoothstep(WATER - 0.0015, WATER + 0.0015, uv.y);
  float isSky = smoothstep(ridge + 0.002, ridge + 0.025, uv.y);

  // ---------- water: waves, pointer ripples, reflection ----------
  vec2 wuv = uv;
  vec3 col;
  float rippleGlow = 0.0;
  if (isWater > 0.0) {
    float depth = WATER - uv.y;                       // 0 at horizon, grows toward viewer
    float persp = 0.25 + depth * 7.0;
    float amp = (0.25 + uRipple) * (1.0 + uTide * 2.2) * (1.0 + uAudio * 0.6);
    float tt = uTime * (0.6 + uTide * 0.9);
    vec2 wave = vec2(
      sin(uv.y * 260.0 / persp + tt * 1.7 + sin(uv.x * 9.0 + tt) * 1.5) * 0.0018,
      sin(uv.x * 40.0 + tt * 1.3 + fbm(uv * vec2(8.0, 30.0) + tt * 0.2) * 6.0) * 0.0011
    ) * amp * persp;
    wave += (vec2(fbm(uv * vec2(6.0, 40.0) + vec2(tt * 0.15, tt * 0.3)), 0.0) - 0.5) * 0.004 * uTide * persp;

    for (int i = 0; i < MAX_RIPPLES; i++) {
      vec4 rp = uRipples[i];
      if (rp.w <= 0.0) continue;
      float age = uTime - rp.z;
      if (age < 0.0 || age > 5.0) continue;
      vec2 dv = (uv - rp.xy) * vec2(uImgAspect, 3.2);
      float dist = length(dv);
      float rad = age * 0.16;
      float k = (dist - rad) * 55.0;
      float ringv = sin(k * 2.2) * exp(-k * k * 0.15) * exp(-age * 0.9) * rp.w;
      wave += normalize(dv + 1e-5) * ringv * 0.006 * vec2(1.0, 0.35);
      rippleGlow += max(ringv, 0.0) * 0.12;
    }
    wuv = uv + wave;
    wuv.y = min(wuv.y, WATER - 0.0008);

    vec3 base = tex(wuv);
    // true mirror: sample the (animated) sky above the waterline
    float rv = WATER + depth * 3.4;
    vec2 ruv = vec2(wuv.x + wave.x * 2.0, rv + wave.y * 3.0);
    vec3 refl = tex(skyWarp(ruv, ridgeAt(ruv.x)));
    float fres = mix(0.95, 0.6, smoothstep(0.0, 0.25, depth));
    refl = refl * vec3(0.8, 0.81, 0.86) + base * 0.22;
    col = mix(base, refl, clamp(uMirror * fres, 0.0, 1.0) * (1.0 - uDrain));
    col += rippleGlow * vec3(0.9, 0.8, 0.65) * (0.4 + luma(refl));
  } else {
    vec2 suv = skyWarp(uv, ridge);
    col = tex(suv);
  }

  // ---------- frosted glass: "lest your light in the mirror grows opaque" ----------
  if (uFrost > 0.0) {
    vec3 acc = vec3(0.0);
    float rad = 0.012 * uFrost;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 2.39996 + hash21(s * 400.0) * 6.28;
      float rr = rad * sqrt((float(i) + 0.5) / 8.0);
      acc += tex(uv + vec2(cos(a), sin(a)) * rr * vec2(1.0, uImgAspect));
    }
    acc /= 8.0;
    float frostPat = fbm(s * vec2(aspect, 1.0) * 9.0);
    vec3 fog = mix(acc, vec3(luma(acc)) * vec3(0.95, 0.97, 1.0) + 0.05, 0.55);
    col = mix(col, fog, uFrost * (0.75 + 0.25 * frostPat));
  }

  // ---------- wildfire: smoke, glow, ridge fire ----------
  float h = uv.y - ridge;
  if (uBurn > 0.0 || uWildfire > 0.0 || uSmoke > 0.0) {
    float flick = fbm(vec2(uv.x * 14.0, uTime * 1.3)) * 0.6 + 0.4;
    float glow = exp(-max(h, 0.0) * 9.0) * isSky * (0.55 + 0.45 * flick) * (1.0 + uAudio * 0.5);
    vec3 warm = col * vec3(1.32, 0.86, 0.58) + vec3(0.06, 0.012, 0.0);
    col = mix(col, warm, uBurn * 0.7 * (0.35 + 0.65 * isSky));
    col += vec3(1.0, 0.42, 0.1) * glow * uBurn * 0.55;

    // flames licking along the ridge
    float fn = fbm(vec2(uv.x * 46.0, uv.y * 30.0 - uTime * 2.4));
    float band = exp(-abs(h + 0.004) * (130.0 - fn * 70.0));
    float patches = smoothstep(0.38, 0.72, vnoise(vec2(uv.x * 9.0 + uTime * 0.05, 2.0)));
    float flames = smoothstep(0.42, 0.85, fn * band * 1.6) * (1.0 - isWater) * (0.25 + 0.75 * patches);
    col += vec3(1.25, 0.45, 0.08) * flames * uWildfire * 1.8;
    col += vec3(0.9, 0.3, 0.05) * band * uWildfire * 0.14 * patches * (1.0 - isWater);
    // embers reflected on the lake
    if (isWater > 0.0) {
      float d = WATER - uv.y;
      float streak = exp(-d * 22.0) * (0.5 + 0.5 * fbm(vec2(uv.x * 30.0, d * 120.0 - uTime)));
      col += vec3(1.0, 0.4, 0.1) * streak * (uWildfire * 0.35 + uBurn * 0.15);
    }

    // smoke rising off the hills
    float sm = fbm(vec2(uv.x * 2.2 + uTime * 0.02, uv.y * 3.2 - uTime * 0.07) + fbm(uv * 4.0 - uTime * 0.03));
    float smMask = smoothstep(0.38, 0.85, sm) * smoothstep(-0.05, 0.12, h) * (1.0 - isWater);
    col = mix(col, vec3(0.07, 0.06, 0.055) + glow * vec3(0.25, 0.08, 0.02), smMask * uSmoke * 0.75);
  }

  // ---------- ghosts / phantom: a drifting double of the sky ----------
  if (uGhost > 0.0) {
    vec2 go = vec2(sin(uTime * 0.21) * 0.035 + 0.02, cos(uTime * 0.17) * 0.012);
    vec3 gc = tex(skyWarp(uv + go, ridgeAt(uv.x + go.x)));
    gc = vec3(luma(gc)) * vec3(0.82, 0.9, 1.05);
    float gm = (isSky * 0.85 + isWater * 0.35);
    col = mix(col, vec3(luma(col)) * vec3(0.9, 0.95, 1.05), uGhost * 0.45);
    col = 1.0 - (1.0 - col) * (1.0 - gc * uGhost * 0.42 * gm);
  }

  // ---------- paper: drawn, erased, impressions ----------
  if (uSketch > 0.0 || uErase > 0.0) {
    vec2 e = vec2(1.5 / 3072.0, 1.5 / 2048.0) * 1.4;
    float l = luma(tex(uv - vec2(e.x, 0.0))), r = luma(tex(uv + vec2(e.x, 0.0)));
    float b = luma(tex(uv - vec2(0.0, e.y))), t2 = luma(tex(uv + vec2(0.0, e.y)));
    float edge = clamp(length(vec2(r - l, t2 - b)) * 9.0, 0.0, 1.0);
    float paperGrain = fbm(s * vec2(aspect, 1.0) * 140.0) * 0.06 + fbm(s * vec2(aspect, 1.0) * 9.0) * 0.05;
    vec3 paper = vec3(0.075, 0.068, 0.06) + paperGrain;
    float hatch = smoothstep(0.35, 0.75, sin((s.x + s.y) * uRes.y * 0.9) * 0.5 + 0.5) * smoothstep(0.35, 0.05, luma(col));
    vec3 graphite = paper + vec3(0.78, 0.74, 0.68) * (edge * 0.85 + luma(col) * 0.35) - hatch * 0.025;
    col = mix(col, graphite, uSketch);

    // the eraser sweeps left → right
    float ex = uErase * 1.35 - 0.2;
    float wob = (fbm(vec2(s.y * 6.0, 3.0)) - 0.5) * 0.18;
    float erased = 1.0 - smoothstep(ex - 0.12, ex, s.x + wob);
    erased *= step(0.0001, uErase);
    float smudge = fbm(s * vec2(aspect, 1.0) * 5.0) * 0.06;
    col = mix(col, paper + smudge + edge * 0.04, erased);
  }

  // ---------- sand ----------
  if (uSand > 0.0) {
    float L = luma(col);
    vec3 sandCol = mix(vec3(0.05, 0.04, 0.03), vec3(0.86, 0.71, 0.52), smoothstep(0.02, 0.7, L));
    float grain = hash21(floor(s * uRes / 1.6) + floor(uTime * 8.0)) - 0.5;
    float dune = fbm(vec2(s.x * 3.0 - uTime * 0.05, s.y * 18.0));
    sandCol *= 0.85 + dune * 0.3;
    col = mix(col, sandCol + grain * 0.09, uSand * 0.85);
    // wind takes some of it
    float blow = smoothstep(0.62, 0.9, fbm(vec2(s.x * 5.0 - uTime * 0.9, s.y * 26.0)));
    col = mix(col, col * 0.35, blow * uSand * 0.5);
  }

  // ---------- ink: bleeding up from the water, permanent ----------
  if (uInk > 0.0) {
    vec2 ip = s * vec2(aspect, 1.0);
    float n = fbm(ip * 3.0 + vec2(0.0, -uTime * 0.02)) + 0.35 * fbm(ip * 11.0 + uTime * 0.05);
    float field = n * 0.62 + (1.0 - s.y) * 0.75 + (1.0 - min(s.x, 1.0 - s.x) * 2.0) * 0.18;
    float thr = 1.45 - uInk * 0.75;
    float ink = smoothstep(thr, thr + 0.035, field);
    float halo = smoothstep(thr - 0.09, thr, field) * (1.0 - ink);
    col = mix(col, col * vec3(0.55, 0.6, 0.85) * 0.6, halo * 0.6);
    col = mix(col, vec3(0.008, 0.01, 0.022) + vec3(0.02, 0.025, 0.06) * n, ink);
  }

  // ---------- the sheltered flame ----------
  if (uFlame > 0.0) {
    vec2 fp = vec2(0.585, ridgeAt(0.585) + 0.004);
    vec2 d = (uv - fp) * vec2(uImgAspect, 1.0);
    float fl = 0.75 + 0.25 * vnoise(vec2(uTime * 6.0, 1.0)) + 0.15 * vnoise(vec2(uTime * 17.0, 4.0));
    float core = exp(-dot(d, d) * 9000.0) * fl;
    float halo = exp(-length(d) * 22.0) * fl;
    vec3 fc = vec3(1.0, 0.62, 0.28);
    col += fc * (core * 2.4 + halo * 0.35) * uFlame * (1.0 - isWater);
    if (isWater > 0.0) {
      float dd = WATER - uv.y;
      float wob = (fbm(vec2(dd * 90.0, uTime * 0.8)) - 0.5) * 0.012 * (1.0 + dd * 10.0);
      float col2 = exp(-pow((uv.x - fp.x + wob) * uImgAspect * 70.0 / (1.0 + dd * 9.0), 2.0)) * exp(-dd * 6.0);
      col += fc * col2 * uFlame * 0.55 * fl * (1.0 - uDrain * 0.8);
    }
  }

  // ---------- glass overlay: highlights, per-shard tint, blood in the cracks ----------
  if (uCrack > 0.0) {
    col *= g.tint;
    vec3 lineCol = mix(vec3(0.85, 0.88, 0.92), vec3(1.0, 0.92, 0.9), uRed);
    col = mix(col, lineCol, g.line * 0.75);
    col += g.wide * 0.05;
    if (uBleed > 0.0) {
      vec2 bp = s * vec2(aspect, 1.0);
      float drip = smoothstep(0.55, 0.8, fbm(vec2(bp.x * 40.0, bp.y * 3.0 + uTime * 0.12)));
      float blood = clamp(g.wide * 1.2 + drip * g.wide * 2.0, 0.0, 1.0) * uBleed;
      col = mix(col, vec3(0.42, 0.0, 0.03), blood);
    }
  }

  // ---------- the bridge: red body ----------
  if (uRed > 0.0) {
    float L = luma(col);
    float Lc = pow(L, 1.15);
    vec3 red = vec3(Lc * 1.35, Lc * 0.13, Lc * 0.2) + vec3(0.05, 0.0, 0.01);
    red += vec3(0.25, 0.0, 0.03) * uBeat * uPulse * smoothstep(0.1, 0.7, L);
    col = mix(col, red, uRed);
  }
  col += vec3(1.0, 0.85, 0.85) * uFlash * 0.55;

  // ---------- drain, tunnel, fade ----------
  col = mix(col, vec3(luma(col)) * 0.6, uDrain * 0.85);
  float vd = length((s - 0.5) * vec2(aspect, 1.0)) / (0.5 * sqrt(aspect * aspect + 1.0));
  float tunnel = 1.0 - smoothstep(0.35 - uTunnel * 0.3, 1.05 - uTunnel * 0.75, vd);
  col *= mix(1.0, tunnel, clamp(uTunnel, 0.0, 1.0));
  col *= 1.0 - uFade;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
