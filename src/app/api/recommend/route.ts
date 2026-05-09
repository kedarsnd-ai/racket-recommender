import { catalog } from '@/lib/catalog';
import { computeRecommendation } from '@/lib/recommend/engine';
import type { RecommendationPayload } from '@/lib/recommend/types';

export async function POST(request: Request) {
  let body: RecommendationPayload;
  try {
    body = (await request.json()) as RecommendationPayload;
  } catch {
    return Response.json({ ok: false as const, error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const result = computeRecommendation(body, catalog);
    if (!result.ok)
      return Response.json(result, { status: 400 });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json(
      { ok: false as const, error: 'Recommendation failed.' },
      { status: 500 }
    );
  }
}
