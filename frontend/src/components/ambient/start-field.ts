import { clock, effect, frameLoop, init, surface } from 'vgpu';
import type { Effect, FrameLoopHandle } from 'vgpu';
import type { FieldVariant } from '@/lib/agent-state';
import grainShader from './grain.wgsl';
import contourShader from './contour.wgsl';

export interface FieldTargets {
  variant: FieldVariant;
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
  /** Render single frames on demand instead of looping (prefers-reduced-motion). */
  still?: boolean;
  /** Clamp device pixel ratio to save fill-rate on 4K/mobile. */
  dpr?: readonly [number, number];
  onReady?: () => void;
}

export interface FieldHandle {
  dispose: () => void;
  /** Still mode only: draw one frame with the current targets. */
  refresh: () => void;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Starts the ambient field on `canvas`.
 *
 * Both shader variants are compiled up front against the surface so switching
 * is a crossfade, not a stall. The frame loop writes only what changes, and
 * only to the variant being drawn.
 */
export function startField(canvas: HTMLCanvasElement, opts: FieldOptions): FieldHandle {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
  let unsubscribeResize: (() => void) | undefined;
  let onVisibility: (() => void) | undefined;
  let refreshStill: (() => void) | undefined;

  void (async () => {
    gpu = await init();
    if (disposed) return gpu.dispose();

    const canvasSurface = surface(gpu, canvas, { dpr: opts.dpr ?? [1, 1.5] });
    const aspect = () => canvasSurface.size[0] / Math.max(1, canvasSurface.size[1]);

    const initial = opts.getTargets();
    const params = {
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
    };
    const effects: Record<FieldVariant, Effect> = {
      grain: effect(gpu, grainShader, { label: 'field-grain', set: { params } }),
      contour: effect(gpu, contourShader, { label: 'field-contour', set: { params } }),
    };
    // Pre-warm both pipelines so the first switch has no hitch. A surface can
    // only be a target inside a frame, so compile against its signature.
    const signature = { colors: [navigator.gpu.getPreferredCanvasFormat()] };
    await Promise.all(Object.values(effects).map((fx) => fx.compile(signature)));
    if (disposed) return gpu.dispose();

    unsubscribeResize = canvasSurface.onResize(() => {
      const a = aspect();
      for (const fx of Object.values(effects)) fx.set({ params: { aspect: a } });
    });

    // Current (smoothed) values — the shader never jumps, it glides.
    const cur = {
      variant: initial.variant,
      swap: 1, // 1 = fully shown; dips to 0 across a variant change
      energy: initial.energy,
      focus: initial.focus,
      hue: initial.hue,
      px: initial.pointer[0],
      py: initial.pointer[1],
      strength: 0,
      intensity: initial.intensity,
    };

    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __field?: unknown }).__field = cur;
    }

    const write = (time: number, target: FieldTargets) => {
      const fx = effects[cur.variant];
      fx.set({
        params: {
          time,
          energy: cur.energy,
          focus: cur.focus,
          hue: cur.hue,
          pointer: [cur.px, cur.py],
          pointerStrength: cur.strength,
          ripple: target.ripple,
          rippleOrigin: target.rippleOrigin,
          intensity: cur.intensity * cur.swap,
        },
      });
      return fx;
    };

    if (opts.still) {
      refreshStill = () => {
        if (disposed) return;
        const target = opts.getTargets();
        cur.variant = target.variant;
        cur.energy = target.energy;
        cur.focus = target.focus;
        cur.hue = target.hue;
        cur.intensity = target.intensity;
        write(0, target).draw(canvasSurface);
      };
      refreshStill();
      opts.onReady?.();
      return;
    }

    const time = clock(gpu);
    const start = () => {
      if (loop || disposed || !gpu) return;
      loop = frameLoop(gpu, (frame) => {
        const target = opts.getTargets();
        // Clamp generously: a throttled tab (1 fps when occluded) must still
        // converge in a few frames rather than crawl toward its targets.
        const dt = Math.min(time.deltaTime, 0.5);
        // Time-constant smoothing: ~0.6s for mood, ~0.15s for the pointer, ~0.18s for a swap.
        const kMood = 1 - Math.exp(-dt / 0.6);
        const kPtr = 1 - Math.exp(-dt / 0.15);
        const kSwap = 1 - Math.exp(-dt / 0.18);

        if (target.variant !== cur.variant) {
          cur.swap = lerp(cur.swap, 0, kSwap);
          if (cur.swap < 0.04) cur.variant = target.variant;
        } else {
          cur.swap = lerp(cur.swap, 1, kSwap);
        }

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

        frame.pass(canvasSurface, write(time.time, target));
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

  return {
    refresh: () => refreshStill?.(),
    dispose: () => {
      disposed = true;
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      unsubscribeResize?.();
      loop?.stop();
      gpu?.dispose();
    },
  };
}
