import type { CatalogBundle, CatalogMeta, Racket, TennisString } from '@/lib/catalog/types';
import type {
  ParsedNotes,
  PickResult,
  RankedDraft,
  RecommendationPayload,
  RecommendationResult,
  RecommendationSummary
} from './types';

const LEVEL_ORDER = [
  'Beginner',
  'Beginner/Intermediate',
  'Intermediate',
  'Intermediate/Advanced',
  'Advanced',
  'Advanced/Pro',
  'Pro'
] as const;

const SWING_ORDER = [
  'Slow',
  'Slow/Medium',
  'Medium',
  'Medium/Fast',
  'Fast',
  'Fast/Very Fast',
  'Very Fast'
] as const;

function rangeOf(tag: string | undefined, order: readonly string[]): [number, number] | null {
  const parts = (tag || '').split('/').map((s) => s.trim());
  const idx = parts.map((p) => order.indexOf(p)).filter((i) => i >= 0);
  if (!idx.length) return null;
  return [Math.min(...idx), Math.max(...idx)];
}

function distanceTo(playerIdx: number, range: [number, number] | null): number {
  if (!range) return 99;
  if (playerIdx >= range[0] && playerIdx <= range[1]) return 0;
  return Math.min(Math.abs(playerIdx - range[0]), Math.abs(playerIdx - range[1]));
}

function refineLevelIdx(baseIdx: number, utr: number, usta: number): number {
  let idx = baseIdx;
  if (!Number.isNaN(utr)) {
    const cuts = [3, 5, 7, 9, 11, 13];
    let i = cuts.findIndex((c) => utr < c);
    if (i < 0) i = 6;
    idx = Math.max(idx, i);
  }
  if (!Number.isNaN(usta)) {
    const cuts = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    let i = cuts.findIndex((c) => usta < c);
    if (i < 0) i = 6;
    idx = Math.max(idx, i);
  }
  return idx;
}

function idealRacketWeight(heightIn: number, weightLb: number): number {
  let target = 11.4;
  if (weightLb < 110) target = 10.8;
  else if (weightLb < 140) target = 11.1;
  else if (weightLb < 170) target = 11.4;
  else if (weightLb < 200) target = 11.7;
  else target = 11.9;
  if (heightIn >= 74) target += 0.2;
  if (heightIn <= 64) target -= 0.2;
  return target;
}

function styleScore(playerStyle: string, racketStyle: string | undefined): number {
  if (!racketStyle) return 0;
  const parts = racketStyle.split('/').map((s) => s.trim());
  if (parts.includes(playerStyle)) return parts.length === 1 ? 2 : 1.5;
  const baseliners = [
    'Baseliner',
    'Aggressive Baseliner',
    'Control Baseliner',
    'Spin Baseliner'
  ];
  if (baseliners.includes(playerStyle) && parts.some((p) => baseliners.includes(p))) return 1;
  if (playerStyle === 'All-Court' && parts.some((p) => p.includes('All-Court'))) return 1;
  if (playerStyle === 'Serve-Volley') {
    if (parts.some((p) => p === 'Serve-Volley')) return 2;
    if (parts.some((p) => p.includes('All-Court'))) return 1.5;
  }
  return 0;
}

function gripFits(gripIdx: number, racketRange: string | undefined): boolean {
  if (!racketRange) return true;
  const m = racketRange.match(/[LG](\d).*[LG](\d)/);
  if (!m) return true;
  return gripIdx >= +m[1] && gripIdx <= +m[2];
}

function preferredStringType(
  racket: Racket,
  levelIdx: number,
  swingIdx: number,
  arm: 'Yes' | 'any',
  userPref: string
): string {
  if (userPref !== 'auto') return userPref;
  if (arm === 'Yes') return 'Multifilament';
  const isPower = (racket.Frame_Type || '').includes('Power');
  if (isPower && swingIdx <= 2) return 'Multifilament';
  const isControl = ['Control', "Player's", 'Control/Tweener', 'Spin/Control'].includes(
    racket.Frame_Type
  );
  if (isControl && swingIdx >= 3) return 'Polyester';
  if (racket.Frame_Type === 'Spin/Power' || racket.Frame_Type === 'Spin/Tweener')
    return 'Polyester';
  if (levelIdx >= 4) return 'Polyester';
  if (levelIdx <= 1) return 'Synthetic Gut';
  return 'Multifilament';
}

