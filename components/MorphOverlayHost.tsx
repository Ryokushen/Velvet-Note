import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, cancelAnimation, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { CollectionDetailMorph, runCollectionDetailMorph } from './CollectionDetailMorph';
import {
  COLLECTION_DETAIL_EASING,
  COLLECTION_DETAIL_SETTLE_FADE_MS,
  finishMorph,
  getMorphState,
  markMorphOpen,
  setMorphHostWindowOrigin,
  subscribeToMorph,
  type MorphPhase,
  type MorphState,
} from '../lib/morphTransition';

const settleFadeTiming = {
  duration: COLLECTION_DETAIL_SETTLE_FADE_MS,
  easing: Easing.bezier(...COLLECTION_DETAIL_EASING),
} as const;

// How long the opening morph waits for the detail screen to report its
// measured target rects before falling back to approximate geometry.
export const MORPH_TARGETS_WAIT_MS = 250;

export function MorphOverlayHost() {
  const [morph, setMorph] = useState<MorphState>(getMorphState);
  const [visible, setVisible] = useState(false);
  const [targetsWaitExpired, setTargetsWaitExpired] = useState(false);
  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);
  const frame = useRef<number | null>(null);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPhase = useRef<MorphPhase>(morph.phase);
  const startedForPhase = useRef<MorphPhase | null>(null);
  const hostRef = useRef<View>(null);

  useEffect(() => subscribeToMorph(setMorph), []);

  // Anchor the morph coordinate space: measureInWindow results elsewhere are
  // converted relative to this view's own window position, cancelling any
  // constant offset (e.g. the status bar under Android edge-to-edge) between
  // window coordinates and where this overlay actually draws.
  function handleHostLayout() {
    hostRef.current?.measureInWindow((x, y) => {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        setMorphHostWindowOrigin(x, y);
      }
    });
  }

  useEffect(() => {
    return () => {
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
      }
      if (waitTimer.current != null) {
        clearTimeout(waitTimer.current);
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
      if (waitTimer.current != null) {
        clearTimeout(waitTimer.current);
        waitTimer.current = null;
      }
      cancelAnimation(progress);
      cancelAnimation(overlayOpacity);
      startedForPhase.current = null;
      setTargetsWaitExpired(false);
      setVisible(false);
      return;
    }

    // 'open' means the morph geometry finished — leave the settle fade running.
    if (morph.phase !== 'opening' && morph.phase !== 'closing') {
      return;
    }

    // Target updates while this phase's animation is already running (e.g. a
    // late re-measure) must not restart it.
    if (startedForPhase.current === morph.phase) {
      return;
    }

    // Hold the opening morph until the detail screen reports where the card,
    // heading, and hero actually are. The overlay shows its frozen first frame
    // (the card exactly over the tapped row) while it waits, so nothing
    // flashes; if measurement never arrives, start anyway with approximate
    // geometry rather than hang.
    if (morph.phase === 'opening' && !morph.targets && !targetsWaitExpired) {
      cancelAnimation(progress);
      cancelAnimation(overlayOpacity);
      progress.value = 0;
      overlayOpacity.value = 1;
      setVisible(true);
      if (waitTimer.current == null) {
        waitTimer.current = setTimeout(() => {
          waitTimer.current = null;
          setTargetsWaitExpired(true);
        }, MORPH_TARGETS_WAIT_MS);
      }
      return;
    }

    if (frame.current != null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (waitTimer.current != null) {
      clearTimeout(waitTimer.current);
      waitTimer.current = null;
    }
    cancelAnimation(progress);
    cancelAnimation(overlayOpacity);
    overlayOpacity.value = 1;
    // Backing out mid-open reverses the card along the same path: the closing
    // rect at progress 1-p is identical to the opening rect at progress p.
    progress.value = morph.phase === 'closing' && wasOpening ? 1 - progress.value : 0;
    startedForPhase.current = morph.phase;
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
  }, [morph, targetsWaitExpired, overlayOpacity, progress]);

  function handleSettleFadeComplete() {
    setVisible(false);
    if (getMorphState().phase === 'closing') {
      finishMorph();
    }
  }

  return (
    <View
      ref={hostRef}
      pointerEvents="none"
      style={styles.host}
      onLayout={handleHostLayout}
    >
      {visible && morph.fragrance && morph.origin ? (
        <CollectionDetailMorph
          fragrance={morph.fragrance}
          origin={morph.origin}
          originKind={morph.originKind}
          targets={morph.targets}
          progress={progress}
          overlayOpacity={overlayOpacity}
          closing={morph.phase === 'closing'}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
