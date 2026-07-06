import { useEffect, useRef, useState } from 'react';
import { Easing, cancelAnimation, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { CollectionDetailMorph, runCollectionDetailMorph } from './CollectionDetailMorph';
import {
  COLLECTION_DETAIL_EASING,
  COLLECTION_DETAIL_SETTLE_FADE_MS,
  finishMorph,
  getMorphState,
  markMorphOpen,
  subscribeToMorph,
  type MorphPhase,
  type MorphState,
} from '../lib/morphTransition';

const settleFadeTiming = {
  duration: COLLECTION_DETAIL_SETTLE_FADE_MS,
  easing: Easing.bezier(...COLLECTION_DETAIL_EASING),
} as const;

export function MorphOverlayHost() {
  const [morph, setMorph] = useState<MorphState>(getMorphState);
  const [visible, setVisible] = useState(false);
  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const frame = useRef<number | null>(null);
  const prevPhase = useRef<MorphPhase>(morph.phase);

  useEffect(() => subscribeToMorph(setMorph), []);

  useEffect(() => {
    return () => {
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, []);

  useEffect(() => {
    const wasOpening = prevPhase.current === 'opening';
    prevPhase.current = morph.phase;

    if (morph.phase === 'idle') {
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      cancelAnimation(progress);
      cancelAnimation(overlayOpacity);
      setVisible(false);
      return;
    }

    // 'open' means the morph geometry finished — leave the settle fade running.
    if (morph.phase !== 'opening' && morph.phase !== 'closing') {
      return;
    }

    if (frame.current != null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    cancelAnimation(progress);
    cancelAnimation(overlayOpacity);
    overlayOpacity.value = 1;
    // Backing out mid-open reverses the card along the same path: the closing
    // rect at progress 1-p is identical to the opening rect at progress p.
    progress.value = morph.phase === 'closing' && wasOpening ? 1 - progress.value : 0;
    setVisible(true);

    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      runCollectionDetailMorph(progress, () => {
        if (getMorphState().phase === 'opening') {
          markMorphOpen();
        }
        overlayOpacity.value = withTiming(0, settleFadeTiming, (finished) => {
          if (finished) {
            runOnJS(handleSettleFadeComplete)();
          }
        });
      });
    });
  }, [morph, overlayOpacity, progress]);

  function handleSettleFadeComplete() {
    setVisible(false);
    if (getMorphState().phase === 'closing') {
      finishMorph();
    }
  }

  if (!visible || !morph.fragrance || !morph.origin) {
    return null;
  }

  return (
    <CollectionDetailMorph
      fragrance={morph.fragrance}
      origin={morph.origin}
      progress={progress}
      overlayOpacity={overlayOpacity}
      closing={morph.phase === 'closing'}
    />
  );
}
