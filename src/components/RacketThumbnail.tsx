'use client';

import { useState } from 'react';

interface Props {
  photoUrl: string | null;
  alt: string;
  fallbackSvg: string;
}

export function RacketThumbnail({ photoUrl, alt, fallbackSvg }: Props) {
  const [broken, setBroken] = useState(false);

  if (broken || !photoUrl)
    return (
      <span
        // Server-built SVG markup; safe because it originates from our recommendation engine only.
        dangerouslySetInnerHTML={{ __html: fallbackSvg }}
      />
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Tennis Warehouse thumbnails, no optimization needed
    <img
      src={photoUrl}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}
