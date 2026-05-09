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

export interface TennisString {
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

export interface BrandPalette {
  frame: string;
  grip: string;
  accent: string;
}

/** Curated racket blurbs by Racket_ID */
export type RacketBlurbs = Record<string, string>;

/** TW image codes */
export type TwImgMap = Record<string, string>;

export type TwPageMap = Record<string, string>;

export type BrandColors = Record<string, BrandPalette>;

export interface CatalogMeta {
  iconicCombos: IconicCombo[];
  twImg: TwImgMap;
  twPage: TwPageMap;
  racketBlurbs: RacketBlurbs;
  brandColors: BrandColors;
}

export interface CatalogBundle {
  rackets: Racket[];
  strings: TennisString[];
  meta: CatalogMeta;
}
