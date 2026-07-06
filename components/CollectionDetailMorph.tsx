import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  type SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import type { Fragrance } from '../types/fragrance';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/spacing';
import { BottleArt } from './BottleArt';
import { formatAccordList } from '../lib/accordDisplay';
import {
  COLLECTION_DETAIL_EASING,
  COLLECTION_DETAIL_MORPH_DURATION_MS,
  type MorphRect,
} from '../lib/morphTransition';

export type { MorphRect };

const HEADING_ROW_LEFT = 20;
const HEADING_ROW_TOP = 20;
const HEADING_DETAIL_LEFT = 24;
const HEADING_DETAIL_TOP = 76;
const HEADING_ROW_SCALE = 0.54;
const MIN_SCALE = 0.0001;

type Props = {
  fragrance: Fragrance;
  progress: SharedValue<number>;
  origin: MorphRect;
  overlayOpacity?: SharedValue<number>;
  closing?: boolean;
};

const screen = Dimensions.get('window');
const easing = Easing.bezier(...COLLECTION_DETAIL_EASING);

export const collectionDetailTiming = {
  duration: COLLECTION_DETAIL_MORPH_DURATION_MS,
  easing,
} as const;

export function runCollectionDetailMorph(
  progress: SharedValue<number>,
  onComplete?: () => void,
) {
  progress.value = withTiming(1, collectionDetailTiming, (finished) => {
    if (finished && onComplete) {
      runOnJS(onComplete)();
    }
  });
}

export function CollectionDetailMorph({
  fragrance,
  progress,
  origin,
  overlayOpacity,
  closing = false,
}: Props) {
  const from = closing ? fullScreenRect() : origin;
  const to = closing ? rowTargetRect(origin) : fullScreenRect();

  // The card is laid out at full-screen size once and morphs purely via
  // translate + scale so no frame ever triggers a layout pass.
  const fromScaleX = Math.max(from.width / screen.width, MIN_SCALE);
  const fromScaleY = Math.max(from.height / screen.height, MIN_SCALE);
  const toScaleX = Math.max(to.width / screen.width, MIN_SCALE);
  const toScaleY = Math.max(to.height / screen.height, MIN_SCALE);

  const rootStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity ? overlayOpacity.value : 1,
    };
  }, [overlayOpacity]);

  const cardSurfaceStyle = useAnimatedStyle(() => {
    return cardTransform(
      progress.value,
      from,
      to,
      fromScaleX,
      fromScaleY,
      toScaleX,
      toScaleY,
    );
  }, [closing, from.height, from.width, from.x, from.y, to.height, to.width, to.x, to.y]);

  const cardClipStyle = useAnimatedStyle(() => {
    return cardTransform(
      progress.value,
      from,
      to,
      fromScaleX,
      fromScaleY,
      toScaleX,
      toScaleY,
    );
  }, [closing, from.height, from.width, from.x, from.y, to.height, to.width, to.x, to.y]);

  const contentCounterScaleStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const scaleX = interpolate(p, [0, 1], [fromScaleX, toScaleX], Extrapolation.CLAMP);
    const scaleY = interpolate(p, [0, 1], [fromScaleY, toScaleY], Extrapolation.CLAMP);

    return {
      transform: [
        { scaleX: 1 / Math.max(scaleX, MIN_SCALE) },
        { scaleY: 1 / Math.max(scaleY, MIN_SCALE) },
      ],
    };
  }, [closing, fromScaleX, fromScaleY, toScaleX, toScaleY]);

  const sharedHeadingStyle = useAnimatedStyle(() => {
    const phase = closing ? 1 - progress.value : progress.value;

    return {
      transform: [
        {
          translateX: interpolate(
            phase,
            [0, 1],
            [HEADING_ROW_LEFT - HEADING_DETAIL_LEFT, 0],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            phase,
            [0, 1],
            [HEADING_ROW_TOP - HEADING_DETAIL_TOP, 0],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(phase, [0, 1], [HEADING_ROW_SCALE, 1], Extrapolation.CLAMP),
        },
      ],
    };
  }, [closing]);

  const rowLayerStyle = useAnimatedStyle(() => {
    const phase = closing ? 1 - progress.value : progress.value;

    return {
      opacity: interpolate(phase, [0, 0.5], [1, 0], Extrapolation.CLAMP),
    };
  }, [closing]);

  const detailLayerStyle = useAnimatedStyle(() => {
    const phase = closing ? 1 - progress.value : progress.value;

    return {
      opacity: interpolate(phase, [0, 0.25, 0.916, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
    };
  }, [closing]);

  const heroImageStyle = useAnimatedStyle(() => {
    const phase = closing ? 1 - progress.value : progress.value;

    return {
      transform: [
        { translateY: interpolate(phase, [0, 1], [58, 0], Extrapolation.CLAMP) },
        { scale: interpolate(phase, [0, 1], [0.92, 1], Extrapolation.CLAMP) },
      ],
    };
  }, [closing]);

  const rowRect = closing ? to : from;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLabel={`${closing ? 'Closing' : 'Opening'} ${fragrance.brand} ${fragrance.name}`}
      style={[styles.overlay, rootStyle]}
    >
      <Animated.View style={[styles.cardSurface, cardSurfaceStyle]} />
      <Animated.View style={[styles.cardClip, cardClipStyle]}>
        <Animated.View style={[styles.contentScale, contentCounterScaleStyle]}>
          <Animated.View
            style={[
              styles.rowLayer,
              { width: rowRect.width, height: rowRect.height },
              rowLayerStyle,
            ]}
          >
            <View style={styles.rowMeta}>
              <Text style={styles.subline} numberOfLines={1}>
                {[fragrance.concentration, formatAccordList(fragrance.accords.slice(0, 3))]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text style={styles.rating}>
                {fragrance.rating != null ? fragrance.rating.toFixed(1) : '-'}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.detailLayer, detailLayerStyle]}>
            <Animated.View
              testID="morph-hero-image"
              style={[styles.heroImage, heroImageStyle]}
            >
              <BottleArt imageUrl={fragrance.image_url} width={176} height={228} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.sharedHeading, sharedHeadingStyle]}>
            <Text style={styles.brand}>{fragrance.brand}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {fragrance.name}
            </Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

