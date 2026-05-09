import type { RecommendationPayload, RecommendationResult } from '@/types/api';
import { getApiBase } from '@/lib/getApiBase';

export async function fetchRecommendation(
  payload: RecommendationPayload
): Promise<RecommendationResult> {
  const base = getApiBase();
  if (!base) {
    return {
      ok: false,
      error:
        'Missing API URL. Set EXPO_PUBLIC_API_URL (e.g. http://YOUR_LAN_IP:3000) and restart Expo.'
    };
  }

  const url = `${base}/api/recommend`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Invalid JSON from server.' };
  }

  if (!res.ok) {
    const err =
      typeof data === 'object' &&
      data &&
      'error' in data &&
      typeof (data as { error?: string }).error === 'string'
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    return { ok: false, error: err };
  }

  return data as RecommendationResult;
}
