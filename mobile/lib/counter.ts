const COUNTER_URL = 'https://abacus.jasoncameron.dev';
const COUNTER_NS = 'racket-iq';
const COUNTER_KEY = 'finds';

export async function loadPlayerCount(): Promise<number | null> {
  try {
    const r = await fetch(`${COUNTER_URL}/get/${COUNTER_NS}/${COUNTER_KEY}`);
    if (r.status === 404) return 0;
    if (!r.ok) return null;
    const data = (await r.json()) as { value: number };
    return data.value;
  } catch {
    return null;
  }
}

export async function bumpPlayerCount(): Promise<number | null> {
  try {
    const r = await fetch(`${COUNTER_URL}/hit/${COUNTER_NS}/${COUNTER_KEY}`);
    if (!r.ok) return null;
    const data = (await r.json()) as { value: number };
    return data.value;
  } catch {
    return null;
  }
}
