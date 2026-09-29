// Slate Grain: near-black, one soft accent glow adrift, and a very light,
// very slow particle field sliding across it. Nothing warps, nothing
// flickers. Energy brightens the glow and the particles, focus widens the
// glow, a search flashes it and sends a faint ring outward, and the pointer
// carries a dim complement.

import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { Params, ink, accent, centred, grain, particles, rippleRing, vignette } from "./field-common.wgsl";

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = centred(uv, params.aspect);
  let t = params.time;

  // The glow follows a slow Lissajous path so it never sits still or repeats.
  let drift = vec2f(sin(t * 0.05), cos(t * 0.043)) * vec2f(0.16 * params.aspect, 0.14);
  let c = vec2f(0.0, -0.05) + drift;
  let radius = 0.55 + params.focus * 0.12;
  let d = length(p - c) / radius;
  let glow = exp(-d * d * 2.2);

  // A search flashes the glow briefly, then the ring carries the rest.
  let flash = select(0.0, exp(-params.ripple * 1.5), params.ripple >= 0.0);
  let strength = 0.10 + params.energy * 0.22 + flash * 0.10;

  // Very-low-frequency breathing so the black is never flat.
  let breath = fbmSimplex2d(p * 1.2 + vec2f(t * 0.02, -t * 0.015), 2, 2.0, 0.5) * 0.012;

  let ptr = centred(params.pointer, params.aspect);
  let dp = length(p - ptr);
  let pointerGlow = exp(-dp * dp * 9.0) * params.pointerStrength * 0.06;

  var col = ink() + vec3f(breath);
  col += accent(params.hue) * glow * strength;
  col += accent(params.hue + 0.5) * pointerGlow;
  col += vec3f(0.6, 0.8, 1.0) * rippleRing(p, params.rippleOrigin, params.aspect, params.ripple) * 0.10;

  // Particles: dim white, faintly tinted by the accent, a touch livelier with energy.
  let dots = particles(uv, params.aspect, t) * (0.16 + params.energy * 0.14);
  col += mix(vec3f(0.85, 0.85, 0.92), accent(params.hue), 0.35) * dots;

  col *= mix(0.72, 1.0, vignette(p));
  col += vec3f(grain(uv, params.aspect, 0.018));
  col *= params.intensity;
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
