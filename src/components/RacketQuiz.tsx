'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RecommendationPayload,
  RecommendationSuccess
} from '@/lib/recommend/types';
import { buildRecommendationMailto } from '@/lib/mailto';
import { buildShareUrlFromForm, copyShareLink } from '@/lib/share-link';
import { RecommendationResults } from './RecommendationResults';

const COUNTER_URL = 'https://abacus.jasoncameron.dev';
const COUNTER_NS = 'racket-iq';
const COUNTER_KEY = 'finds';

function renderCounter(n: number): void {
  const wrap = document.getElementById('player-counter');
  if (!wrap || typeof n !== 'number') return;
  const pc = document.getElementById('player-count');
  const ps = document.getElementById('player-suffix');
  if (pc) pc.textContent = n.toLocaleString();
  if (ps) ps.textContent = n === 1 ? 'player' : 'players';
  wrap.hidden = false;
}

async function loadCounter(): Promise<void> {
  try {
    const r = await fetch(`${COUNTER_URL}/get/${COUNTER_NS}/${COUNTER_KEY}`);
    if (!r.ok) {
      if (r.status === 404) renderCounter(0);
      return;
    }
    const data = (await r.json()) as { value: number };
    renderCounter(data.value);
  } catch {
    /* offline */
  }
}

async function bumpCounter(): Promise<void> {
  try {
    const r = await fetch(`${COUNTER_URL}/hit/${COUNTER_NS}/${COUNTER_KEY}`);
    if (!r.ok) return;
    const data = (await r.json()) as { value: number };
    renderCounter(data.value);
    const wrap = document.getElementById('player-counter');
    if (wrap) {
      wrap.classList.remove('bumped');
      void wrap.offsetWidth;
      wrap.classList.add('bumped');
    }
  } catch {
    /* */
  }
}

