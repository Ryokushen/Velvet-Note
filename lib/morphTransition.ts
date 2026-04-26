export const COLLECTION_DETAIL_MORPH_DURATION_MS = 480;
export const DETAIL_CONTENT_FADE_DELAY_MS = 120;
export const COLLECTION_DETAIL_EASING = [0.2, 0.7, 0.2, 1] as const;

export type MorphRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

let pendingMorphOrigin: MorphRect | null = null;

export function setMorphOrigin(rect: MorphRect | null) {
  pendingMorphOrigin = rect;
}

export function getMorphOrigin(): MorphRect | null {
  return pendingMorphOrigin;
}
