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

// Film grain quantised to ~24 updates/s so it flickers like film, not static.
export fn grain(uv: vec2f, aspect: f32, time: f32, amount: f32) -> f32 {
  let cell = floor(uv * vec2f(aspect, 1.0) * 720.0);
  let g = hash2(cell + floor(time * 24.0) * 7.31).x;
  return (g - 0.5) * amount;
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
