// TV display for the mosque screen (landscape, full screen, works offline).
//
// - Big clock, date (English + Hijri), the five prayers with adhan and
//   jamaat, next prayer highlighted with a countdown, Jumu'ah time, sunrise,
//   and an announcement line set in Admin.
// - For 10 minutes from each jamaat time the screen switches to a
//   "jamaat in progress" view asking for phones to be silenced.
// - The published data is fetched when online and kept in this browser, so
//   the screen keeps working with no connection. The page checks for a new
//   published version every 30 minutes and reloads itself once a day at
//   03:30 to pick up app updates.

import '../styles/fonts';
import '../styles/tv.css';
import logo from '../assets/logo.png';
import { JAMAAT_PRAYERS, normaliseConfig, type JamaatPrayer } from '../engine/config';
import { buildDay } from '../engine/timetable';
import { addDays, DAY_NAMES, MONTH_NAMES, fmt12, fmt12ampm, today, type Ymd } from '../engine/time';
import { starPattern } from '../ui/art';
import type { Published } from '../site/data';
import { loadPublished } from '../site/data';

const root = '../';
const CACHE_KEY = 'alfurqan.tv.published';
const NAMES: Record<JamaatPrayer, [string, string]> = {
  fajr: ['Fajr', 'الفجر'], dhuhr: ['Dhuhr', 'الظهر'], asr: ['Asr', 'العصر'], maghrib: ['Maghrib', 'المغرب'], isha: ['Isha', 'العشاء'],
};
const JAMAAT_MINUTES = 10; // how long the "jamaat in progress" view stays up

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// ---------- data ----------
async function getPublished(): Promise<Published> {
  try {
    const r = await fetch(`${root}data/published.json`, { cache: 'no-cache' });
    if (r.ok) {
      const s = await r.json();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
      return { config: normaliseConfig(s.config), overrides: s.overrides ?? {}, publishedAt: s.publishedAt };
    }
  } catch { /* offline */ }
  try {
    const s = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '');
    return { config: normaliseConfig(s.config), overrides: s.overrides ?? {}, publishedAt: s.publishedAt };
  } catch {
    return loadPublished(root);
  }
}

let pub = await getPublished();
if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${root}sw.js`).catch(() => undefined);

// ---------- layout ----------
const app = document.getElementById('app')!;
document.documentElement.style.setProperty('--pattern-dark', starPattern('#d9b96a', 0.16, 72));
app.innerHTML = `
<div class="tv">
  <aside class="tv-left">
    <div class="tv-brand"><img src="${logo}" alt=""><div><div class="tv-name">${esc(pub.config.mosque.name)}</div><div class="tv-name-ar" lang="ar">${esc(pub.config.mosque.arabicName)}</div></div></div>
    <div class="tv-clock" id="clock">--:--</div>
    <div class="tv-date" id="date"></div>
    <div class="tv-hijri" id="hijri"></div>
    <div class="tv-next" id="next"></div>
  </aside>
  <section class="tv-right">
    <div class="tv-head"><span>Prayer</span><span>Adhan</span><span>Jamaat</span></div>
    <div class="tv-rows" id="rows"></div>
    <div class="tv-foot" id="foot"></div>
  </section>
  <div class="tv-ticker" id="ticker" hidden></div>
