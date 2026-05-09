const SHARE_FIELD_IDS = [
  'height',
  'weight',
  'grip',
  'level',
  'swing',
  'style',
  'volley',
  'arm',
  'utr',
  'usta',
  'budget',
  'stringpref'
] as const;

export function buildShareUrlFromForm(form: HTMLFormElement): string {
  const params = new URLSearchParams();

  for (const id of SHARE_FIELD_IDS) {
    const el = form.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | null;
    const v = el?.value.trim() ?? '';
    if (v) params.set(id, v);
  }

  const notesEl = form.querySelector('#notes') as HTMLTextAreaElement | null;
  const notes = notesEl?.value.trim() ?? '';
  if (notes) params.set('notes', notes);

  if (typeof window === 'undefined')
    return `#${params.toString()}`;

  return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
}

export async function flashCopyButton(btn: HTMLButtonElement, done: boolean): Promise<void> {
  const orig = btn.innerHTML;
  if (done) {
    btn.innerHTML = '✓ Copied!';
    btn.style.background = 'var(--court)';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 1800);
  }
}

export async function copyShareLink(form: HTMLFormElement, btn: HTMLButtonElement): Promise<void> {
  const url = buildShareUrlFromForm(form);
  try {
    await navigator.clipboard.writeText(url);
    await flashCopyButton(btn, true);
  } catch {
    window.prompt('Copy this share link:', url);
  }
}
