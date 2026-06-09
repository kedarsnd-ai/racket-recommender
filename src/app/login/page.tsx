'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) {
      setError(error.message);
    } else {
      setSignupDone(true);
    }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        .auth-page {
          min-height: 100vh;
          background: #0d2418;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .auth-logo {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.8rem;
          text-decoration: none;
        }
        .auth-ball {
          width: 52px; height: 52px;
          background: radial-gradient(circle at 35% 30%, #f5ff9e, #d4ee5c 60%, #97b540 100%);
          border-radius: 50%;
          box-shadow: 0 0 28px rgba(212,238,92,0.45), inset -6px -6px 14px rgba(0,0,0,0.18);
          position: relative;
        }
        .auth-ball::before, .auth-ball::after {
          content: "";
          position: absolute;
          border: 1.5px solid rgba(255,255,255,0.85);
          border-radius: 50%;
        }
        .auth-ball::before { inset: -3px 25%; transform: rotate(-15deg); border-color: transparent rgba(255,255,255,0.85); }
        .auth-ball::after  { inset: 25% -3px; transform: rotate(-15deg); border-color: rgba(255,255,255,0.85) transparent; }
        .auth-title {
          font-size: 1.55rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
          margin: 0;
        }
        .auth-subtitle {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }
        .auth-card {
          background: #fff;
          border-radius: 20px;
          padding: 2rem 2rem 1.75rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        }
        .auth-tabs {
          display: flex;
          background: #f0f4f1;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 1.6rem;
          gap: 4px;
        }
        .auth-tab {
          flex: 1;
          padding: 0.55rem;
          border: none;
          border-radius: 7px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          background: transparent;
          color: #6b7a72;
          transition: background 0.15s, color 0.15s;
        }
        .auth-tab.active {
          background: #fff;
          color: #1d4e2a;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }
        .auth-field {
          margin-bottom: 1rem;
        }
        .auth-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #1d4e2a;
          margin-bottom: 0.35rem;
        }
        .auth-input {
          width: 100%;
          padding: 0.7rem 0.85rem;
          border: 1.5px solid #d4dcd6;
          border-radius: 10px;
          font-size: 0.97rem;
          font-family: inherit;
          background: #f9fbf9;
          color: #14211a;
          transition: border 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .auth-input:focus {
          outline: none;
          border-color: #2d6e3e;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45,110,62,0.15);
        }
        .auth-submit {
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(90deg, #1d4e2a, #2d6e3e);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 14px rgba(29,78,42,0.35);
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .auth-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(29,78,42,0.45); }
        .auth-submit:disabled { opacity: 0.7; cursor: wait; pointer-events: none; }
        .auth-error {
          background: #fff0f0;
          border: 1px solid #f5c6c6;
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          color: #c0392b;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .auth-success {
          background: #f0fff4;
          border: 1px solid #c8e6d0;
          border-radius: 12px;
          padding: 1.2rem;
          text-align: center;
          color: #1d4e2a;
        }
        .auth-success h3 { margin: 0 0 0.4rem; font-size: 1.1rem; }
        .auth-success p { margin: 0; font-size: 0.88rem; color: #44574b; }
        .auth-footer {
          text-align: center;
          color: rgba(255,255,255,0.45);
          font-size: 0.78rem;
          margin-top: 1.4rem;
        }
        @media (max-width: 440px) {
          .auth-card { padding: 1.5rem 1.2rem; }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-logo">
          <div className="auth-ball" />
          <h1 className="auth-title">Racket IQ</h1>
          <p className="auth-subtitle">Find your perfect racket + string combo</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
              onClick={() => { setTab('signin'); setError(''); setSignupDone(false); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); setSignupDone(false); }}
            >
              Create Account
            </button>
          </div>

          {signupDone ? (
            <div className="auth-success">
              <h3>Check your email!</h3>
              <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            </div>
          ) : tab === 'signin' ? (
            <form onSubmit={handleSignIn}>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  className="auth-input"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-field">
                <label className="auth-label">Name</label>
                <input
                  className="auth-input"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password <span style={{fontWeight:400,color:'#6b7a72',fontSize:'0.76rem'}}>min 6 chars</span></label>
                <input
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>
          )}
        </div>

        <p className="auth-footer">Your data is stored securely. We never sell your info.</p>
      </div>
    </>
  );
}