export function RacketQuiz() {
  const formRef = useRef<HTMLFormElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<RecommendationSuccess | null>(null);
  const [busy, setBusy] = useState(false);

  const readPayload = useCallback((): RecommendationPayload | null => {
    const root = formRef.current;
    if (!root) return null;

    const gv = (id: string) =>
      (
        root.querySelector(
          `#${id}`
        ) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
      )?.value?.trim() ?? '';

    const heightIn = parseFloat(gv('height'));
    const weightLb = parseFloat(gv('weight'));
    if (Number.isNaN(heightIn) || Number.isNaN(weightLb)) {
      alert('Please enter height and weight.');
      return null;
    }

    return {
      heightIn,
      weightLb,
      gripIdx: gv('grip') || '2',
      level: gv('level') || 'Intermediate',
      swing: gv('swing') || 'Medium',
      style: gv('style') || 'All-Court',
      volley: gv('volley') || '2',
      arm: gv('arm') === 'Yes' ? 'Yes' : 'any',
      utr: gv('utr'),
      usta: gv('usta'),
      budget: gv('budget') || '250',
      stringPref: gv('stringpref') || 'auto',
      notesText: gv('notes')
    };
  }, []);

  const recommend = useCallback(
    async (bump: boolean) => {
      const payload = readPayload();
      if (!payload) return;

      setBusy(true);
      try {
        const r = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = (await r.json()) as
          | RecommendationSuccess
          | { ok: false; error?: string };

        if (!r.ok || !('ok' in data) || !data.ok) {
          alert(
            'error' in data ? data.error ?? 'Request failed' : 'Request failed'
          );
          return;
        }

        setResult(data);
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        if (bump) void bumpCounter();
      } catch {
        alert('Could not reach the server. Try again.');
      } finally {
        setBusy(false);
      }
    },
    [readPayload]
  );

  const onEmailResults = useCallback(() => {
    if (!result || !formRef.current) return;
    const emailInput = formRef.current.querySelector('#email') as HTMLInputElement;
    let addr = emailInput.value.trim();

    if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      const entered = window.prompt(
        'Enter the email address to send your recommendation to:'
      );
      if (!entered) return;
      emailInput.value = entered;
      addr = entered.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
        alert("That doesn't look like a valid email.");
        return;
      }
    }

    window.location.href = buildRecommendationMailto(
      addr,
      result,
      buildShareUrlFromForm(formRef.current)
    );
  }, [result]);

  const recommendAndEmail = useCallback(async () => {
    const email =
      (
        formRef.current?.querySelector('#email') as HTMLInputElement | null
      )?.value?.trim() ?? '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Enter a valid email above first, then hit Find & Email.');
      formRef.current?.querySelector<HTMLInputElement>('#email')?.focus();
      return;
    }

    const payload = readPayload();
    if (!payload) return;

    setBusy(true);
    try {
      const r = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await r.json()) as RecommendationSuccess | {
        ok: false;
        error?: string;
      };

      if (!r.ok || !('ok' in data) || !data.ok) {
        alert('error' in data ? data.error ?? 'Request failed' : 'Request failed');
        return;
      }

      setResult(data);

      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      void bumpCounter();

      if (!formRef.current) return;
      window.location.href = buildRecommendationMailto(
        email,
        data,
        buildShareUrlFromForm(formRef.current)
      );
    } catch {
      alert('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }, [readPayload]);

  const onCopyShare = useCallback((btn: HTMLButtonElement) => {
    const form = formRef.current;
    if (!form) return;
    void copyShareLink(form, btn);
  }, []);

  useEffect(() => {
    void loadCounter();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hash.slice(1);
    if (!h) return;

    const params = new URLSearchParams(h);
    let ran = false;
    for (const [k, v] of params) {
      const el = document.getElementById(k) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      if (el) {
        el.value = v;
        ran = true;
      }
    }

    if (ran && params.has('level'))
      setTimeout(() => void recommend(true), 100);
  }, [recommend]);

  return (
    <>
      <header className="hero">
        <svg
          className="court-bg"
          viewBox="0 0 800 350"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="800" height="350" fill="#2d6e3e" />
          <rect
            x="60"
            y="40"
            width="680"
            height="270"
            fill="none"
            stroke="#f4f1de"
            strokeWidth="3"
          />
          <line
            x1="120"
            y1="40"
            x2="120"
            y2="310"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="680"
            y1="40"
            x2="680"
            y2="310"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="220"
            y1="40"
            x2="220"
            y2="310"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="580"
            y1="40"
            x2="580"
            y2="310"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="220"
            y1="175"
            x2="580"
            y2="175"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="60"
            y1="175"
            x2="80"
            y2="175"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="720"
            y1="175"
            x2="740"
            y2="175"
            stroke="#f4f1de"
            strokeWidth="2"
          />
          <line
            x1="400"
            y1="40"
            x2="400"
            y2="310"
            stroke="#fff"
            strokeWidth="4"
            strokeDasharray="3,4"
            opacity="0.85"
          />
          <circle
            cx="290"
            cy="175"
            r="10"
            fill="#d4ee5c"
            stroke="#fff"
            strokeWidth="1.5"
          />
        </svg>

        <div
          className="coach-badge"
          title="Algorithm reviewed by USPTA-certified coaches"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 2 l2.4 5 5.5.8 -4 3.9 1 5.5 -4.9 -2.6 -4.9 2.6 1 -5.5 -4 -3.9 5.5 -.8z" />
          </svg>
          <div>
            <strong>Backed by USPTA-certified coaches</strong>
          </div>
        </div>

        <div className="hero-inner">
          <div className="ball-icon" aria-hidden />
          <h1>Racket IQ</h1>
          <p>Find your perfect racket + string combo</p>
          <div className="player-counter" id="player-counter" hidden>
            <span className="counter-pulse" />
            <span className="counter-text">
              Used by <strong id="player-count">…</strong>{' '}
              <span id="player-suffix">players</span>
            </span>
          </div>
        </div>
      </header>

      <main>
        <form
          ref={formRef}
          className="card"
          id="racket-form"
          onSubmit={(e) => {
            e.preventDefault();
            void recommend(true);
          }}
        >
          <fieldset>
            <legend>About you</legend>
            <div className="grid-3">
              <div>
                <label>
                  Height <span className="hint">in</span>
                </label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  min={48}
                  max={84}
                  defaultValue={70}
                  step={1}
                  required
                />
              </div>
              <div>
                <label>
                  Weight <span className="hint">lb</span>
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min={60}
                  max={350}
                  defaultValue={160}
                  step={1}
                  required
                />
              </div>
              <div>
                <label>Grip Size</label>
                <select id="grip" name="grip" defaultValue="2">
                  <option value="0">L0 / 4″ — small</option>
                  <option value="1">L1 / 4 ⅛″</option>
                  <option value="2">L2 / 4 ¼″</option>
                  <option value="3">L3 / 4 ⅜″</option>
                  <option value="4">L4 / 4 ½″</option>
                  <option value="5">L5 / 4 ⅝″ — large</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Your game</legend>
            <div className="grid">
              <div>
                <label>Skill Level</label>
                <select id="level" name="level" defaultValue="Intermediate">
                  <option value="Beginner">Beginner — just starting</option>
                  <option value="Beginner/Intermediate">
                    Beginner / Intermediate
                  </option>
                  <option value="Intermediate">
                    Intermediate — solid rallies
                  </option>
                  <option value="Intermediate/Advanced">
                    Intermediate / Advanced
                  </option>
                  <option value="Advanced">
                    Advanced — full strokes, spin, control
                  </option>
                  <option value="Advanced/Pro">Advanced / Pro</option>
                  <option value="Pro">Pro level</option>
                </select>
              </div>
              <div>
                <label>Swing Speed</label>
                <select id="swing" name="swing" defaultValue="Medium">
                  <option value="Slow">Slow — short, compact</option>
                  <option value="Slow/Medium">Slow / Medium</option>
                  <option value="Medium">Medium — full extension</option>
                  <option value="Medium/Fast">Medium / Fast</option>
                  <option value="Fast">Fast — long, aggressive</option>
                  <option value="Very Fast">Very Fast — explosive</option>
                </select>
              </div>
            </div>
            <div className="grid" style={{ marginTop: '0.9rem' }}>
              <div>
                <label>Game Style</label>
                <select id="style" name="style" defaultValue="All-Court">
                  <option value="All-Court">All-Court — versatile</option>
                  <option value="Baseliner">Baseliner — rally from back</option>
                  <option value="Aggressive Baseliner">
                    Aggressive Baseliner — big spin/power
                  </option>
                  <option value="Control Baseliner">
                    Control Baseliner — flat, precise
                  </option>
                  <option value="Serve-Volley">
                    Serve + Volley — attack the net
                  </option>
                </select>
              </div>
              <div>
                <label>Volley Skill</label>
                <select id="volley" name="volley" defaultValue="2">
                  <option value="1">Weak — avoid the net</option>
                  <option value="2">Developing — sometimes</option>
                  <option value="3">Solid — comfortable closing</option>
                  <option value="4">Strong — finish at net often</option>
                </select>
              </div>
            </div>
            <div className="grid" style={{ marginTop: '0.9rem' }}>
              <div>
                <label>Arm-Friendly Frames Only?</label>
                <select id="arm" name="arm" defaultValue="any">
                  <option value="any">No preference</option>
                  <option value="Yes">
                    Yes — comfort matters (tennis elbow, etc)
                  </option>
                </select>
              </div>
              <div />
            </div>
          </fieldset>

          <fieldset>
            <legend>Ratings (optional)</legend>
            <div className="grid">
              <div>
                <label>
                  UTR <span className="hint">1–16.5</span>
                </label>
                <input
                  id="utr"
                  name="utr"
                  type="number"
                  min={1}
                  max={16.5}
                  step={0.1}
                  placeholder="e.g. 5.5"
                />
              </div>
              <div>
                <label>
                  USTA Rating <span className="hint">1.0–5.5+</span>
                </label>
                <input
                  id="usta"
                  name="usta"
                  type="number"
                  min={1}
                  max={7}
                  step={0.5}
                  placeholder="e.g. 3.5"
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Budget & strings</legend>
            <div className="grid">
              <div>
                <label>
                  Max Racket Price <span className="hint">USD MSRP</span>
                </label>
                <select id="budget" name="budget" defaultValue="250">
                  <option value="999">No limit</option>
                  <option value="200">Under $200</option>
                  <option value="230">Under $230</option>
                  <option value="250">Under $250</option>
                  <option value="270">Under $270</option>
                </select>
              </div>
              <div>
                <label>String Preference</label>
                <select id="stringpref" name="stringpref" defaultValue="auto">
                  <option value="auto">Recommend automatically</option>
                  <option value="Polyester">
                    Poly — control + spin (durable, harsh)
                  </option>
                  <option value="Multifilament">
                    Multi — comfort + power (soft on arm)
                  </option>
                  <option value="Hybrid">Hybrid — best of both</option>
                  <option value="Natural Gut">
                    Natural Gut — premium feel
                  </option>
                  <option value="Synthetic Gut">
                    Synthetic Gut — beginner all-rounder
                  </option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              Other notes{' '}
              <span
                className="hint"
                style={{ textTransform: 'none', letterSpacing: 0 }}
              >
                optional — anything specific?
              </span>
            </legend>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="e.g. ‘I want more spin and a lighter frame’ · ‘tennis elbow, need comfort’ · ‘prefer Yonex’ · ‘flat hitter, control matters’ · ‘great touch at net’"
            />
          </fieldset>

          <fieldset>
            <legend>
              Email me the results{' '}
              <span
                className="hint"
                style={{ textTransform: 'none', letterSpacing: 0 }}
              >
                optional — opens your mail app with your top 3 ready to send
              </span>
            </legend>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'stretch',
                flexWrap: 'wrap'
              }}
            >
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                style={{ flex: 1, minWidth: 200 }}
              />
              <button
                type="button"
                className="email-inline"
                onClick={() => void recommendAndEmail()}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                Find & Email
              </button>
            </div>
          </fieldset>

          <button className="go" type="submit" disabled={busy}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12 q 9 -9 18 0" />
              <path d="M3 12 q 9 9 18 0" />
            </svg>
            Find My Racket + String
          </button>
        </form>

        <div
          ref={resultsRef}
          className={`results${result ? ' show' : ''}`}
          id="results"
        >
          {result ? (
            <RecommendationResults
              data={result}
              onEmailResults={onEmailResults}
              onCopyShareLink={onCopyShare}
            />
          ) : null}
        </div>
      </main>

      <section className="slams" aria-label="Grand Slam tournaments">
        <div className="slam-row">
          <a
            className="slam ao"
            href="https://ausopen.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Australian Open · Hard court"
          >
            <div className="slam-ball" />
            <div className="slam-text">
              <strong>Australian Open</strong>
              <span>Melbourne · January</span>
            </div>
          </a>
          <a
            className="slam rg"
            href="https://www.rolandgarros.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Roland-Garros · Clay"
          >
            <div className="slam-ball" />
            <div className="slam-text">
              <strong>Roland-Garros</strong>
              <span>Paris · May–June</span>
            </div>
          </a>
          <a
            className="slam wb"
            href="https://www.wimbledon.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Wimbledon · Grass"
          >
            <div className="slam-ball" />
            <div className="slam-text">
              <strong>Wimbledon</strong>
              <span>London · June–July</span>
            </div>
          </a>
          <a
            className="slam us"
            href="https://www.usopen.org"
            target="_blank"
            rel="noopener noreferrer"
            title="US Open · Hard court"
          >
            <div className="slam-ball" />
            <div className="slam-text">
              <strong>US Open</strong>
              <span>New York · August–September</span>
            </div>
          </a>
        </div>
      </section>

      <footer>
        Built from{' '}
        <a href="https://github.com/kedarsnd-ai/racket-recommender">
          tennis_equipment_database.xlsx
        </a>{' '}
        · prices are approximate MSRP
        <br />
        Product photos courtesy of{' '}
        <a
          href="https://www.tennis-warehouse.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tennis Warehouse
        </a>
        . Buy links go to TW product pages where available.
      </footer>
    </>
  );
}
