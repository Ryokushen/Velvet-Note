import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Caption } from './text';
import { Chip } from './Chip';
import { familyFor } from '../../theme/families';

type Props = {
  accords: string[];
};

// Phase 1 data is a flat array; the backend will split top/heart/base in Phase 2.
// Until then, bucket by family as a rough proxy: fresh → top, floral → heart,
// woody/oriental/spicy → base. Same heuristic the design prototype uses.
function bucket(accords: string[]) {
  const top: string[] = [];
  const heart: string[] = [];
  const base: string[] = [];
  accords.forEach((a) => {
    const fam = familyFor(a);
    if (fam === 'fresh') top.push(a);
    else if (fam === 'floral') heart.push(a);
    else base.push(a);
  });
  // If a bucket is empty, borrow from the flat list so each row has content
  // rather than showing a phantom "Top" with nothing in it.
  return {
    top: top.length ? top : accords.slice(0, 1),
    heart: heart.length ? heart : accords.slice(1, 2),
    base: base.length ? base : accords.slice(2),
  };
}

const ROWS: [string, string][] = [
  ['Top', 'The first impression'],
  ['Heart', 'After a few minutes'],
  ['Base', 'What lingers'],
];

export function NotesRows({ accords }: Props) {
  if (accords.length === 0) {
    return <Text style={styles.empty}>No notes recorded.</Text>;
  }
  const buckets = bucket(accords);
  const data = [buckets.top, buckets.heart, buckets.base];
  return (
    <View style={styles.wrap}>
      {ROWS.map(([label, sub], i) => {
        const items = data[i];
        if (!items || items.length === 0) return null;
        return (
          <View key={label} style={styles.row}>
            <View style={styles.labelCol}>
              <Caption tone="muted">{label}</Caption>
              <Text style={styles.sub}>{sub}</Text>
            </View>
            <View style={styles.chipsCol}>
              {items.map((a) => (
                <Chip key={a} label={a} size="sm" />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  row: { flexDirection: 'row', gap: 20 },
  labelCol: { width: 80, paddingTop: 4 },
  sub: {
    ...typography.bodyDim,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  chipsCol: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  empty: {
    ...typography.bodyDim,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
