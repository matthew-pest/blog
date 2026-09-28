// Ambient field: a domain-warped simplex flow that reacts to the agent.
//
// Uniforms come from the shared agent store (see lib/agent-state.ts):
//   energy  – how alive the field is (idle breathing → streaming rush)
//   focus   – pulls the warp inward and blooms the centre (thinking)
//   hue     – palette rotation (blog category / mood colour)
//   pointer – visitor's cursor as an attractor
//   ripple  – seconds since a web search fired; a ring expands outward

import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { hash2 } from "@vgpu/wgsl-std/hash";
import { rotate2d } from "@vgpu/wgsl-std/math";

struct Params {
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
@group(0) @binding(0) var<uniform> params: Params;

// Cosine palette (Inigo Quilez): deep indigo → violet → cyan → warm ember.
fn palette(t: f32) -> vec3f {
  let a = vec3f(0.40, 0.34, 0.56);
  let b = vec3f(0.44, 0.40, 0.48);
  let c = vec3f(1.0, 1.0, 1.0);
  let d = vec3f(0.62, 0.44, 0.22);
  return a + b * cos(6.28318 * (c * t + d));
}

fn fbm(p: vec2f) -> f32 {
  return fbmSimplex2d(p, 4, 2.0, 0.5);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p0 = (uv - 0.5) * vec2f(params.aspect, 1.0);
  let t = params.time * (0.05 + params.energy * 0.11);

  // Pointer attractor: bend the domain toward the cursor.
  let ptr = (params.pointer - 0.5) * vec2f(params.aspect, 1.0);
  let dp = p0 - ptr;
  let pull = params.pointerStrength * exp(-dot(dp, dp) * 5.0);
  var p = p0 - dp * pull * 0.4;

  // Focus tightens the warp scale; slow rotation keeps it from feeling static.
  let scale = mix(1.5, 2.3, params.focus);
  p = rotate2d(p, t * 0.12);

  let q = vec2f(
    fbm(p * scale + vec2f(0.0, t)),
    fbm(p * scale + vec2f(5.2, 1.3) - t * 0.7)
  );
  let r = vec2f(
    fbm(p * scale + 4.0 * q + vec2f(1.7, 9.2) + t * 0.3),
    fbm(p * scale + 4.0 * q + vec2f(8.3, 2.8) - t * 0.2)
  );
  let v = fbmSimplex2d(p * scale + 3.0 * r, 5, 2.0, 0.5);

  var col = palette(v * 0.55 + params.hue + length(q) * 0.18);

  // Energy lifts contrast and lights the warp filaments.
  let glow = smoothstep(0.15, 0.95, length(r)) * (0.22 + params.energy * 0.78);
  col = col * (0.3 + glow);

  // Focus: a soft bloom in the centre, like the field is concentrating.
  let centre = exp(-dot(p0, p0) * 2.2) * params.focus * 0.45;
  col += vec3f(0.55, 0.42, 0.95) * centre;

  // Ripple: a ring that expands from the origin and fades over ~2.5s.
  if (params.ripple >= 0.0) {
    let ro = (params.rippleOrigin - 0.5) * vec2f(params.aspect, 1.0);
    let rd = length(p0 - ro);
    let radius = params.ripple * 0.85;
    let ring = exp(-pow((rd - radius) * 16.0, 2.0)) * exp(-params.ripple * 1.1);
    col += vec3f(0.55, 0.85, 1.0) * ring * 0.9;
  }

  // Pointer glow in the complementary hue.
  col += palette(params.hue + 0.5) * pull * 0.55;

  // Vignette and a touch of film grain so gradients never band.
  let vig = smoothstep(1.35, 0.25, length(p0));
  col *= mix(0.5, 1.0, vig);
  let grain = (hash2(uv * 1024.0 + fract(params.time)).x - 0.5) * 0.03;
  col += grain;

  col *= params.intensity;
  // Tone-map and keep it dark enough for type to sit on top.
  col = col / (1.0 + col);
  return vec4f(col, 1.0);
}
