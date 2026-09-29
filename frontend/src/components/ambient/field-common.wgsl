// Shared vocabulary for the ambient field variants. Pure module: no bindings
// here — each entry shader declares its own `params` uniform of this shape.

import { hash2 } from "@vgpu/wgsl-std/hash";

export struct Params {
  time: f32,
  energy: f32,
  focus: f32,
  hue: f32,
  pointer: vec2f,
  pointerStrength: f32,
  aspect: f32,
  ripple: f32,
  intensity: f32,
  rippleOrigin: vec2f,
}

// The page's own ground: oklch(0.13 0.012 285) in sRGB.
export fn ink() -> vec3f {
  return vec3f(0.047, 0.045, 0.062);
}

fn hsv(h: f32, s: f32, v: f32) -> vec3f {
  let p = abs(fract(vec3f(h, h, h) + vec3f(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return v * mix(vec3f(1.0), clamp(p - 1.0, vec3f(0.0), vec3f(1.0)), s);
}

// One accent per position on the hue wheel, deliberately desaturated.
// hue 0.55 (the site default) lands on the brand violet.
export fn accent(hue: f32) -> vec3f {
  return hsv(fract(hue + 0.2), 0.42, 0.95);
}

// Centred, aspect-corrected coordinates: y spans [-0.5, 0.5].
export fn centred(uv: vec2f, aspect: f32) -> vec2f {
  return (uv - 0.5) * vec2f(aspect, 1.0);
}

// Static film grain for texture. No time term: it must not flicker.
export fn grain(uv: vec2f, aspect: f32, amount: f32) -> f32 {
  let cell = floor(uv * vec2f(aspect, 1.0) * 900.0);
  return (hash2(cell).x - 0.5) * amount;
}

// One layer of dense, fine grain that crawls across the screen: about half
// the cells are lit at random low brightness, and the whole sheet slides
// at `drift` cells per second. Not a starfield — a mist.
fn mistLayer(q: vec2f, t: f32, cells: f32, drift: vec2f) -> f32 {
  let p = q * cells + drift * t;
  let h = hash2(floor(p));
  let lit = step(0.5, h.x);
  // Soften each speck so the sheet reads as haze rather than pixels.
  let d = length(fract(p) - 0.5);
  let speck = smoothstep(0.7, 0.2, d);
  return lit * h.y * speck;
}

// A very light, very slow particle field: two parallax sheets of fine mist.
export fn mist(uv: vec2f, aspect: f32, t: f32) -> f32 {
  let q = uv * vec2f(aspect, 1.0);
  let far = mistLayer(q, t, 560.0, vec2f(2.4, -1.6));
  let near = mistLayer(q + 0.29, t, 330.0, vec2f(4.2, -2.6));
  return far * 0.6 + near * 0.5;
}

// A soft ring expanding from `origin` after a web search. t < 0 means none.
export fn rippleRing(p: vec2f, origin: vec2f, aspect: f32, t: f32) -> f32 {
  if (t < 0.0) {
    return 0.0;
  }
  let o = (origin - 0.5) * vec2f(aspect, 1.0);
  let d = length(p - o);
  let radius = t * 0.75;
  let ring = exp(-pow((d - radius) * 14.0, 2.0));
  return ring * exp(-t * 1.2);
}

export fn vignette(p: vec2f) -> f32 {
  return smoothstep(1.45, 0.35, length(p));
}