</div>
<div class="tv-overlay" id="overlay" hidden></div>`;

const $ = (id: string) => document.getElementById(id)!;

function rowsHtml(d: Ymd) {
  const row = buildDay(d, pub.config, pub.overrides);
  return { row, html: JAMAAT_PRAYERS.map((p) => `
    <div class="tv-row" data-p="${p}">
      <div class="tv-pr"><span class="en">${NAMES[p][0]}</span><span class="ar" lang="ar">${NAMES[p][1]}</span></div>
      <div class="tv-adhan">${fmt12(row.shownAdhan[p])}</div>
      <div class="tv-jamaat">${fmt12(row.jamaat[p])}</div>
    </div>${p === 'fajr' ? `<div class="tv-sun">Sunrise ${fmt12(row.adhan.sunrise)}</div>` : ''}`).join('') };
}

let shownDay = '';
let lastOverlay = '';

function render() {
  const now = new Date();
  const t = today();
  const key = `${t.y}-${t.m}-${t.d}`;
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  $('clock').textContent = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
  $('clock').dataset.ampm = now.getHours() < 12 ? 'AM' : 'PM';

  if (key !== shownDay) {
    shownDay = key;
    const { row, html } = rowsHtml(t);
    $('rows').innerHTML = html;
    $('date').textContent = `${DAY_NAMES[row.weekday]} ${t.d} ${MONTH_NAMES[t.m - 1]} ${t.y}`;
    $('hijri').innerHTML = row.hijri ? `${row.hijri.day} ${esc(row.hijri.monthName)} ${row.hijri.year} AH <span lang="ar">${row.hijri.day} ${esc(row.hijri.monthNameAr)} ${row.hijri.year}هـ</span>` : '';
    const bits: string[] = [];
    if (row.khutbah !== null) bits.push(`${row.isFriday ? 'Jumu’ah today · ' : ''}Jumu’ah khutbah ${fmt12ampm(row.khutbah)}`);
    if (row.clockChange) bits.push(`Clocks go ${row.clockChange} one hour today`);
    if (row.beforeAdhan.isha) bits.push('Isha adhan and jamaat fixed for summer');
    $('foot').innerHTML = bits.map((b) => `<span>${b}</span>`).join('');
    const ann = pub.config.mosque.announcement?.trim();
    $('ticker').hidden = !ann;
    $('ticker').innerHTML = ann ? `<span>${esc(ann)}</span>` : '';
  }

  // next jamaat + countdown
  const row = buildDay(t, pub.config, pub.overrides);
  let next: { p: JamaatPrayer; at: number; tomorrow: boolean } | null = null;
  for (const p of JAMAAT_PRAYERS) if (row.jamaat[p] > nowMin) { next = { p, at: row.jamaat[p], tomorrow: false }; break; }
  if (!next) { const tm = buildDay(addDays(t, 1), pub.config, pub.overrides); next = { p: 'fajr', at: tm.jamaat.fajr + 1440, tomorrow: true }; }
  const mins = next.at - nowMin;
  const hh = Math.floor(mins / 60);
  const mm = Math.floor(mins % 60);
  const ss = Math.floor((mins % 1) * 60);
  $('next').innerHTML = `<small>Next jamaat</small><strong>${NAMES[next.p][0]}</strong><span>${fmt12ampm(next.at % 1440)}${next.tomorrow ? ' tomorrow' : ''}</span><em>${hh ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${mm}:${String(ss).padStart(2, '0')}`}</em>`;
  document.querySelectorAll<HTMLElement>('.tv-row').forEach((r) => {
    const p = r.dataset.p as JamaatPrayer;
    r.classList.toggle('is-next', !next!.tomorrow && p === next!.p);
    r.classList.toggle('is-past', row.jamaat[p] + JAMAAT_MINUTES <= nowMin);
  });

  // jamaat in progress
  const inProgress = JAMAAT_PRAYERS.find((p) => nowMin >= row.jamaat[p] && nowMin < row.jamaat[p] + JAMAAT_MINUTES);
  const ov = $('overlay');
  if (inProgress) {
    if (lastOverlay !== inProgress) {
      lastOverlay = inProgress;
      ov.innerHTML = `<div class="ov-in"><div class="ov-ar" lang="ar">${NAMES[inProgress][1]}</div><div class="ov-en">${NAMES[inProgress][0]} jamaat</div><div class="ov-sub">Please switch off your phones · Straighten the rows</div><div class="ov-time">${fmt12ampm(row.jamaat[inProgress])}</div></div>`;
    }
    ov.hidden = false;
  } else {
    ov.hidden = true;
    lastOverlay = '';
  }
}

render();
setInterval(render, 1000);

// Refresh published data every 30 minutes; reload daily at 03:30 for updates.
setInterval(async () => {
  const fresh = await getPublished();
  if (fresh.publishedAt !== pub.publishedAt) { pub = fresh; shownDay = ''; render(); }
}, 30 * 60 * 1000);
setInterval(() => {
  const n = new Date();
  if (n.getHours() === 3 && n.getMinutes() === 30 && n.getSeconds() < 2) location.reload();
}, 1000);

// Click or tap anywhere to go full screen (needed once on the TV box).
document.addEventListener('click', () => { document.documentElement.requestFullscreen?.().catch(() => undefined); });
