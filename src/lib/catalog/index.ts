import racketsJson from '@/data/rackets.json';
import stringsJson from '@/data/strings.json';
import metaJson from '@/data/meta.json';
import type { CatalogBundle } from './types';

export const catalog = {
  rackets: racketsJson as CatalogBundle['rackets'],
  strings: stringsJson as CatalogBundle['strings'],
  meta: metaJson as CatalogBundle['meta']
} satisfies CatalogBundle;
