import { clock, effect, frameLoop, init, surface } from 'vgpu';
import type { FrameLoopHandle } from 'vgpu';
import fieldShader from './field.wgsl';

export interface FieldTargets {
  energy: number;
  focus: number;
  hue: number;
  pointer: [number, number];
  pointerActive: boolean;
  /** Seconds since the ripple began, or -1 for none. */
  ripple: number;
  rippleOrigin: [number, number];
  intensity: number;
}

export interface FieldOptions {
  /** Called every frame; return what the field should move toward. */
  getTargets: () => FieldTargets;
  /** Render a single frame and stop (prefers-reduced-motion). */
  still?: boolean;
  /** Clamp device pixel ratio to save fill-rate on 4K/mobile. */
  dpr?: readonly [number, number];
  onReady?: () => void;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Starts the ambient field on `canvas`. Returns a teardown function.
 *
 * Everything vgpu lives here, outside React: one Gpu, one surface, one effect.
 * The frame loop only writes the uniforms that actually change.
 */
export function startField(canvas: HTMLCanvasElement, opts: FieldOptions): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
  let unsubscribeResize: (() => void) | undefined;
  let onVisibility: (() => void) | undefined;

  void (async () => {
    gpu = await init();
    if (disposed) return gpu.dispose();

    const canvasSurface = surface(gpu, canvas, { dpr: opts.dpr ?? [1, 1.5] });
    const aspect = () => canvasSurface.size[0] / Math.max(1, canvasSurface.size[1]);

    const initial = opts.getTargets();
    const field = effect(gpu, fieldShader, {
      label: 'ambient-field',
      set: {
        params: {
          time: 0,
          energy: initial.energy,
          focus: initial.focus,
          hue: initial.hue,
          pointer: initial.pointer,
          pointerStrength: 0,
          aspect: aspect(),
          ripple: -1,
          intensity: initial.intensity,
          rippleOrigin: initial.rippleOrigin,
        },
      },
    });

    unsubscribeResize = canvasSurface.onResize(() => {
      field.set({ params: { aspect: aspect() } });
    });

    // Current (smoothed) values — the shader never jumps, it glides.
    const cur = {
      energy: initial.energy,
      focus: initial.focus,
      hue: initial.hue,
      px: initial.pointer[0],
      py: initial.pointer[1],
      strength: 0,
      intensity: initial.intensity,
    };

    if (opts.still) {
      field.draw(canvasSurface);
      opts.onReady?.();
      return;
    }

    const time = clock(gpu);
    const start = () => {
      if (loop || disposed || !gpu) return;
      loop = frameLoop(gpu, (frame) => {
        const target = opts.getTargets();
        const dt = Math.min(time.deltaTime, 0.1);
        // Time-constant smoothing: ~0.6s for mood, ~0.15s for the pointer.
        const kMood = 1 - Math.exp(-dt / 0.6);
        const kPtr = 1 - Math.exp(-dt / 0.15);
        cur.energy = lerp(cur.energy, target.energy, kMood);
        cur.focus = lerp(cur.focus, target.focus, kMood);
        cur.intensity = lerp(cur.intensity, target.intensity, kMood);
        // Hue wraps: take the short way around the wheel.
        let dh = target.hue - cur.hue;
        dh -= Math.round(dh);
        cur.hue = lerp(cur.hue, cur.hue + dh, kMood * 0.6);
        cur.px = lerp(cur.px, target.pointer[0], kPtr);
        cur.py = lerp(cur.py, target.pointer[1], kPtr);
        cur.strength = lerp(cur.strength, target.pointerActive ? 1 : 0, kPtr);

        field.set({
          params: {
            time: time.time,
            energy: cur.energy,
            focus: cur.focus,
            hue: cur.hue,
            pointer: [cur.px, cur.py],
            pointerStrength: cur.strength,
            ripple: target.ripple,
            rippleOrigin: target.rippleOrigin,
            intensity: cur.intensity,
          },
        });
        frame.pass(canvasSurface, field);
      });
    };
    const stop = () => {
      loop?.stop();
      loop = undefined;
    };

    // Don't burn GPU while the tab is hidden.
    onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVisibility);

    start();
    opts.onReady?.();
  })().catch((error) => {
    console.warn('[ambient-field] WebGPU unavailable, using fallback', error);
    opts.onReady?.();
  });

  return () => {
    disposed = true;
    if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
    unsubscribeResize?.();
    loop?.stop();
    gpu?.dispose();
  };
}
