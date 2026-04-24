import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { BottlePlaceholder } from './ui/BottlePlaceholder';

type Props = {
  imageUrl?: string | null;
  width?: number;
  height?: number;
};

export function BottleArt({ imageUrl, width = 64, height = 82 }: Props) {
  return (
    <View style={[styles.frame, { width, height }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          transition={120}
        />
      ) : (
        <BottlePlaceholder width={width * 0.68} height={height * 0.82} tintOpacity={0.15} />
      )}
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
});
