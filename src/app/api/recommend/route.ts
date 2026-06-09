import Anthropic from '@anthropic-ai/sdk';
import { catalog } from '@/lib/catalog';
import { computeRecommendation } from '@/lib/recommend/engine';
import type { RecommendationPayload, RecommendationSuccess } from '@/lib/recommend/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const COACH_SYSTEM = `You are an elite tennis coach and equipment specialist. Write personalized, coaching-quality racket recommendations — the kind a knowledgeable pro gives a student, not a product blurb. Be specific, warm, and direct. Never say "it's worth noting" or "it's important to understand". Max 3 sentences per pick.`;

async function enhanceWithClaude(
  payload: RecommendationPayload,
  result: RecommendationSuccess
): Promise<RecommendationSuccess> {
  const picks = result.picks.slice(0, 3);

  const picksText = picks
    .map(
      (p, i) => `
Pick ${i + 1}: ${p.racket.Brand} ${p.racket.Model} ${p.racket.Year}
- Frame type: ${p.racket.Frame_Type}, ${p.racket.Weight_Strung_oz}oz, ${p.racket.Head_Size_sqin}sq in, RA ${p.racket.Stiffness_RA}, ${p.racket.String_Pattern}
- Match score: ${p.matchScore}%
- Fit tags: ${p.tags.filter((t) => t.startsWith('✓')).join(', ')}
${p.string ? `- Paired string: ${p.string.Brand} ${p.string.Model} (${p.string.String_Type}) at ${p.tension} lbs` : ''}`
    )
    .join('\n');

  const volleyLabel =
    ['', 'weak', 'developing', 'solid', 'strong'][+payload.volley] || 'developing';

  const playerProfile = `Height ${payload.heightIn}in · Weight ${payload.weightLb}lb · Level: ${payload.level} · Swing: ${payload.swing} · Style: ${payload.style} · Volley: ${volleyLabel}${payload.arm === 'Yes' ? ' · Needs arm-friendly frames' : ''}${payload.utr ? ` · UTR ${payload.utr}` : ''}${payload.usta ? ` · USTA ${payload.usta}` : ''}${payload.notesText ? ` · Notes: "${payload.notesText}"` : ''}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: COACH_SYSTEM,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: `Player: ${playerProfile}

Top 3 algorithm picks:
${picksText}

Return ONLY valid JSON — no markdown, no extra text:
{
  "persona": {"label": "Creative player archetype name", "blurb": "One punchy coaching sentence about their game."},
  "whyTexts": [
    "2-3 sentence coaching explanation for pick 1 — specific to THIS player",
    "2-3 sentence coaching explanation for pick 2",
    "2-3 sentence coaching explanation for pick 3"
  ]
}`
      }
    ]
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return result;

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return result;

  const parsed = JSON.parse(jsonMatch[0]) as {
    persona?: { label: string; blurb: string };
    whyTexts?: string[];
  };

  return {
    ...result,
    persona: parsed.persona ?? result.persona,
    picks: result.picks.map((pick, i) => ({
      ...pick,
      why: parsed.whyTexts?.[i] ?? pick.why
    }))
  };
}

export async function POST(request: Request) {
  let body: RecommendationPayload;
  try {
    body = (await request.json()) as RecommendationPayload;
  } catch {
    return Response.json({ ok: false as const, error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const engineResult = computeRecommendation(body, catalog);
    if (!engineResult.ok) return Response.json(engineResult, { status: 400 });

    // Enhance with Claude if key is configured — falls back to engine result on any error
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here') {
      try {
        const enhanced = await enhanceWithClaude(body, engineResult);
        return Response.json(enhanced);
      } catch (e) {
        console.error('Claude enhancement skipped:', e);
      }
    }

    return Response.json(engineResult);
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false as const, error: 'Recommendation failed.' }, { status: 500 });
  }
}
