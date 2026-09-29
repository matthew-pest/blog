// Contour Field: a topographic map of the agent's attention. The height
// field is 3D simplex noise with time on the third axis, so the terrain
// itself evolves — ridges merge and split instead of sliding past. Focus
// tightens the bands, energy lifts them, a search sweeps a lit ring across,
// and the lines near the pointer rise to meet it.

import { simplex3d } from "@vgpu/wgsl-std/noise/simplex";
import { Params, ink, accent, centred, grain, rippleRing, vignette } from "./field-common.wgsl";

@group(0) @binding(0) var<uniform> params: Params;

// Three octaves, each on its own slow clock, plus a barely-there drift.
fn height(p: vec2f, t: f32, scale: f32) -> f32 {
  let q = p * scale + vec2f(t * 0.012, -t * 0.008);
  var h = 0.62 * simplex3d(vec3f(q, t * 0.045));
  h += 0.28 * simplex3d(vec3f(q * 2.1 + vec2f(5.2, 1.3), t * 0.07 + 3.0));
  h += 0.10 * simplex3d(vec3f(q * 4.3 + vec2f(1.7, 9.2), t * 0.11 + 7.0));
  return h * 0.5 + 0.5;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = centred(uv, params.aspect);
  let t = params.time;

  let scale = 1.4 + params.focus * 1.4;
  let h = height(p, t, scale);

  // Iso-lines with a soft halo so neighbouring bands blend rather than cut.
  let levels = 8.0;
  let g = h * levels;
  let f = fract(g);
  let dist = min(f, 1.0 - f);
  let aa = fwidth(g) * 1.4 + 0.004;
  let core = 1.0 - smoothstep(0.0, aa, dist);
  let halo = (1.0 - smoothstep(0.0, aa * 4.0, dist)) * 0.35;
  let line = core + halo;

  // Every third contour is a major line, as on a real map.
  let idx = i32(floor(g));
  let major = select(0.0, 1.0, idx % 3 == 0);

  var alpha = 0.06 + params.energy * 0.11 + major * 0.04;

  let ptr = centred(params.pointer, params.aspect);
  let dq = p - ptr;
  alpha += exp(-dot(dq, dq) * 6.0) * params.pointerStrength * 0.22;

  let ring = rippleRing(p, params.rippleOrigin, params.aspect, params.ripple);

  var col = ink();
  // A faint tonal wash of the terrain itself, so the lines sit on ground.
  col += vec3f(0.9, 0.9, 1.0) * (h - 0.5) * 0.035;
  col += vec3f(1.0) * line * alpha;
  col += accent(params.hue) * line * ring * 0.8;
  // Peaks warm up faintly while the agent concentrates.
  col += accent(params.hue) * smoothstep(0.62, 0.95, h) * params.focus * 0.10;
  col *= mix(0.75, 1.0, vignette(p));
  col += vec3f(grain(uv, params.aspect, 0.014));
  col *= params.intensity;
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
