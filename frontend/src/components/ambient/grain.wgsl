// Slate Grain: a soft accent glow adrift in a fine, slow-crawling mist.
// Nothing warps, nothing flickers. Energy brightens the glow and lifts the
// mist, focus widens the glow, a search flashes it and sends a faint ring
// outward, and the pointer carries a dim complement.

import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { Params, ink, accent, centred, mist, rippleRing, vignette } from "./field-common.wgsl";

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = centred(uv, params.aspect);
  let t = params.time;

  // The glow follows a slow Lissajous path so it never sits still or repeats.
  let drift = vec2f(sin(t * 0.05), cos(t * 0.043)) * vec2f(0.14 * params.aspect, 0.12);
  let c = vec2f(0.0, -0.02) + drift;
  let radius = 0.72 + params.focus * 0.14;
  let d = length(p - c) / radius;
  let glow = exp(-d * d * 1.8);

  // A search flashes the glow briefly, then the ring carries the rest.
  let flash = select(0.0, exp(-params.ripple * 1.5), params.ripple >= 0.0);
  let strength = 0.12 + params.energy * 0.22 + flash * 0.10;

  // Very-low-frequency breathing so the ground is never flat.
  let breath = fbmSimplex2d(p * 1.2 + vec2f(t * 0.02, -t * 0.015), 2, 2.0, 0.5) * 0.012;

  let ptr = centred(params.pointer, params.aspect);
  let dp = length(p - ptr);
  let pointerGlow = exp(-dp * dp * 9.0) * params.pointerStrength * 0.06;

  let tint = accent(params.hue);
  var col = ink() + vec3f(breath);
  col += tint * glow * strength;
  col += accent(params.hue + 0.5) * pointerGlow;
  col += vec3f(0.6, 0.8, 1.0) * rippleRing(p, params.rippleOrigin, params.aspect, params.ripple) * 0.10;

  // The mist: cool white, faintly tinted, denser-looking where the glow is.
  let haze = mist(uv, params.aspect, t) * (0.07 + params.energy * 0.05) * (0.7 + glow * 0.6);
  col += mix(vec3f(0.82, 0.82, 0.9), tint, 0.3) * haze;

  col *= mix(0.8, 1.0, vignette(p));
  col *= params.intensity;
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
