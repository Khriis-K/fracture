// Embers. Most rise off the burning ridge (placed in image space so they
// stay glued to the hills as the camera moves). A few "near" embers drift up
// from the bottom of the screen, close to the lens, for "scorching my hands".

export const embersVertex = /* glsl */ `
precision highp float;
attribute vec4 seed;
uniform float uTime;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uZoom;
uniform vec2 uFocus;
uniform vec2 uShake;
uniform sampler2D uRidge;
uniform float uEmbers;
uniform float uNear;
uniform float uDpr;
varying float vAlpha;
varying float vHeat;

vec2 coverScale() {
  float a = uRes.x / uRes.y;
  return a > uImgAspect ? vec2(1.0, uImgAspect / a) : vec2(a / uImgAspect, 1.0);
}
vec2 fromImage(vec2 img) {
  vec2 sc = coverScale() / uZoom;
  vec2 f = clamp(uFocus, sc * 0.5, 1.0 - sc * 0.5);
  return (img - f) / sc + 0.5;
}

void main() {
  // uNear above 1 brings more of the embers up close, as well as brighter ("Scorching my hands")
  bool near = seed.w > 1.0 - 0.16 * max(uNear, 1.0);
  float speed = near ? 0.16 + seed.y * 0.18 : 0.045 + seed.y * 0.07;
  float life = fract(uTime * speed + seed.z);
  float sway = sin(uTime * (0.6 + seed.y) + seed.z * 31.0);
  vec2 screen;
  float size;
  float amt;
  if (near) {
    screen = vec2(seed.x + sway * 0.03 + life * (seed.y - 0.4) * 0.25, -0.08 + life * 1.1);
    size = (10.0 + seed.y * 26.0) * (1.0 - life * 0.55);
    amt = min(uNear, 1.4);
  } else {
    float x = seed.x;
    float ridge = texture2D(uRidge, vec2(x, 0.5)).r;
    vec2 img = vec2(x + sway * 0.006 * life + life * (0.03 + (seed.w - 0.4) * 0.05),
                    ridge - 0.004 + life * (0.16 + seed.y * 0.32));
    screen = fromImage(img);
    size = (1.6 + seed.y * 3.4) * (1.0 - life * 0.6);
    amt = uEmbers;
  }
  float flick = 0.65 + 0.35 * sin(uTime * (7.0 + seed.y * 9.0) + seed.z * 50.0);
  vAlpha = sin(life * 3.14159) * amt * flick;
  vHeat = 1.0 - life;
  gl_PointSize = size * uDpr * clamp(uRes.y / (900.0 * uDpr), 0.65, 1.6);
  vec2 ndc = (screen + uShake) * 2.0 - 1.0;
  gl_Position = vAlpha < 0.002 ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(ndc, 0.0, 1.0);
}
`;

export const embersFragment = /* glsl */ `
precision highp float;
uniform float uRed;
varying float vAlpha;
varying float vHeat;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.22, 0.0, d);
  vec3 c = mix(vec3(1.0, 0.3, 0.05), vec3(1.0, 0.82, 0.5), core * vHeat);
  c = mix(c, vec3(1.0, 0.1, 0.15), uRed);
  gl_FragColor = vec4(c * a * vAlpha * 1.6, 1.0);
}
`;
