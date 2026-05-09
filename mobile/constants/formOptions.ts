export const GRIP_ITEMS = [
  { label: 'L0 — small', value: '0' },
  { label: 'L1 · 4 ⅛″', value: '1' },
  { label: 'L2 · 4 ¼″', value: '2' },
  { label: 'L3 · 4 ⅜″', value: '3' },
  { label: 'L4 · 4 ½″', value: '4' },
  { label: 'L5 · large', value: '5' }
] as const;

export const LEVEL_ITEMS = [
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Beginner / Intermediate', value: 'Beginner/Intermediate' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Intermediate / Advanced', value: 'Intermediate/Advanced' },
  { label: 'Advanced', value: 'Advanced' },
  { label: 'Advanced / Pro', value: 'Advanced/Pro' },
  { label: 'Pro level', value: 'Pro' }
] as const;

export const SWING_ITEMS = [
  { label: 'Slow', value: 'Slow' },
  { label: 'Slow / Medium', value: 'Slow/Medium' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Medium / Fast', value: 'Medium/Fast' },
  { label: 'Fast', value: 'Fast' },
  { label: 'Very Fast', value: 'Very Fast' }
] as const;

export const STYLE_ITEMS = [
  { label: 'All-Court', value: 'All-Court' },
  { label: 'Baseliner', value: 'Baseliner' },
  { label: 'Aggressive Baseliner', value: 'Aggressive Baseliner' },
  { label: 'Control Baseliner', value: 'Control Baseliner' },
  { label: 'Serve + Volley', value: 'Serve-Volley' }
] as const;

export const VOLLEY_ITEMS = [
  { label: 'Weak', value: '1' },
  { label: 'Developing', value: '2' },
  { label: 'Solid', value: '3' },
  { label: 'Strong', value: '4' }
] as const;

export const ARM_ITEMS = [
  { label: 'No preference', value: 'any' },
  { label: 'Yes — comfort matters', value: 'Yes' }
] as const;

export const BUDGET_ITEMS = [
  { label: 'No limit', value: '999' },
  { label: 'Under $200', value: '200' },
  { label: 'Under $230', value: '230' },
  { label: 'Under $250', value: '250' },
  { label: 'Under $270', value: '270' }
] as const;

export const STRING_PREF_ITEMS = [
  { label: 'Recommend automatically', value: 'auto' },
  { label: 'Polyester', value: 'Polyester' },
  { label: 'Multifilament', value: 'Multifilament' },
  { label: 'Hybrid', value: 'Hybrid' },
  { label: 'Natural Gut', value: 'Natural Gut' },
  { label: 'Synthetic Gut', value: 'Synthetic Gut' }
] as const;
