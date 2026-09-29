// Contour Field: a topographic map of the agent's attention. Iso-lines of a
// slowly drifting height field; focus tightens the bands, energy lifts
// their brightness, a search sweeps a lit ring across them, and the lines
// near the pointer rise to meet it.

import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { rotate2d } from "@vgpu/wgsl-std/math";
import { Params, ink, accent, centred, grain, rippleRing, vignette } from "./field-common.wgsl";

@group(0) @binding(0) var<uniform> params: Params;

fn height(p: vec2f, t: f32, scale: f32) -> f32 {
  let q = rotate2d(p, t * 0.02) * scale;
  let n = fbmSimplex2d(q + vec2f(t * 0.05, -t * 0.03), 3, 2.0, 0.5);
  return n * 0.5 + 0.5;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = centred(uv, params.aspect);
  let t = params.time;

  let scale = 1.5 + params.focus * 1.5;
  let h = height(p, t, scale);

  // Anti-aliased iso-lines: distance to the nearest level, in level units.
  let levels = 9.0;
  let g = h * levels;
  let f = fract(g);
  let dist = min(f, 1.0 - f);
  let aa = fwidth(g) * 1.1 + 0.002;
  let line = 1.0 - smoothstep(0.0, aa, dist);

  // Every third contour is a major line, as on a real map.
  let idx = i32(floor(g));
  let major = select(0.0, 1.0, idx % 3 == 0);

  var alpha = 0.09 + params.energy * 0.14 + major * 0.06;

  let ptr = centred(params.pointer, params.aspect);
  let dq = p - ptr;
  alpha += exp(-dot(dq, dq) * 6.0) * params.pointerStrength * 0.25;

  let ring = rippleRing(p, params.rippleOrigin, params.aspect, params.ripple);

  var col = ink();
  col += vec3f(1.0) * line * alpha;
  col += accent(params.hue) * line * ring * 0.9;
  // Peaks warm up faintly while the agent concentrates.
  col += accent(params.hue) * smoothstep(0.62, 0.95, h) * params.focus * 0.10;
  col *= mix(0.75, 1.0, vignette(p));
  col += vec3f(grain(uv, params.aspect, t, 0.02));
  col *= params.intensity;
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
