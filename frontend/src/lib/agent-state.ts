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

  setMood: (mood: Mood) => void;
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

export const useAgentStore = create<AgentState>((set) => ({
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

  setMood: (mood) => set({ mood }),
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
