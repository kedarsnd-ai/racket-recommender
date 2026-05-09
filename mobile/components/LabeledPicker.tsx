import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACE } from '@/constants/theme';

type Item = { label: string; value: string };

interface Props {
  label: string;
  hint?: string;
  items: readonly Item[];
  selected: string;
  onChange: (v: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function LabeledPicker({
  label,
  hint,
  items,
  selected,
  onChange,
  style
}: Props) {
  return (
    <View style={style}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}> {hint}</Text> : null}
      </Text>
      <View style={styles.pickerShell}>
        <Picker
          selectedValue={selected}
          onValueChange={onChange}
          dropdownIconColor={COLORS.courtLine}
          style={[
            Platform.OS === 'ios' ? styles.pickerIos : styles.pickerAndroid
          ]}
          itemStyle={styles.pickerItemIos}
        >
          {items.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color={Platform.OS === 'android' ? COLORS.cardText : COLORS.ball}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cardText,
    marginBottom: 6
  },
  hint: { fontWeight: '400', color: COLORS.muted, fontSize: 12 },
  pickerShell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderSoft,
    borderRadius: SPACE.radius,
    backgroundColor:
      Platform.OS === 'ios' ? COLORS.iosPickerBg : COLORS.borderSoft + '33',
    overflow: 'hidden'
  },
  pickerIos: { marginVertical: -4 },
  pickerAndroid: { height: 48, color: COLORS.cardText },
  pickerItemIos: {
    fontSize: 17,
    color: COLORS.cardText,
    height: 160,
    ...(Platform.OS === 'ios'
      ? { backgroundColor: COLORS.iosPickerBg }
      : {})
  }
});
