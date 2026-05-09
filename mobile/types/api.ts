/** Mirrors `src/lib/recommend/types` + catalog rows for typed API responses */

export interface Racket {
  Racket_ID: string;
  Brand: string;
  Model: string;
  Year: string;
  Weight_Strung_oz: number;
  Head_Size_sqin: number;
  Beam_Width_mm: string;
  Balance_pts: string;
  Swingweight: number;
  Stiffness_RA: number;
  String_Pattern: string;
  Frame_Type: string;
  Skill_Level: string;
  Swing_Speed_Fit: string;
  Play_Style_Fit: string;
  Arm_Friendly: string;
  Grip_Size_Range: string;
  Price_USD: number;
}

export interface TennisStringRow {
  String_ID: string;
  Brand: string;
  Model: string;
  String_Type: string;
  Gauge_Name: string;
  Gauge_mm: string;
  Tension_Min_lbs: number;
  Tension_Max_lbs: number;
  Stiffness: string;
  Spin_Potential: number;
  Power_Level: number;
  Control_Level: number;
  Durability: number;
  Arm_Friendly: string;
  Feel: string;
  Best_For_Play_Style: string;
  Best_For_Skill: string;
  Best_For_Swing_Speed: string;
}

export interface IconicCombo {
  who: string;
  pair: string;
  why: string;
}

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
  string: TennisStringRow | null;
  tension: number | null;
  matchScore: number;
  tags: string[];
  why: string;
  photoUrl: string | null;
  buyRacketUrl: string;
  buyStringUrl: string | null;
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
