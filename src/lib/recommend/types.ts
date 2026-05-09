import type { IconicCombo, Racket, TennisString } from '@/lib/catalog/types';

export interface RecommendationPayload {
  heightIn: number | string;
  weightLb: number | string;
  gripIdx: number | string;
  level: string;
  swing: string;
  style: string;
  volley: number | string;
  arm?: string;
  utr?: number | string;
  usta?: number | string;
  budget: number | string;
  stringPref: string;
  notesText?: string;
}

export interface RecommendationSummary {
  heightIn: number;
  weightLb: number;
  gripIdx: number;
  level: string;
  swing: string;
  style: string;
  volley: number;
  volleyLabel: string;
  arm: 'Yes' | 'any';
  utr?: number;
  usta?: number;
  budget: number;
  stringPref: string;
  notesText: string;
  parsedTags: string[];
  targetWeight: number;
}

export interface PickResult {
  racket: Racket;
  string: TennisString | null;
  tension: number | null;
  matchScore: number;
  tags: string[];
  why: string;
  photoUrl: string | null;
  buyRacketUrl: string;
  buyStringUrl: string | null;
  /** Raw SVG markup for fallback when TW image fails */
  fallbackSvg: string;
}

export interface RecommendationSuccess {
  ok: true;
  persona: { label: string; blurb: string };
  relaxations: string[];
  iconicCombos: IconicCombo[];
  picks: PickResult[];
  summary: RecommendationSummary;
}

export interface RecommendationFailure {
  ok: false;
  error: string;
}

export type RecommendationResult = RecommendationSuccess | RecommendationFailure;

/** Internal scorer row before string pick */
export interface RankedDraft {
  r: Racket;
  score: number;
  tags: string[];
  lvlDist: number;
  swDist: number;
}

export interface ParsedNotes {
  weightDelta: number;
  forceArmFriendly: boolean;
  budgetCap: number | null;
  boostFrame: Record<string, number>;
  brandPref: string | null;
  extraTags: string[];
}
