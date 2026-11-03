// Shared page frame for the public timetable pages: header with navigation
// (hamburger on phones) and a small footer. `root` is the relative path back
// to the site root ('./' at the root, '../' in a sub-folder).

import logo from '../assets/logo.png';
import { NAV, SITE } from './content';
import { starPattern } from '../ui/art';
import { brandNames } from '../ui/page';

export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function icon(name: string): string {
  const paths: Record<string, string> = {
    mosque: '<path d="M4 21h16M5 21v-8h14v8M12 3c1.5 2 4 3.5 4 6H8c0-2.5 2.5-4 4-6zM6 13V9M18 13V9M10 21v-4a2 2 0 0 1 4 0v4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    print: '<path d="M7 8V3h10v5M7 17H4v-6h16v6h-3M7 14h10v7H7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  };
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`;
}

export function shell(root: string, current: string, body: string): string {
  const links = NAV.map((n) => `<a href="${root}${n.href}" ${n.href === current ? 'aria-current="page"' : ''}>${esc(n.label)}</a>`).join('');
  return `
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${root}">
      <img src="${logo}" alt="" width="44" height="44">
      ${brandNames(SITE.name, SITE.arabicName)}
    </a>
    <nav class="nav" id="nav" aria-label="Main">${links}<a class="nav-cta" href="${SITE.website}">${icon('globe')} alfurqan.ie</a></nav>
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${icon('menu')}${icon('close')}</button>
  </div>
</header>
<main>${body}</main>
<footer class="foot-site">
  <div class="wrap foot-bottom">${esc(SITE.name)}, ${esc(SITE.city)} · Adhan times from the Islamic Foundation of Ireland timetable for ${esc(SITE.city)} · <a href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp group</a> · <a href="${SITE.website}">${SITE.website.replace('https://', '')}</a></div>
</footer>`;
}

export function mountShell(root: string, current: string, body: string, title?: string) {
  const app = document.getElementById('app')!;
  app.innerHTML = shell(root, current, body);
  document.documentElement.style.setProperty('--pattern-dark', starPattern('#d9b96a', 0.18));
  document.documentElement.style.setProperty('--pattern-soft', starPattern('#1547c2', 0.05, 64));
  const burger = app.querySelector<HTMLButtonElement>('.burger')!;
  const nav = app.querySelector<HTMLElement>('#nav')!;
  const setOpen = (open: boolean) => {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
  };
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); });
  if (title) document.title = `${title} · ${SITE.name}`;
}