function scoreString(
  s: TennisString,
  racket: Racket,
  levelIdx: number,
  swingIdx: number,
  style: string,
  arm: 'Yes' | 'any'
): number {
  const lvlR = rangeOf(s.Best_For_Skill, LEVEL_ORDER as unknown as readonly string[]);
  const swR = rangeOf(
    s.Best_For_Swing_Speed === 'All Speeds' ? 'Slow/Very Fast' : s.Best_For_Swing_Speed,
    SWING_ORDER as unknown as readonly string[]
  );
  const swDist = s.Best_For_Swing_Speed === 'All Speeds' ? 0 : distanceTo(swingIdx, swR);
  const lvlDist = distanceTo(levelIdx, lvlR);
  if (lvlDist > 1 || swDist > 1) return -1;
  if (arm === 'Yes' && s.Arm_Friendly !== 'Yes') return -1;

  let score = 0;
  score += lvlDist === 0 ? 30 : 12;
  score += swDist === 0 ? 25 : 10;
  score += styleScore(style, s.Best_For_Play_Style) * 10;
  const frame = racket.Frame_Type || '';
  if (frame.includes('Power') && s.String_Type === 'Multifilament') score += 8;
  if (frame.includes('Control') && s.String_Type === 'Polyester') score += 8;
  if (frame === 'Spin/Power' || frame === 'Spin/Tweener') {
    if ((s.Spin_Potential || 0) >= 4) score += 8;
  }
  if (style === 'Aggressive Baseliner' && (s.Spin_Potential || 0) >= 4) score += 6;
  if (style === 'Control Baseliner' && (s.Control_Level || 0) >= 4) score += 5;
  if (arm === 'Yes' && s.Arm_Friendly === 'Yes') score += 6;
  return score;
}

