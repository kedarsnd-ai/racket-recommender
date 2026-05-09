'use client';

import type { RecommendationSuccess } from '@/lib/recommend/types';
import { RacketThumbnail } from './RacketThumbnail';

interface Props {
  data: RecommendationSuccess;
  onEmailResults: () => void;
  onCopyShareLink: (button: HTMLButtonElement) => void;
}

export function RecommendationResults({
  data,
  onEmailResults,
  onCopyShareLink
}: Props) {
  const s = data.summary;
  const budgetDis = s.budget >= 999 ? 'no limit' : `$${s.budget}`;

  return (
    <div className="card">
      <div className="persona">
        <div className="persona-eyebrow">Your player profile</div>
        <div className="persona-label">{data.persona.label}</div>
        <div className="persona-blurb">{data.persona.blurb}</div>
      </div>

      {data.relaxations.length > 0 ? (
        <div className="relax-banner">
          <strong>Heads up —</strong> {data.relaxations.join(' · ')}.
        </div>
      ) : null}

      <div className="summary">
        <strong>Profile:</strong> {s.level}
        {s.utr != null ? ` · UTR ${s.utr}` : ''}
        {s.usta != null ? ` · USTA ${s.usta}` : ''}
        {` · ${s.swing} swing · ${s.style}`}
        {` · ${s.volleyLabel} volleys`}
        {` · grip L${s.gripIdx}`}
        {' · target weight '}
        <strong>{s.targetWeight.toFixed(1)} oz</strong>
        {` · budget ≤ ${budgetDis}`}
        {s.parsedTags.length > 0 ? (
          <>
            <br />
            <span style={{ fontSize: '0.82rem' }}>
              📝 {s.parsedTags.join(' · ')}
            </span>
          </>
        ) : null}
      </div>

      <div className="share-row">
        <button
          type="button"
          className="share-btn"
          onClick={(e) => onCopyShareLink(e.currentTarget)}
        >
          <ShareSvg />
          Copy share link
        </button>
        <span className="share-note">
          Anyone opening it sees the same form pre-filled with your inputs.
        </span>
      </div>

      <h2 className="section-title">Your top 3 setups</h2>
      {data.picks.map((pick, i) => {
        const r = pick.racket;
        const str = pick.string;

        return (
          <div key={`${r.Racket_ID}-${i}`} className={`pick ${i === 0 ? 'gold' : ''}`}>
            <span className="rank">
              {i === 0 ? '★ TOP COMBO' : `#${i + 1}`}
            </span>
            <div className="match-score" title="Match score">
              {pick.matchScore}
              <span>/100</span>
            </div>
            <div className="pick-head">
              <div className="pick-img">
                <RacketThumbnail
                  photoUrl={pick.photoUrl}
                  alt={`${r.Brand} ${r.Model}`}
                  fallbackSvg={pick.fallbackSvg}
                />
              </div>
              <div className="pick-meta">
                <div className="brand">{r.Brand}</div>
                <h3>
                  {r.Model}{' '}
                  <span className="yr">({r.Year})</span>
                </h3>
                <div className="price-line">
                  ${r.Price_USD}
                  <span className="price-note"> approx. MSRP</span>
                </div>
              </div>
            </div>

            <div className="specs">
              <span>
                <strong>{r.Weight_Strung_oz.toFixed(1)} oz</strong> strung
              </span>
              <span>{`${r.Head_Size_sqin}" head`}</span>
              <span>{r.String_Pattern}</span>
              <span>{r.Balance_pts}</span>
              <span>{`SW ${r.Swingweight}`}</span>
              <span>{`RA ${r.Stiffness_RA}`}</span>
              <span>{r.Frame_Type}</span>
            </div>

            <div className="why">
              <div className="why-label">Why this racket</div>
              {pick.why}
            </div>

            <div className="tags">
              {pick.tags.map((tag, ti) => (
                <span
                  key={`${r.Racket_ID}-${i}-${ti}-${tag.slice(0, 20)}`}
                  className={`tag${tag.startsWith('⚠') ? ' warn' : ''}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {str && pick.tension != null && pick.buyStringUrl ? (
              <div className="string-row">
                <div className="label">
                  Recommended string · custom-tuned tension
                </div>
                <div>
                  <span className="grade">{str.String_Type}</span>
                  <span className="name">
                    {str.Brand} {str.Model}
                  </span>
                </div>
                <div className="meta">
                  {str.Gauge_Name} gauge · {str.Gauge_mm} mm · tension{' '}
                  <strong>{pick.tension} lb</strong> (printed range{' '}
                  {str.Tension_Min_lbs}–{str.Tension_Max_lbs}) · spin{' '}
                  {str.Spin_Potential}/5 · power {str.Power_Level}/5 · control{' '}
                  {str.Control_Level}/5
                  {str.Arm_Friendly === 'Yes' ? ' · arm-friendly' : ''}
                </div>
                <a
                  className="buy-btn"
                  href={pick.buyStringUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy this string
                  <BuyIcon />
                </a>
              </div>
            ) : (
              <div className="string-row">
                <div className="label">String</div>
                <div className="meta">No matching string in DB.</div>
              </div>
            )}

            <a
              className="buy-btn primary"
              href={pick.buyRacketUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy this racket
              <BuyIcon />
            </a>
          </div>
        );
      })}

      <h2 className="section-title">Iconic pro combos</h2>
      <div className="combo-grid">
        {data.iconicCombos.map((c) => (
          <div key={`${c.who}-${c.pair.slice(0, 24)}`} className="combo">
            <div className="who">{c.who}</div>
            <div className="pair">{c.pair}</div>
            <div className="why">{c.why}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '1.4rem',
          paddingTop: '1.2rem',
          borderTop: '1px dashed #d4dcd6'
        }}
      >
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Send me my results
        </h2>
        <p
          style={{
            margin: '0 0 0.7rem',
            fontSize: '0.88rem',
            color: 'var(--muted)'
          }}
        >
          Opens your mail app with the top 3 picks, your inputs, and product
          links pre-filled.
        </p>
        <button type="button" className="email-btn" onClick={onEmailResults}>
          <EmailSvg />
          Email me these results
        </button>
      </div>
    </div>
  );
}

function BuyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7 h9 v9" />
    </svg>
  );
}

function ShareSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.6 10.5l6.8-3" />
      <path d="M8.6 13.5l6.8 3" />
    </svg>
  );
}

function EmailSvg() {
  return (
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
  );
}