function cardTransform(
  p: number,
  from: MorphRect,
  to: MorphRect,
  fromScaleX: number,
  fromScaleY: number,
  toScaleX: number,
  toScaleY: number,
) {
  'worklet';

  return {
    transform: [
      { translateX: interpolate(p, [0, 1], [from.x, to.x], Extrapolation.CLAMP) },
      { translateY: interpolate(p, [0, 1], [from.y, to.y], Extrapolation.CLAMP) },
      { scaleX: interpolate(p, [0, 1], [fromScaleX, toScaleX], Extrapolation.CLAMP) },
      { scaleY: interpolate(p, [0, 1], [fromScaleY, toScaleY], Extrapolation.CLAMP) },
    ],
  };
}

export function fallbackRowRect(): MorphRect {
  return {
    x: 16,
    y: 156,
    width: Math.max(280, screen.width - 32),
    height: 96,
  };
}

export function fullScreenRect(): MorphRect {
  return {
    x: 0,
    y: 0,
    width: screen.width,
    height: screen.height,
  };
}

function rowTargetRect(origin: MorphRect): MorphRect {
  if (origin.width > 0 && origin.height > 0) {
    return origin;
  }
  return fallbackRowRect();
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  cardSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screen.width,
    height: screen.height,
    transformOrigin: 'top left',
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  cardClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screen.width,
    height: screen.height,
    transformOrigin: 'top left',
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    elevation: 20,
  },
  contentScale: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screen.width,
    height: screen.height,
    transformOrigin: 'top left',
  },
  rowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 62,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  detailLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screen.width,
    height: screen.height,
    paddingTop: 164,
    paddingHorizontal: 24,
  },
  sharedHeading: {
    position: 'absolute',
    left: HEADING_DETAIL_LEFT,
    top: HEADING_DETAIL_TOP,
    maxWidth: 320,
    transformOrigin: 'left top',
  },
  brand: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  name: {
    fontFamily: typography.serif,
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
  },
  heroImage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  subline: {
    ...typography.bodyDim,
    color: colors.textDim,
    flex: 1,
    fontSize: 12,
  },
  rating: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.text,
  },
});
