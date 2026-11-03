// "Today" widget: adhan and jamaat for today, next prayer countdown.

import { JAMAAT_PRAYERS, type JamaatPrayer } from '../engine/config';
import { buildDay, type DayRow } from '../engine/timetable';
import { DAY_NAMES, MONTH_NAMES, addDays, fmt12, fmt12ampm, today } from '../engine/time';
import type { Published } from './data';
import { esc, icon } from './layout';

const NAMES: Record<JamaatPrayer, [string, string]> = {
  fajr: ['Fajr', 'الفجر'], dhuhr: ['Dhuhr', 'الظهر'], asr: ['Asr', 'العصر'], maghrib: ['Maghrib', 'المغرب'], isha: ['Isha', 'العشاء'],
};

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
}

/** The next jamaat from now: today's, or tomorrow's Fajr. */
export function nextJamaat(pub: Published): { name: string; at: number; row: DayRow; tomorrow: boolean } {
  const t = today();
  const row = buildDay(t, pub.config, pub.overrides);
  const now = nowMinutes();
  for (const p of JAMAAT_PRAYERS) if (row.jamaat[p] > now) return { name: NAMES[p][0], at: row.jamaat[p], row, tomorrow: false };
  const tm = buildDay(addDays(t, 1), pub.config, pub.overrides);
  return { name: NAMES.fajr[0], at: tm.jamaat.fajr + 24 * 60, row: tm, tomorrow: true };
}

export function renderToday(pub: Published, root: string): string {
  const t = today();
  const row = buildDay(t, pub.config, pub.overrides);
  const h = row.hijri;
  const rows = JAMAAT_PRAYERS.map((p) => {
    const sun = p === 'fajr' ? `<div class="sun">${icon('clock')} Sunrise ${fmt12(row.adhan.sunrise)}</div>` : '';
    return `<div class="pr-row" data-p="${p}">
      <div class="pr-name"><span>${NAMES[p][0]}</span><span class="ar" lang="ar">${NAMES[p][1]}</span></div>
      <div class="pr-adhan"><small>Adhan</small>${fmt12(row.shownAdhan[p])}</div>
      <div class="pr-jamaat"><small>Jamaat</small>${fmt12(row.jamaat[p])}${row.beforeAdhan[p] ? '*' : ''}</div>${sun}
    </div>`;
  }).join('');
  const kh = row.khutbah !== null ? `<div class="jumuah">Jumu'ah khutbah ${fmt12ampm(row.khutbah)}${row.isFriday ? ' · today' : ''}</div>` : '';
  return `<section class="today" id="today">
  <div class="today-head">
    <div>
      <div class="today-date">${DAY_NAMES[row.weekday]} ${t.d} ${MONTH_NAMES[t.m - 1]} ${t.y}</div>
      ${h ? `<div class="today-hijri">${h.day} ${esc(h.monthName)} ${h.year} AH · <span lang="ar">${h.day} ${esc(h.monthNameAr)} ${h.year}هـ</span></div>` : ''}
    </div>
    <div class="next" id="next"></div>
  </div>
  <div class="pr-list">${rows}</div>
  ${kh}
  ${row.beforeAdhan.isha ? '<div class="note">* Summer: Isha adhan and jamaat are fixed.</div>' : ''}
  <a class="btn ghost" href="${root}#pages">${icon('print')} Full monthly timetable below</a>
</section>`;
}

/** Keeps the "next prayer" countdown ticking. Returns a stop function. */
export function startCountdown(pub: Published): () => void {
  const el = () => document.getElementById('next');
  const tick = () => {
    const n = nextJamaat(pub);
    const mins = n.at - nowMinutes();
    const hh = Math.floor(mins / 60);
    const mm = Math.floor(mins % 60);
    const e = el();
    if (!e) return;
    e.innerHTML = `<small>Next jamaat</small><strong>${n.name}</strong><span>${fmt12ampm(n.at % (24 * 60))}${n.tomorrow ? ' tomorrow' : ''}</span><em>in ${hh ? `${hh}h ` : ''}${mm}m</em>`;
    document.querySelectorAll('.pr-row').forEach((r) => r.classList.toggle('is-next', !n.tomorrow && (r as HTMLElement).dataset.p === n.name.toLowerCase()));
  };
  tick();
  const id = window.setInterval(tick, 15000);
  return () => clearInterval(id);
}
