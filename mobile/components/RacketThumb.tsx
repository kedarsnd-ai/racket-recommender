import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { accentForBrand } from '@/lib/brands';
import { COLORS } from '@/constants/theme';
import type { Racket } from '@/types/api';

interface Props {
  racket: Racket;
  photoUrl: string | null;
}

/** TW thumbnail with geometric fallback (no SVG engine required on native). */
export function RacketThumb({ racket, photoUrl }: Props) {
  const [bad, setBad] = useState(false);
  const accent = accentForBrand(racket.Brand);

  if (!photoUrl || bad) {
    const letter = racket.Brand?.charAt(0) ?? '🎾';
    return (
      <View style={[styles.fallback, { borderColor: accent }]}>
        <View style={[styles.ring, { borderColor: accent }]} />
        <Text style={styles.fallbackLetter}>{letter}</Text>
        <Text style={styles.fallbackMini} numberOfLines={2}>
          {racket.Model}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={styles.image}
      contentFit="contain"
      transition={160}
      onError={() => setBad(true)}
    />
  );
}

const FALLBACK_W = 108;
const styles = StyleSheet.create({
  image: {
    width: FALLBACK_W,
    height: FALLBACK_W * 1.35,
    borderRadius: 10,
    backgroundColor: '#f9fbf9'
  },
  fallback: {
    width: FALLBACK_W,
    height: FALLBACK_W * 1.35,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4fbf6'
  },
  ring: {
    position: 'absolute',
    width: FALLBACK_W * 0.75,
    height: FALLBACK_W * 0.95,
    borderRadius: 999,
    borderWidth: 3,
    opacity: 0.5
  },
  fallbackLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.courtDark,
    marginBottom: 4
  },
  fallbackMini: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: 6,
    marginTop: 4,
    fontWeight: '600'
  }
});
