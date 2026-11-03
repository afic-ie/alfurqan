import '../styles/app.css';
import '../styles/fonts';
import '../styles/site.css';
import { loadPublished } from '../site/data';
import { icon, mountShell } from '../site/layout';
import { MONTH_NAMES, today } from '../engine/time';
import { renderMonth } from '../ui/page';

const root = '../';
const pub = await loadPublished(root);
const t = today();
let y = t.y;
let m = t.m;
const q = new URLSearchParams(location.search);
if (/^\d{4}$/.test(q.get('y') ?? '')) y = Number(q.get('y'));
if (/^\d{1,2}$/.test(q.get('m') ?? '') && Number(q.get('m')) >= 1 && Number(q.get('m')) <= 12) m = Number(q.get('m'));

mountShell(root, 'timetable/', `
<section class="hero compact"><div class="wrap">
  <h1>Prayer timetable</h1>
  <p class="lead">Adhan and jamaat times for Masjid Al-Furqan, Limerick. Print it or save it as a PDF.</p>
  <div class="tt-bar">
    <button type="button" class="btn ghost icon-btn" data-action="prev" aria-label="Previous month">‹</button>
    <div class="tt-month" id="tt-month"></div>
    <button type="button" class="btn ghost icon-btn" data-action="next" aria-label="Next month">›</button>
    <button type="button" class="btn primary" data-action="print">${icon('print')} Print / Save PDF</button>
  </div>
</div></section>
<section class="pages public" id="pages"></section>
`, { title: 'Prayer timetable', wide: true });

const pages = document.getElementById('pages')!;
function render() {
  document.getElementById('tt-month')!.textContent = `${MONTH_NAMES[m - 1]} ${y}`;
  pages.innerHTML = renderMonth(y, m, pub.config, pub.overrides);
  history.replaceState(null, '', `?y=${y}&m=${m}`);
  fit();
}
function fit() {
  const scale = Math.min(1, (pages.clientWidth - 16) / (210 * 3.7795));
  document.documentElement.style.setProperty('--fit', String(Math.max(0.3, scale)));
}
window.addEventListener('resize', fit);
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
  if (a === 'prev') { m--; if (m < 1) { m = 12; y--; } render(); }
  if (a === 'next') { m++; if (m > 12) { m = 1; y++; } render(); }
  if (a === 'print') window.print();
});
render();
