import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { COLORS, SPACE } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'court' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'court',
  style
}: Props) {
  const outlined = variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        outlined ? styles.outline : styles.filled,
        pressed && !(disabled || loading) && styles.pressed,
        (disabled || loading) && styles.mutedBtn,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={outlined ? COLORS.court : '#fff'}
        />
      ) : (
        <Text style={[styles.text, outlined && styles.textOutlined]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACE.sm,
    minHeight: 52
  },
  filled: {
    backgroundColor: COLORS.courtDark,
    borderWidth: 2,
    borderColor: COLORS.ball
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.court
  },
  pressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  mutedBtn: { opacity: 0.55 },
  text: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700'
  },
  textOutlined: { color: COLORS.court }
});
