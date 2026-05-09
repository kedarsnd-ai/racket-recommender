import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  Platform
} from 'react-native';
import { COLORS, SPACE } from '@/constants/theme';

interface Props extends TextInputProps {
  label: string;
  hint?: string;
}

export function TextField({
  label,
  hint,
  style,
  multiline,
  ...rest
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}> {hint}</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={COLORS.muted}
        {...rest}
        multiline={multiline}
        style={[
          styles.input,
          multiline ? styles.inputMulti : styles.inputSingle,
          Platform.OS === 'ios' && styles.inputIos
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACE.sm },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cardText,
    marginBottom: 6
  },
  hint: { fontWeight: '400', color: COLORS.muted, fontSize: 12 },
  input: {
    borderRadius: SPACE.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderSoft,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.cardText,
    backgroundColor: '#f9fbf9'
  },
  inputSingle: {
    paddingVertical: Platform.select({ ios: 12, android: 8 }) ?? 10,
    minHeight: 46
  },
  inputMulti: {
    paddingVertical: 10,
    minHeight: 72,
    textAlignVertical: 'top'
  },
  inputIos: {}
});
