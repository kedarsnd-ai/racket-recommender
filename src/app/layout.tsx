import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { UserNav } from '@/components/UserNav';

export const metadata: Metadata = {
  title: 'Racket IQ — Find your perfect racket + string combo',
  description:
    'Match your game to rackets and strings from a curated equipment database.'
};

export default async function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <UserNav email={user?.email ?? null} />
        {children}
      </body>
    </html>
  );
}
