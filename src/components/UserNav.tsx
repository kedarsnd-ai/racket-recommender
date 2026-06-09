'use client';

import { createClient } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export function UserNav({ email }: { email: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Don't show anything on the login page itself
  if (pathname === '/login') return null;

  if (!email) {
    return (
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 50,
      }}>
        <a
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255,255,255,0.95)',
            color: '#1d4e2a',
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            border: '1.5px solid #d4ee5c',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d6e3e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          Sign In
        </a>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(255,255,255,0.95)',
      color: '#1d4e2a',
      padding: '0.45rem 0.75rem',
      borderRadius: '10px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      border: '1.5px solid #d4ee5c',
      fontSize: '0.78rem',
      fontWeight: 600,
      maxWidth: '240px',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d6e3e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{email}</span>
      <button
        onClick={signOut}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: '#6b7a72',
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '0.1rem 0.3rem',
          borderRadius: '5px',
          transition: 'color 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#c0392b')}
        onMouseLeave={e => (e.currentTarget.style.color = '#6b7a72')}
      >
        Sign out
      </button>
    </div>
  );
}
