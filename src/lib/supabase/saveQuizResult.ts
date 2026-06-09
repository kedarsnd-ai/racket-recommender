import { createClient } from './client';
import type { RecommendationPayload, RecommendationSuccess } from '@/lib/recommend/types';

export async function saveQuizResult(
  payload: RecommendationPayload,
  result: RecommendationSuccess
): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const picks = result.picks.slice(0, 3);

    await supabase.from('quiz_results').insert({
      user_id: user.id,
      height_in: Number(payload.heightIn) || null,
      weight_lb: Number(payload.weightLb) || null,
      grip_idx: Number(payload.gripIdx) || null,
      level: payload.level || null,
      swing: payload.swing || null,
      style: payload.style || null,
      volley: Number(payload.volley) || null,
      arm: payload.arm || null,
      utr: payload.utr ? Number(payload.utr) : null,
      usta: payload.usta ? Number(payload.usta) : null,
      budget: Number(payload.budget) || null,
      string_pref: payload.stringPref || null,
      notes: payload.notesText || null,
      persona_label: result.persona.label,
      persona_blurb: result.persona.blurb,
      relaxations: result.relaxations,
      pick1_racket: picks[0]?.racket.Model ?? null,
      pick1_brand: picks[0]?.racket.Brand ?? null,
      pick1_score: picks[0]?.matchScore ?? null,
      pick1_string: picks[0]?.string?.Model ?? null,
      pick2_racket: picks[1]?.racket.Model ?? null,
      pick2_brand: picks[1]?.racket.Brand ?? null,
      pick2_score: picks[1]?.matchScore ?? null,
      pick2_string: picks[1]?.string?.Model ?? null,
      pick3_racket: picks[2]?.racket.Model ?? null,
      pick3_brand: picks[2]?.racket.Brand ?? null,
      pick3_score: picks[2]?.matchScore ?? null,
      pick3_string: picks[2]?.string?.Model ?? null,
    });
  } catch {
    // Silently fail — don't break the user experience if save fails
  }
}
