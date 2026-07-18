import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeOut } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { durations, easeOut, useReducedMotion } from '../lib/motion';
import { BottlePlaceholder } from './ui/BottlePlaceholder';

type Props = {
  imageUrl?: string | null;
  width?: number;
  height?: number;
};

export function BottleArt({ imageUrl, width = 64, height = 82 }: Props) {
  const reducedMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // A new source starts over: placeholder back underneath until it loads.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageUrl]);

  const showPlaceholder = !imageUrl || failed || !loaded;

  return (
    <View style={[styles.frame, { width, height }]}>
      {showPlaceholder ? (
        <Animated.View
          testID="bottle-art-placeholder"
          style={styles.placeholder}
          exiting={
            reducedMotion
              ? undefined
              : FadeOut.duration(durations.base).easing(easeOut)
          }
        >
          <BottlePlaceholder width={width * 0.68} height={height * 0.82} tintOpacity={0.15} />
        </Animated.View>
      ) : null}
      {imageUrl && !failed ? (
        <Image
          testID="bottle-art-image"
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          transition={reducedMotion ? 0 : durations.fast}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
