import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Racket IQ — Find your perfect racket + string combo',
  description:
    'Match your game to rackets and strings from a curated equipment database.'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
