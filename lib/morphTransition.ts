import type { Fragrance } from '../types/fragrance';

export const COLLECTION_DETAIL_MORPH_DURATION_MS = 480;
export const COLLECTION_DETAIL_SETTLE_FADE_MS = 140;
export const COLLECTION_DETAIL_EASING = [0.2, 0.7, 0.2, 1] as const;

export type MorphRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MorphPhase = 'idle' | 'opening' | 'open' | 'closing';

// Which collection layout the origin rect was measured from. The overlay's
// crossfade copy mirrors that layout so the fade matches what's underneath.
export type MorphOriginKind = 'row' | 'grid';

// Destination rects measured from the mounted detail screen, converted to
// overlay-local coordinates (the same space measureRowRect uses for the
// origin).
export type MorphTargets = {
  card: MorphRect;
  heading: MorphRect;
  hero: MorphRect;
};

// measureInWindow coordinates are not guaranteed to share an origin with the
// overlay host's own coordinate space — on Android with edge-to-edge enabled
// they can be offset by the status bar height. The host measures its own
// window position and every morph measurement subtracts it, so all rects in
// the store are overlay-local by construction.
let hostWindowOrigin = { x: 0, y: 0 };

export function setMorphHostWindowOrigin(x: number, y: number) {
  hostWindowOrigin = { x, y };
}

// Convert a measureInWindow result into overlay-local coordinates.
export function toMorphLocalRect(
  x: number,
  y: number,
  width: number,
  height: number,
): MorphRect {
  return {
    x: x - hostWindowOrigin.x,
    y: y - hostWindowOrigin.y,
    width,
    height,
  };
}

export type MorphState = {
  phase: MorphPhase;
  fragrance: Fragrance | null;
  origin: MorphRect | null;
  originKind: MorphOriginKind;
  targets: MorphTargets | null;
};

const IDLE_STATE: MorphState = {
  phase: 'idle',
  fragrance: null,
  origin: null,
  originKind: 'row',
  targets: null,
};

let state: MorphState = IDLE_STATE;
const listeners = new Set<(next: MorphState) => void>();

function setState(next: MorphState) {
  state = next;
  listeners.forEach((listener) => listener(state));
}

export function getMorphState(): MorphState {
  return state;
}

export function subscribeToMorph(listener: (next: MorphState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openMorph(
  fragrance: Fragrance,
  origin: MorphRect,
  originKind: MorphOriginKind = 'row',
) {
  setState({ phase: 'opening', fragrance, origin, originKind, targets: null });
}

export function setMorphTargets(targets: MorphTargets) {
  if (state.phase === 'idle') {
    return;
  }
  setState({ ...state, targets });
}

export function markMorphOpen() {
  if (state.phase === 'opening') {
    setState({ ...state, phase: 'open' });
  }
}

export function closeMorph() {
  if (state.phase === 'open' || state.phase === 'opening') {
    setState({ ...state, phase: 'closing' });
  }
}

export function finishMorph() {
  if (state.phase === 'closing') {
    setState(IDLE_STATE);
  }
}

export function releaseMorph() {
  if (state.phase === 'open' || state.phase === 'opening') {
    setState(IDLE_STATE);
  }
}
