import { COLORS } from '@/constants/theme';

/** Fallback racket visual when TW image fails (subset of TW brand cues) */
const BRAND_ACCENT: Record<string, string> = {
  Wilson: '#c41e3a',
  Babolat: '#f7e017',
  Head: '#c41e3a',
  Yonex: '#003d7a',
  Prince: '#1e90c4',
  Tecnifibre: '#f47b20',
  Dunlop: '#f7e017'
};

export function accentForBrand(brand: string): string {
  return BRAND_ACCENT[brand] ?? COLORS.ball;
}
