import { StyleSheet, Text, View, type PropsWithChildren } from 'react-native';
import { COLORS, SPACE } from '@/constants/theme';

interface Props extends PropsWithChildren {
  title: string;
}

export function SectionCard({ title, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.dot} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SPACE.radiusLg,
    padding: SPACE.md,
    marginBottom: SPACE.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.md
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.ball,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 2
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: COLORS.courtDark
  }
});
