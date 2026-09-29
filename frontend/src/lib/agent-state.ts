import { create } from 'zustand';

/**
 * Shared state between the agent (chat) and the site itself.
 *
 * The WebGPU ambient field reads this every frame; the dock writes it as the
 * conversation moves through phases; pages write their own context into it so
 * the agent knows where the visitor is. One store, three consumers.
 */

export type Mood =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'streaming'
  | 'searching'
  | 'reading'
  | 'acting'
  | 'error';

/** Hue on the field's palette wheel (0..1) per blog category. */
export const CATEGORY_HUE: Record<string, number> = {
  ai: 0.62,
  physics: 0.1,
  tech: 0.42,
  audiophile: 0.86,
  resume: 0.3,
  default: 0.55,
};

/** The two ambient-field shaders a visitor can choose between. */
export type FieldVariant = 'grain' | 'contour';
export const FIELD_VARIANTS: readonly FieldVariant[] = ['grain', 'contour'];
export const FIELD_LABELS: Record<FieldVariant, string> = { grain: 'Slate Grain', contour: 'Contour Field' };
const FIELD_STORAGE_KEY = 'mp.field';

export function isFieldVariant(v: unknown): v is FieldVariant {
  return typeof v === 'string' && (FIELD_VARIANTS as readonly string[]).includes(v);
}

/** The visitor's remembered choice, or null. Safe to call during SSR. */
export function readStoredFieldVariant(): FieldVariant | null {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(FIELD_STORAGE_KEY) : null;
    return isFieldVariant(v) ? v : null;
  } catch {
    return null;
  }
}

export interface PageContext {
  path: string;
  title: string;
  kind: 'home' | 'blog-index' | 'post' | 'resume' | 'page' | 'other';
  postSlug?: string;
  postTitle?: string;
  category?: string;
  selection?: string;
}

export interface AgentState {
  mood: Mood;
  hue: number;
  pointer: [number, number];
  pointerActive: boolean;
  /** performance.now() when the last ripple was triggered, or null. */
  rippleAt: number | null;
  rippleOrigin: [number, number];
  page: PageContext;
  /** Text the agent asked the page to highlight (null clears). */
  highlight: string | null;
  dockOpen: boolean;
  deep: boolean;
  /** Draft text handed to the dock (e.g. from a "try it" button). */
  draft: string | null;
  /** Which ambient shader is drawn behind the page. Persisted per visitor. */
  fieldVariant: FieldVariant;

  setMood: (mood: Mood) => void;
  setFieldVariant: (variant: FieldVariant) => void;
  cycleFieldVariant: () => void;
  setHue: (hue: number) => void;
  setPointer: (x: number, y: number, active?: boolean) => void;
  ripple: (origin?: [number, number]) => void;
  setPage: (page: Partial<PageContext>) => void;
  setHighlight: (text: string | null) => void;
  setDockOpen: (open: boolean) => void;
  toggleDock: () => void;
  setDeep: (deep: boolean) => void;
  setDraft: (draft: string | null) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  mood: 'idle',
  hue: CATEGORY_HUE.default,
  pointer: [0.5, 0.5],
  pointerActive: false,
  rippleAt: null,
  rippleOrigin: [0.5, 0.5],
  page: { path: '/', title: '', kind: 'other' },
  highlight: null,
  dockOpen: false,
  deep: false,
  draft: null,
  // Server and first client render agree on the default; AmbientField applies
  // the stored choice after mount so hydration never mismatches.
  fieldVariant: 'grain',

  setMood: (mood) => set({ mood }),
  setFieldVariant: (fieldVariant) => {
    try {
      window.localStorage.setItem(FIELD_STORAGE_KEY, fieldVariant);
    } catch {}
    set({ fieldVariant });
  },
  cycleFieldVariant: () => {
    const s = get();
    const next = FIELD_VARIANTS[(FIELD_VARIANTS.indexOf(s.fieldVariant) + 1) % FIELD_VARIANTS.length];
    s.setFieldVariant(next);
  },
  setHue: (hue) => set({ hue }),
  setPointer: (x, y, active = true) => set({ pointer: [x, y], pointerActive: active }),
  ripple: (origin) =>
    set((s) => ({ rippleAt: performance.now(), rippleOrigin: origin ?? s.pointer })),
  setPage: (page) => set((s) => ({ page: { ...s.page, ...page } })),
  setHighlight: (highlight) => set({ highlight }),
  setDockOpen: (dockOpen) => set({ dockOpen }),
  toggleDock: () => set((s) => ({ dockOpen: !s.dockOpen })),
  setDeep: (deep) => set({ deep }),
  setDraft: (draft) => set({ draft }),
}));

/** Field targets derived from mood — what the shader lerps toward. */
export function moodTargets(mood: Mood): { energy: number; focus: number } {
  switch (mood) {
    case 'listening':
      return { energy: 0.3, focus: 0.25 };
    case 'thinking':
      return { energy: 0.45, focus: 0.9 };
    case 'streaming':
      return { energy: 0.85, focus: 0.35 };
    case 'searching':
      return { energy: 0.7, focus: 0.2 };
    case 'reading':
      return { energy: 0.5, focus: 0.6 };
    case 'acting':
      return { energy: 0.8, focus: 0.5 };
    case 'error':
      return { energy: 0.2, focus: 0.0 };
    default:
      return { energy: 0.14, focus: 0.08 };
  }
}
