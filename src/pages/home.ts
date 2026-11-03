// Public timetable page: today's times, the monthly timetable, print.

import '../styles/fonts';
import '../styles/app.css';
import '../styles/site.css';
import { loadPublished } from '../site/data';
import { registerPwa } from '../site/pwa';
import { icon, mountShell } from '../site/layout';
import { renderToday, startCountdown } from '../site/today';
import { MONTH_NAMES, today } from '../engine/time';
import { fitBrandNames, renderMonth } from '../ui/page';
import { renderRamadan } from '../ui/ramadan';
import { ramadanDates } from '../engine/ramadan';
import { addDays, compare } from '../engine/time';

const root = './';
const pub = await loadPublished(root);
const t = today();
let y = t.y;
let m = t.m;
const q = new URLSearchParams(location.search);
if (/^\d{4}$/.test(q.get('y') ?? '')) y = Number(q.get('y'));
if (/^\d{1,2}$/.test(q.get('m') ?? '') && Number(q.get('m')) >= 1 && Number(q.get('m')) <= 12) m = Number(q.get('m'));
const ram = ramadanDates(pub.config);
// Offer the Ramadan timetable from six weeks before the start until the day after Eid.
const ramOffered = !!ram && compare(t, addDays(ram.start, -42)) >= 0 && compare(t, addDays(ram.eid, 1)) <= 0;
let view: 'months' | 'ramadan' = ramOffered && q.get('view') === 'ramadan' ? 'ramadan' : 'months';

mountShell(root, '', `
<section class="hero"><div class="wrap hero-grid">
  <div class="hero-text">
    <div class="eyebrow">Limerick · prayer times</div>
    <h1>Prayer timetable</h1>
    <p class="lead">Adhan and jamaat times for Masjid Al-Furqan. Today's times are on the right; the full month is below, ready to print or save as a PDF.</p>
    <div class="tt-bar">
      <button type="button" class="btn ghost icon-btn" data-action="prev" aria-label="Previous month">‹</button>
      <div class="tt-month" id="tt-month"></div>
      <button type="button" class="btn ghost icon-btn" data-action="next" aria-label="Next month">›</button>
      ${ramOffered ? '<button type="button" class="btn ghost" data-action="ramadan" id="ram-btn">Ramadan timetable</button>' : ''}
      <button type="button" class="btn primary" data-action="print">${icon('print')} Print / Save PDF</button>
    </div>
  </div>
  ${renderToday(pub, root)}
</div></section>
<section class="pages public" id="pages"></section>
`, 'Prayer timetable');

startCountdown(pub);

const pages = document.getElementById('pages')!;
function render() {
  const ramPage = view === 'ramadan' ? renderRamadan(pub.config, pub.overrides) : null;
  if (ramPage) {
    document.getElementById('tt-month')!.textContent = `Ramadan ${ram!.year}`;
    pages.innerHTML = `<div class="page-wrap">${ramPage}</div>`;
    history.replaceState(null, '', '?view=ramadan');
  } else {
    view = 'months';
    document.getElementById('tt-month')!.textContent = `${MONTH_NAMES[m - 1]} ${y}`;
    pages.innerHTML = `<div class="page-wrap">${renderMonth(y, m, pub.config, pub.overrides)}</div>`;
    history.replaceState(null, '', y === t.y && m === t.m ? location.pathname : `?y=${y}&m=${m}`);
  }
  document.getElementById('ram-btn')?.classList.toggle('active', view === 'ramadan');
  fitBrandNames(pages);
  fit();
}
function fit() {
  const scale = Math.min(1, (pages.clientWidth - 16) / (210 * 3.7795));
  document.documentElement.style.setProperty('--fit', String(Math.max(0.3, scale)));
}
window.addEventListener('resize', fit);
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
  if (a === 'prev') { view = 'months'; m--; if (m < 1) { m = 12; y--; } render(); }
  if (a === 'next') { view = 'months'; m++; if (m > 12) { m = 1; y++; } render(); }
  if (a === 'ramadan') { view = view === 'ramadan' ? 'months' : 'ramadan'; render(); }
  if (a === 'print') window.print();
});
render();
registerPwa(root);
