import Constants from 'expo-constants';

/**
 * Base URL only (no trailing slash).
 * Prefer EXPO_PUBLIC_API_URL in Expo config / .env; fallback to extra.apiUrl from app.config.js.
 */
export function getApiBase(): string | null {
  const fromMetro = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (fromMetro) return fromMetro;

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim().replace(/\/$/, '');
  if (fromExtra) return fromExtra;

  return null;
}