function pickString(
  strings: TennisString[],
  racket: Racket,
  levelIdx: number,
  swingIdx: number,
  style: string,
  arm: 'Yes' | 'any',
  userPref: string
): TennisString | null {
  const wantType = preferredStringType(racket, levelIdx, swingIdx, arm, userPref);
  let pool = strings.filter((s) => s.String_Type === wantType);
  if (!pool.length) pool = strings;
  const scored = pool
    .map((s) => ({ s, score: scoreString(s, racket, levelIdx, swingIdx, style, arm) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length) return scored[0].s;
  const any = strings
    .map((s) => ({ s, score: scoreString(s, racket, levelIdx, swingIdx, style, arm) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);
  return any[0]?.s ?? null;
}

function recommendedTension(
  str: TennisString,
  racket: Racket,
  player: { swingIdx: number; levelIdx: number; weightLb: number }
): number {
  const min = str.Tension_Min_lbs;
  const max = str.Tension_Max_lbs;
  let t = (min + max) / 2;

  if (racket.Stiffness_RA >= 70) t -= 2;
  else if (racket.Stiffness_RA <= 62) t += 1;

  if (player.swingIdx >= 4) t -= 2;
  if (player.swingIdx >= 6) t -= 1;
  if (player.swingIdx <= 1) t += 1;

  if (player.weightLb > 180) t -= 1;
  if (player.weightLb < 130) t += 1;

  if (player.levelIdx >= 4) t -= 1;
  if (player.levelIdx <= 1) t += 1;

  if (str.String_Type === 'Polyester') t -= 1;

  t = Math.max(min - 2, Math.min(max + 2, t));
  return Math.round(t);
}

function buyURL(meta: CatalogMeta, brand: string, model: string, racketID: string): string {
  if (racketID && meta.twPage[racketID]) return meta.twPage[racketID];
  const q = encodeURIComponent(
    (`${brand} ${model} tennis racquet`)
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  return `https://www.google.com/search?tbm=shop&q=${q}`;
}

function buyStringURL(brand: string, model: string): string {
  const q = encodeURIComponent(
    (`${brand} ${model} tennis string`)
      .replace(/[()/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  return `https://www.google.com/search?tbm=shop&q=${q}`;
}

function parseNotes(text: string | undefined): ParsedNotes {
  const t = (text || '').toLowerCase();
  const adj: ParsedNotes = {
    weightDelta: 0,
    forceArmFriendly: false,
    budgetCap: null,
    boostFrame: {},
    brandPref: null,
    extraTags: []
  };
  const has = (w: string) => t.includes(w);
  if (has('spin') || has('topspin')) {
    adj.boostFrame.Spin = 12;
    adj.extraTags.push('notes: more spin');
  }
  if (has('more power') || (has('power') && !has('control'))) {
    adj.boostFrame.Power = 12;
    adj.extraTags.push('notes: more power');
  }
  if (has('control') || has('precision') || has('flat')) {
    adj.boostFrame.Control = 12;
    adj.extraTags.push('notes: more control');
  }
  if (has('comfort') || has('elbow') || has('arm') || has('shoulder') || has('injury')) {
    adj.forceArmFriendly = true;
    adj.extraTags.push('notes: arm comfort');
  }
  if (has('lighter') || has('light frame') || has('light racket')) {
    adj.weightDelta -= 0.4;
    adj.extraTags.push('notes: lighter');
  }
  if (has('heavier') || has('heavy frame')) {
    adj.weightDelta += 0.4;
    adj.extraTags.push('notes: heavier');
  }
  if (has('feel') || has('touch')) {
    adj.boostFrame["Player's"] = 8;
    adj.extraTags.push('notes: touch + feel');
  }
  if (has('serve') || has('volley') || has('net')) {
    adj.boostFrame.Control = (adj.boostFrame.Control || 0) + 4;
    adj.extraTags.push('notes: serve/net play');
  }
  if (has('cheap') || has('budget') || has('affordable')) {
    adj.budgetCap = 220;
    adj.extraTags.push('notes: budget');
  }
  for (const b of [
    'wilson',
    'babolat',
    'head',
    'yonex',
    'prince',
    'tecnifibre',
    'dunlop',
    'luxilon',
    'solinco'
  ]) {
    if (has(b)) {
      adj.brandPref = b;
      adj.extraTags.push(`notes: prefer ${b}`);
    }
  }
  return adj;
}

function racketPhotoUrl(meta: CatalogMeta, rid: string): string | null {
  const code = meta.twImg[rid];
  return code
    ? `https://img.tennis-warehouse.com/watermark/rs.php?path=${code}-thumb.jpg`
    : null;
}

function racketSVG(brand: string, brandColors: CatalogMeta['brandColors']): string {
  const c = brandColors[brand] || {
    frame: '#2d6e3e',
    grip: '#1a1a1a',
    accent: '#fff'
  };
  return `
  <svg viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg" class="racket-svg" aria-hidden="true">
    <rect x="46" y="106" width="8" height="68" rx="2" fill="${c.grip}"/>
    <line x1="46" y1="118" x2="54" y2="122" stroke="${c.accent}" stroke-width="0.6" opacity="0.6"/>
    <line x1="46" y1="130" x2="54" y2="134" stroke="${c.accent}" stroke-width="0.6" opacity="0.6"/>
    <line x1="46" y1="142" x2="54" y2="146" stroke="${c.accent}" stroke-width="0.6" opacity="0.6"/>
    <line x1="46" y1="154" x2="54" y2="158" stroke="${c.accent}" stroke-width="0.6" opacity="0.6"/>
    <path d="M 36 106 Q 50 92 64 106" fill="none" stroke="${c.frame}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="55" rx="36" ry="48" fill="none" stroke="${c.frame}" stroke-width="5"/>
    <g stroke="#f5f5ee" stroke-width="0.7" opacity="0.85">
      <line x1="18" y1="35" x2="82" y2="35"/>
      <line x1="16" y1="50" x2="84" y2="50"/>
      <line x1="15" y1="65" x2="85" y2="65"/>
      <line x1="17" y1="80" x2="83" y2="80"/>
      <line x1="22" y1="95" x2="78" y2="95"/>
      <line x1="32" y1="10" x2="32" y2="100"/>
      <line x1="42" y1="8"  x2="42" y2="103"/>
      <line x1="50" y1="7"  x2="50" y2="104"/>
      <line x1="58" y1="8"  x2="58" y2="103"/>
      <line x1="68" y1="10" x2="68" y2="100"/>
    </g>
    <circle cx="78" cy="22" r="5" fill="#d4ee5c" stroke="#fff" stroke-width="0.8" opacity="0.9"/>
  </svg>`.trim();
}

function normalizedScore(raw: number): number {
  return Math.max(40, Math.min(100, Math.round((raw / 100) * 95)));
}

function whyRacket(
  m: RankedDraft,
  blurbs: CatalogMeta['racketBlurbs'],
  ctx: {
    level: string;
    swing: string;
    style: string;
    arm: 'Yes' | 'any';
    targetWeight: number;
  }
): string {
  const r = m.r;
  const out: string[] = [];
  const blurb =
    blurbs[r.Racket_ID] ||
    `The ${r.Brand} ${r.Model} is a ${String(r.Frame_Type).toLowerCase()} frame.`;
  out.push(blurb);

  const reasons: string[] = [];
  if (m.tags.some((t) => t.includes('matches your level')))
    reasons.push(`your ${ctx.level.toLowerCase()} level`);
  if (m.tags.some((t) => t.includes('matches your swing')))
    reasons.push(`${ctx.swing.toLowerCase()} swing speed`);
  if (m.tags.some((t) => t.includes('ideal for your style')))
    reasons.push(`${ctx.style.toLowerCase()} game`);
  else if (m.tags.some((t) => t.includes('compatible style')))
    reasons.push(`a ${ctx.style.toLowerCase()} game`);
  if (m.tags.some((t) => t.startsWith('✓ weight fits')))
    reasons.push(`your body type (target ${ctx.targetWeight.toFixed(1)} oz)`);
  if (ctx.arm === 'Yes' && r.Arm_Friendly === 'Yes') reasons.push('arm comfort');
  if (m.tags.some((t) => t.includes('great at net'))) reasons.push('strong volleys');

  if (reasons.length)
    out.push(`Right for you because it matches ${reasons.slice(0, 4).join(', ')}.`);

  const nuance: string[] = [];
  if (r.String_Pattern === '18x20')
    nuance.push(
      `the dense 18×20 pattern keeps the ball on a string for ${
        ctx.style === 'Control Baseliner' ? 'your flat depth' : 'predictable depth'
      }`
    );
  else if (r.String_Pattern === '16x19')
    nuance.push(
      `the 16×19 pattern bites the ball for ${
        ctx.style === 'Aggressive Baseliner'
          ? "the heavy spin you're producing"
          : 'natural shape'
      }`
    );
  else if (r.String_Pattern === '16x18' || r.String_Pattern === '18x16')
    nuance.push('the unconventional pattern adds snapback for extra spin');
  if (r.Stiffness_RA <= 62) nuance.push(`the flexible RA ${r.Stiffness_RA} layup is easy on the arm`);
  else if (r.Stiffness_RA >= 70)
    nuance.push(`the stiff RA ${r.Stiffness_RA} frame gives you free pace on contact`);
  if (nuance.length) out.push(`Plus, ${nuance.slice(0, 2).join('; ')}.`);

  return out.join(' ');
}

function personalityLabel(ctx: {
  style: string;
  levelIdx: number;
  swingIdx: number;
  arm: 'Yes' | 'any';
  volley: number;
}): { label: string; blurb: string } {
  const { style: s } = ctx;
  const lv = ctx.levelIdx;
  const sw = ctx.swingIdx;
  const vol = ctx.volley;
  if (s === 'Aggressive Baseliner' && sw >= 4 && lv >= 4)
    return {
      label: 'The Spin King 👑',
      blurb: 'Heavy ball, big shape, run-around forehands. You bring the fireworks.'
    };
  if (s === 'Aggressive Baseliner')
    return {
      label: 'The Baseliner Beast 💪',
      blurb: 'Big cuts, big spin, big intentions. Everything starts from the back.'
    };
  if (s === 'Control Baseliner')
    return {
      label: 'The Tactician 🎯',
      blurb: 'Flat, deep, redirective. You win by moving the other player around.'
    };
  if (s === 'Serve-Volley')
    return {
      label: 'The Net Hawk 🦅',
      blurb: 'Short points, soft hands, classic style. The court shrinks when you close.'
    };
  if (lv <= 1)
    return {
      label: 'The Rising Star 🌟',
      blurb:
        "You're at the start of the curve — pick a forgiving frame and grow into the spin game."
    };
  if (ctx.arm === 'Yes')
    return {
      label: 'The Smart Player 🧠',
      blurb:
        'You picked comfort. Most players regret not doing this until they are injured.'
    };
  if (s === 'All-Court' && lv >= 4)
    return {
      label: 'The All-Court Surgeon 🩺',
      blurb: 'Pattern, footwork, variety. Hard to play against — easy to admire.'
    };
  if (s === 'All-Court' && vol >= 3)
    return {
      label: 'The Modern Allrounder 🎾',
      blurb: 'Comfortable everywhere on the court. The most adaptable archetype in tennis.'
    };
  return {
    label: 'The Player 🎾',
    blurb: 'Solid foundation, open game. The right frame will sharpen everything.'
  };
}

type DraftEnriched = RankedDraft & {
  string?: TennisString | null;
  tension?: number | null;
  matchScore?: number;
  why?: string;
};

function runFilters(
  rackets: Racket[],
  budget: number,
  gripIdx: number,
  arm: 'Yes' | 'any',
  style: string,
  volley: number,
  targetWeight: number,
  notes: ParsedNotes,
  playerLevelIdx: number,
  playerSwingIdx: number,
  opts: { budget?: boolean; grip?: boolean; arm?: boolean; level?: boolean; swing?: boolean }
): RankedDraft[] {
  function scoreOne(r: Racket): RankedDraft {
    const lvlR = rangeOf(r.Skill_Level, LEVEL_ORDER as unknown as readonly string[]);
    const swR = rangeOf(r.Swing_Speed_Fit, SWING_ORDER as unknown as readonly string[]);
    const lvlDist = distanceTo(playerLevelIdx, lvlR);
    const swDist = distanceTo(playerSwingIdx, swR);

    const lvlPts = lvlDist === 0 ? 35 : Math.max(0, 18 - lvlDist * 5);
    const swPts = swDist === 0 ? 25 : Math.max(0, 12 - swDist * 4);
    const stylePts = styleScore(style, r.Play_Style_Fit) * 12;
    const wDelta = Math.abs(r.Weight_Strung_oz - targetWeight);
    const wPts = Math.max(0, 14 - wDelta * 14);
    const armPts = r.Arm_Friendly === 'Yes' ? 2 : 0;

    let volleyPts = 0;
    if (volley >= 3) {
      const balPts = (r.Balance_pts || '').match(/(\d+)\s*HL/);
      const hl = balPts ? +balPts[1] : 0;
      if (hl >= 6) volleyPts += 5;
      if (r.Swingweight && r.Swingweight <= 320) volleyPts += 4;
      if (style === 'Serve-Volley') volleyPts += 4;
    }

    let noteFramePts = 0;
    for (const k of Object.keys(notes.boostFrame)) {
      if ((r.Frame_Type || '').includes(k)) noteFramePts += notes.boostFrame[k]!;
    }
    let brandPts = 0;
    if (notes.brandPref && r.Brand.toLowerCase() === notes.brandPref) brandPts = 10;

    const score =
      lvlPts + swPts + stylePts + wPts + armPts + volleyPts + noteFramePts + brandPts;

    const tags: string[] = [];
    if (lvlDist === 0) tags.push('✓ matches your level');
    else tags.push(`⚠ best for ${r.Skill_Level.toLowerCase()}`);
    if (swDist === 0) tags.push('✓ matches your swing');
    else if (swDist === 1) tags.push('· near your swing speed');
    else tags.push(`⚠ tuned for ${r.Swing_Speed_Fit.toLowerCase()}`);
    if (stylePts >= 18) tags.push('✓ ideal for your style');
    else if (stylePts >= 12) tags.push('· compatible style');
    if (wDelta < 0.3) tags.push(`✓ weight fits (${r.Weight_Strung_oz.toFixed(1)}oz)`);
    if (r.Arm_Friendly === 'Yes') tags.push('· arm-friendly');
    if (volleyPts >= 8) tags.push('✓ great at net');
    if (brandPts) tags.push(`✓ ${notes.brandPref} brand`);
    notes.extraTags.forEach((t) => tags.push(t));

    return { r, score, tags, lvlDist, swDist };
  }

  return rackets
    .map((r) => {
      if (opts.budget && r.Price_USD > budget) return null;
      if (opts.grip && !gripFits(gripIdx, r.Grip_Size_Range)) return null;
      if (opts.arm && arm === 'Yes' && r.Arm_Friendly !== 'Yes') return null;
      const m = scoreOne(r);
      if (opts.level && m.lvlDist > 1) return null;
      if (opts.swing && m.swDist > 1) return null;
      return m;
    })
    .filter((x): x is RankedDraft => x != null)
    .sort((a, b) => b.score - a.score);
}

export function computeRecommendation(
  input: RecommendationPayload,
  catalog: CatalogBundle
): RecommendationResult {
  const meta = catalog.meta;

  let heightIn = parseFloat(String(input.heightIn));
  let weightLb = parseFloat(String(input.weightLb));
  const gripIdx = +input.gripIdx;
  const levelStr = input.level;
  const swingStr = input.swing;
  const style = input.style;
  const volley = +input.volley;
  let arm: 'Yes' | 'any' = input.arm === 'Yes' ? 'Yes' : 'any';
  const utrRaw =
    input.utr !== undefined && input.utr !== ''
      ? parseFloat(String(input.utr))
      : Number.NaN;
  const ustaRaw =
    input.usta !== undefined && input.usta !== ''
      ? parseFloat(String(input.usta))
      : Number.NaN;
  let budget = +input.budget;
  const stringPref = input.stringPref;
  const notesText = input.notesText ?? '';

  if (Number.isNaN(heightIn) || Number.isNaN(weightLb)) {
    return { ok: false, error: 'Height and weight are required.' };
  }

  const notes = parseNotes(notesText);
  if (notes.forceArmFriendly) arm = 'Yes';
  if (notes.budgetCap != null && notes.budgetCap < budget) budget = notes.budgetCap;

  const baseLevelIdx = LEVEL_ORDER.indexOf(levelStr as (typeof LEVEL_ORDER)[number]);
  if (baseLevelIdx < 0) return { ok: false, error: 'Invalid skill level.' };
  const playerLevelIdx = refineLevelIdx(baseLevelIdx, utrRaw, ustaRaw);
  const playerSwingIdx = SWING_ORDER.indexOf(swingStr as (typeof SWING_ORDER)[number]);
  if (playerSwingIdx < 0) return { ok: false, error: 'Invalid swing speed.' };

  const targetWeight = idealRacketWeight(heightIn, weightLb) + notes.weightDelta;

  let scored = runFilters(
    catalog.rackets,
    budget,
    gripIdx,
    arm,
    style,
    volley,
    targetWeight,
    notes,
    playerLevelIdx,
    playerSwingIdx,
    { budget: true, grip: true, arm: true, level: true, swing: true }
  );
  const relaxations: string[] = [];

  if (!scored.length && arm === 'Yes') {
    scored = runFilters(
      catalog.rackets,
      budget,
      gripIdx,
      arm,
      style,
      volley,
      targetWeight,
      notes,
      playerLevelIdx,
      playerSwingIdx,
      { budget: true, grip: true, arm: false, level: true, swing: true }
    );
    if (scored.length)
      relaxations.push('no arm-friendly frames matched — showing closest options');
  }
  if (!scored.length) {
    scored = runFilters(
      catalog.rackets,
      budget,
      gripIdx,
      arm,
      style,
      volley,
      targetWeight,
      notes,
      playerLevelIdx,
      playerSwingIdx,
      { budget: false, grip: true, arm: false, level: true, swing: true }
    );
    if (scored.length) relaxations.push('expanded budget — best in-spec options shown');
  }
  if (!scored.length) {
    scored = runFilters(
      catalog.rackets,
      budget,
      gripIdx,
      arm,
      style,
      volley,
      targetWeight,
      notes,
      playerLevelIdx,
      playerSwingIdx,
      { budget: false, grip: false, arm: false, level: true, swing: true }
    );
    if (scored.length)
      relaxations.push(
        'grip range expanded — most rackets come in multiple sizes anyway'
      );
  }
  if (!scored.length) {
    scored = runFilters(
      catalog.rackets,
      budget,
      gripIdx,
      arm,
      style,
      volley,
      targetWeight,
      notes,
      playerLevelIdx,
      playerSwingIdx,
      {}
    );
    relaxations.push(
      'showing the closest frames overall — try widening your level/swing range for stricter fits'
    );
  }

  scored.forEach((m) => {
    if (m.r.Price_USD > budget) m.tags.push(`⚠ $${m.r.Price_USD - budget} over budget`);
    if (arm === 'Yes' && m.r.Arm_Friendly !== 'Yes')
      m.tags.push('⚠ not arm-friendly');
    if (!gripFits(gripIdx, m.r.Grip_Size_Range))
      m.tags.push(`⚠ grips ${m.r.Grip_Size_Range}`);
  });

  const topRaw = scored.slice(0, 3) as DraftEnriched[];
  const playerCtxStr = {
    swingIdx: playerSwingIdx,
    levelIdx: playerLevelIdx,
    weightLb
  };

  const whyCtx = {
    level: levelStr,
    swing: swingStr,
    style,
    arm,
    targetWeight
  };

  for (const m of topRaw) {
    const s = pickString(
      catalog.strings,
      m.r,
      playerLevelIdx,
      playerSwingIdx,
      style,
      arm,
      stringPref
    );
    m.string = s;
    m.tension = s ? recommendedTension(s, m.r, playerCtxStr) : null;
    m.matchScore = normalizedScore(m.score);
    m.why = whyRacket(m, meta.racketBlurbs, whyCtx);
  }

  const volleyLabel = ['', 'weak', 'developing', 'solid', 'strong'][volley] || 'developing';
  const persona = personalityLabel({
    style,
    levelIdx: playerLevelIdx,
    swingIdx: playerSwingIdx,
    arm,
    volley
  });

  const summary: RecommendationSummary = {
    heightIn,
    weightLb,
    gripIdx,
    level: levelStr,
    swing: swingStr,
    style,
    volley,
    volleyLabel,
    arm,
    budget,
    stringPref,
    notesText,
    parsedTags: notes.extraTags,
    targetWeight
  };
  if (Number.isFinite(utrRaw)) summary.utr = utrRaw;
  if (Number.isFinite(ustaRaw)) summary.usta = ustaRaw;

  const picks: PickResult[] = topRaw.map((m) => ({
    racket: m.r,
    string: m.string ?? null,
    tension: m.tension ?? null,
    matchScore: m.matchScore!,
    tags: m.tags,
    why: m.why!,
    photoUrl: racketPhotoUrl(meta, m.r.Racket_ID),
    buyRacketUrl: buyURL(meta, m.r.Brand, m.r.Model, m.r.Racket_ID),
    buyStringUrl: m.string ? buyStringURL(m.string.Brand, m.string.Model) : null,
    fallbackSvg: racketSVG(m.r.Brand, meta.brandColors)
  }));

  return {
    ok: true,
    persona,
    relaxations,
    iconicCombos: meta.iconicCombos,
    picks,
    summary
  };
}
