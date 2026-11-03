// Shared page frame: header with navigation (hamburger on phones), footer.
// `root` is the relative path back to the site root ('./' on the home page,
// '../' on sub-pages) so links work both on GitHub Pages and a custom domain.

import logo from '../assets/logo.png';
import { NAV, SITE } from './content';
import { starPattern } from '../ui/art';

export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function icon(name: string): string {
  const paths: Record<string, string> = {
    mosque: '<path d="M4 21h16M5 21v-8h14v8M12 3c1.5 2 4 3.5 4 6H8c0-2.5 2.5-4 4-6zM6 13V9M18 13V9M10 21v-4a2 2 0 0 1 4 0v4"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    lecture: '<path d="M12 3v10M8 7l4-4 4 4M5 21h14M7 21v-4h10v4"/>',
    gym: '<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    pin: '<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    print: '<path d="M7 8V3h10v5M7 17H4v-6h16v6h-3M7 14h10v7H7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`;
}

export function shell(root: string, current: string, body: string, opts: { title: string; wide?: boolean } = { title: '' }): string {
  const links = NAV.map((n) => `<a href="${root}${n.href}" ${n.href === current ? 'aria-current="page"' : ''}>${esc(n.label)}</a>`).join('');
  return `
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${root}">
      <img src="${logo}" alt="" width="44" height="44">
      <span class="brand-text"><span class="brand-en">${esc(SITE.name)}</span><span class="brand-ar" lang="ar">${esc(SITE.arabicName)}</span></span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">${links}<a class="nav-cta" href="${root}donate/">${icon('heart')} Donate</a></nav>
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${icon('menu')}${icon('close')}</button>
  </div>
</header>
<main class="${opts.wide ? 'wide' : ''}">${body}</main>
<footer class="foot-site">
  <div class="wrap foot-grid">
    <div>
      <div class="foot-title">${esc(SITE.org)}</div>
      <p>${esc(SITE.address)}</p>
      <p><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></p>
      <p><a href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp community group</a></p>
    </div>
    <div>
      <div class="foot-title">Pages</div>
      ${NAV.map((n) => `<p><a href="${root}${n.href}">${esc(n.label)}</a></p>`).join('')}
    </div>
    <div>
      <div class="foot-title">Charity details</div>
      <p>${esc(SITE.charity.line)}</p>
      <p>Revenue Charity No: ${esc(SITE.charity.chy)}<br>Registered Charity Number: ${esc(SITE.charity.rcn)}</p>
      <p><a href="${SITE.charity.link}" target="_blank" rel="noopener">dublinwelfaresociety.ie</a></p>
    </div>
  </div>
  <div class="wrap foot-bottom">© ${new Date().getFullYear()} ${esc(SITE.org)} · Prayer times based on the Islamic Foundation of Ireland timetable for Limerick.</div>
</footer>`;
}

export function mountShell(root: string, current: string, body: string, opts?: { title: string; wide?: boolean }) {
  const app = document.getElementById('app')!;
  app.innerHTML = shell(root, current, body, opts);
  document.documentElement.style.setProperty('--pattern-dark', starPattern('#d9b96a', 0.18));
  document.documentElement.style.setProperty('--pattern-soft', starPattern('#1547c2', 0.05, 64));
  const burger = app.querySelector<HTMLButtonElement>('.burger')!;
  const nav = app.querySelector<HTMLElement>('#nav')!;
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
  });
  nav.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      burger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
    }
  });
  if (opts?.title) document.title = `${opts.title} · ${SITE.name}`;
}

export const hadith = (h: { text: string; source: string }) =>
  `<blockquote class="hadith"><p>“${esc(h.text)}”</p><cite>${esc(h.source)}</cite></blockquote>`;

export const hero = (title: string, sub = '', extra = '') =>
  `<section class="hero"><div class="wrap"><h1>${esc(title)}</h1>${sub ? `<p class="lead">${esc(sub)}</p>` : ''}${extra}</div></section>`;
