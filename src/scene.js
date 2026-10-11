import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, NoiseEffect, VignetteEffect,
  ChromaticAberrationEffect, GlitchEffect, GlitchMode, BlendFunction,
} from 'postprocessing';
import { worldVertex, worldFragment, MAX_RIPPLES } from './shaders/world.js';
import { embersVertex, embersFragment } from './shaders/embers.js';
import ridgeData from './ridge.json';

const IMG_ASPECT = 1.5;

// shader uniform name for each choreography value
const UNIFORM_OF = {
  fade: 'uFade', cloud: 'uCloud', burn: 'uBurn', wildfire: 'uWildfire', smoke: 'uSmoke', ghost: 'uGhost',
  mirror: 'uMirror', ripple: 'uRipple', tide: 'uTide', sketch: 'uSketch', erase: 'uErase', sand: 'uSand',
  ink: 'uInk', crack: 'uCrack', glassAlpha: 'uGlassAlpha', bloodFilm: 'uBloodFilm', shatter: 'uShatter', frost: 'uFrost', bleed: 'uBleed', red: 'uRed',
  pulse: 'uPulse', tunnel: 'uTunnel', flash: 'uFlash', flame: 'uFlame', heat: 'uHeat', drain: 'uDrain',
};

function makeRidgeTexture() {
  const src = ridgeData.ridge;
  const data = new Uint16Array(src.length);
  for (let i = 0; i < src.length; i++) data[i] = THREE.DataUtils.toHalfFloat(src[i]);
  const tex = new THREE.DataTexture(data, src.length, 1, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export class World {
  constructor(canvas, { lowPower, reducedMotion }) {
    this.lowPower = lowPower;
    this.reducedMotion = reducedMotion;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, stencil: false, depth: false, powerPreference: 'high-performance',
      preserveDrawingBuffer: import.meta.env.DEV,
    });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // work directly in display space
    this.dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.ridgeTex = makeRidgeTexture();

    const ripples = [];
    for (let i = 0; i < MAX_RIPPLES; i++) ripples.push(new THREE.Vector4(0, 0, -99, 0));
    this.ripples = ripples;
    this.rippleIndex = 0;

    const u = {
      uImage: { value: null }, uRidge: { value: this.ridgeTex },
      uRes: { value: new THREE.Vector2(1, 1) }, uImgAspect: { value: IMG_ASPECT },
      uTime: { value: 0 }, uZoom: { value: 1 }, uFocus: { value: new THREE.Vector2(0.5, 0.5) },
      uShake: { value: new THREE.Vector2() }, uAudio: { value: 0 }, uBeat: { value: 0 },
      uImpact: { value: new THREE.Vector2(0.64, 0.6) }, uRipples: { value: ripples },
    };
    for (const k in UNIFORM_OF) u[UNIFORM_OF[k]] = { value: 0 };
    this.uniforms = u;

    this.world = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: worldVertex, fragmentShader: worldFragment, uniforms: u,
        defines: { OCT: lowPower ? 4 : 5 }, depthTest: false, depthWrite: false,
      }),
    );
    this.world.frustumCulled = false;
    this.scene.add(this.world);

    this.embers = this.makeEmbers(lowPower ? 380 : 900);
    this.scene.add(this.embers);

    this.setupPost();
  }

  makeEmbers(count) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i++) seeds[i] = Math.random();
    geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
    const u = this.uniforms;
    this.emberUniforms = {
      uTime: u.uTime, uRes: u.uRes, uImgAspect: u.uImgAspect, uZoom: u.uZoom, uFocus: u.uFocus,
      uShake: u.uShake, uRidge: u.uRidge, uRed: u.uRed,
      uEmbers: { value: 0 }, uNear: { value: 0 }, uDpr: { value: this.dpr },
    };
    const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
      vertexShader: embersVertex, fragmentShader: embersFragment, uniforms: this.emberUniforms,
      transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    }));
    pts.frustumCulled = false;
    return pts;
  }

  setupPost() {
    const composer = new EffectComposer(this.renderer, { frameBufferType: THREE.HalfFloatType });
    composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new BloomEffect({
      luminanceThreshold: 0.62, luminanceSmoothing: 0.3, intensity: 0.85, mipmapBlur: true, radius: 0.72,
      resolutionScale: this.lowPower ? 0.5 : 1,
    });
    this.noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
    this.noise.blendMode.opacity.value = 0.22;
    this.vignette = new VignetteEffect({ offset: 0.28, darkness: 0.62 });
    composer.addPass(new EffectPass(this.camera, this.bloom, this.vignette, this.noise));

    this.ca = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0006, 0.0003), radialModulation: true, modulationOffset: 0.25,
    });
    composer.addPass(new EffectPass(this.camera, this.ca));

    this.glitch = new GlitchEffect({
      delay: new THREE.Vector2(0.6, 1.8), duration: new THREE.Vector2(0.08, 0.28),
      strength: new THREE.Vector2(0.05, 0.22), ratio: 0.9, columns: 0.04,
    });
    this.glitch.mode = GlitchMode.DISABLED;
    if (!this.reducedMotion) composer.addPass(new EffectPass(this.camera, this.glitch));

    this.composer = composer;
  }

  setImage(texture) {
    texture.colorSpace = THREE.NoColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    this.uniforms.uImage.value = texture;
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h, false);
    this.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
  }

  // Convert a pointer position (CSS px) to image uv, mirroring the shader's toImage().
  screenToImage(x, y, w, h, v) {
    const a = w / h;
    let sx = 1, sy = 1;
    if (a > IMG_ASPECT) sy = IMG_ASPECT / a; else sx = a / IMG_ASPECT;
    sx /= v.zoom; sy /= v.zoom;
    const fx = Math.min(Math.max(v.focusX, sx / 2), 1 - sx / 2);
    const fy = Math.min(Math.max(v.focusY, sy / 2), 1 - sy / 2);
    return [(x / w - 0.5) * sx + fx, (1 - y / h - 0.5) * sy + fy];
  }

  // Screen uv (y up) <-> image uv for a screen of aspect a, mirroring the shader's toImage().
  static view(a, v) {
    let sx = 1, sy = 1;
    if (a > IMG_ASPECT) sy = IMG_ASPECT / a; else sx = a / IMG_ASPECT;
    const z = Math.max(0.8, v.zoom);
    sx /= z; sy /= z;
    const fx = Math.min(Math.max(v.focusX, sx / 2), 1 - sx / 2);
    const fy = Math.min(Math.max(v.focusY, sy / 2), 1 - sy / 2);
    return { sx, sy, fx, fy };
  }

  static toImage(x, y, a, v) {
    const { sx, sy, fx, fy } = World.view(a, v);
    return [(x - 0.5) * sx + fx, (y - 0.5) * sy + fy];
  }

  static toScreen(ix, iy, a, v) {
    const { sx, sy, fx, fy } = World.view(a, v);
    return [(ix - fx) / sx + 0.5, (iy - fy) / sy + 0.5];
  }

  get aspect() { return this.uniforms.uRes.value.x / this.uniforms.uRes.value.y; }

  addRipple(ix, iy, strength = 1) {
    if (iy > 0.228) return false; // only the lake ripples
    const r = this.ripples[this.rippleIndex];
    r.set(ix, iy, this.uniforms.uTime.value, strength);
    this.rippleIndex = (this.rippleIndex + 1) % MAX_RIPPLES;
    return true;
  }

  render(v, { time, audio, beat }) {
    const u = this.uniforms;
    u.uTime.value = time;
    for (const k in UNIFORM_OF) u[UNIFORM_OF[k]].value = v[k];
    u.uZoom.value = Math.max(0.8, v.zoom);
    u.uFocus.value.set(v.focusX, v.focusY);
    u.uImpact.value.set(v.impactX, v.impactY);
    u.uAudio.value = audio;
    u.uBeat.value = beat;

    const motion = this.reducedMotion ? 0.2 : 1;
    const sh = v.shake * beat * 0.006 * motion;
    // the panic: a constant, uneven tremor (a few incommensurate sines, so it never loops visibly)
    const tr = v.tremor * 0.0065 * motion;
    const tx = Math.sin(time * 23.1) + Math.sin(time * 37.7 + 1.3) * 0.6 + Math.sin(time * 61.3 + 2.1) * 0.4;
    const ty = Math.cos(time * 19.7) + Math.cos(time * 41.9 + 0.7) * 0.6 + Math.sin(time * 53.1 + 0.4) * 0.4;
    u.uShake.value.set(Math.sin(time * 91.0) * sh + tx * tr * 0.5, Math.cos(time * 77.0) * sh + ty * tr * 0.5);

    this.emberUniforms.uEmbers.value = v.embers + v.wildfire * 0.3;
    this.emberUniforms.uNear.value = v.embersNear;

    // the body under attack: chromatic split rides the heartbeat
    const caAmt = 0.0006 + v.pulse * (0.0015 + beat * 0.006) * motion + v.shatter * 0.0012 + v.ghost * 0.0015 + v.split * 0.014 * motion;
    this.ca.offset.set(caAmt, caAmt * 0.5);
    this.bloom.intensity = 0.85 + v.burn * 0.5 + v.wildfire * 0.6 + v.flame * 0.5 + v.red * 0.4;
    this.vignette.darkness = 0.62 + v.tunnel * 0.3;
    this.glitch.mode = v.red > 0.6 && v.pulse > 0.5 ? GlitchMode.SPORADIC : GlitchMode.DISABLED;

    this.composer.render();
  }
}
