// The printed Ramadan timetable: one A4 page for the whole month, in the
// layout the mosque has used for years (Ramadan day, Suhoor ends, Iftar,
// the dua for breaking the fast, Zakat-ul-Fitr and Eid details).

import type { Config } from '../engine/config';
import { ramadanDates, type RamadanDates } from '../engine/ramadan';
import { buildDay, type DayRow, type Overrides } from '../engine/timetable';
import { addDays, DAY_NAMES, MONTH_NAMES, fmt12, fmt12ampm, iso, today, type Ymd } from '../engine/time';
import { clockBanner, footerNotes, longDate, pageFrame, prayerCells, prayerHead, rowClass, type Col } from './page';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Date cell with the month shown on the first row and on the 1st. */
function ramDateCell(r: DayRow, first: boolean): string {
  const mo = first || r.date.d === 1 ? `<span class="mo">${MONTH_NAMES[r.date.m - 1].slice(0, 3)}</span>` : '';
  const wd = r.isFriday ? `Jumu'ah${r.khutbah !== null ? `<span class="kh">Khutbah ${fmt12(r.khutbah)}</span>` : ''}` : DAY_SHORT[r.weekday];
  return `<td class="date"><span class="dn">${r.date.d}</span>${mo}<span class="wd">${wd}</span></td>`;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const RAMADAN_COLS: Col[] = [
  { p: 'fajr', en: 'Fajr', ar: 'الفجر', jamaat: true, sub: 'Suhoor ends' },
  { p: 'sunrise', en: 'Sunrise', ar: 'الشروق', jamaat: false },
  { p: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', jamaat: true },
  { p: 'asr', en: 'Asr', ar: 'العصر', jamaat: true },
  { p: 'maghrib', en: 'Maghrib', ar: 'المغرب', jamaat: false, sub: 'Iftar' },
  { p: 'isha', en: 'Isha', ar: 'العشاء', jamaat: true },
];

export const IFTAR_DUA = {
  ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
  en: 'The thirst is gone, the veins are moistened, and the reward is confirmed, if Allah wills.',
  ref: 'Abu Dawud 2357',
};

export const ZAKAT_HADITH = {
  en: 'Ibn ʿAbbas (may Allah be pleased with him) said: The Messenger of Allah ﷺ enjoined Zakat-ul-Fitr as a purification for the fasting person from idle talk and obscenity, and as food for the poor. Whoever pays it before the Eid prayer, it is an accepted zakat; whoever pays it after the prayer, it is ordinary charity.',
  ref: 'Abu Dawud 1609 · Ibn Majah 1827',
};

const shortDate = (x: Ymd) => `${x.d} ${MONTH_NAMES[x.m - 1].slice(0, 3)}`;
const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

export function ramadanRows(r: RamadanDates, config: Config, overrides: Overrides): DayRow[] {
  const rows: DayRow[] = [];
  for (let i = 0; i < r.days; i++) rows.push(buildDay(addDays(r.start, i), config, overrides));
  return rows;
}

/** Notes under the Ramadan table: moon sighting, Eid, Zakat, khutbah, clocks. */
export function ramadanNotes(r: RamadanDates, rows: DayRow[], config: Config): string[] {
  const ram = config.ramadan;
  const notes: string[] = [];
  if (!r.startConfirmed || !r.eidConfirmed) notes.push('<strong>Moon sighting:</strong> the beginning and end of Ramadan depend on the sighting of the moon and may move by a day.');
  for (const n of footerNotes(rows)) if (!n.includes('jamaat moves')) notes.push(n);
  notes.push('<span class="legend"><span class="tri up"></span> jamaat moves later · <span class="tri down"></span> jamaat moves earlier</span>');
  if (ram.note) notes.push(esc(ram.note));
  return notes;
}

/** The Ramadan page, or null when no Ramadan start date is set. */
export function renderRamadan(config: Config, overrides: Overrides): string | null {
  const r = ramadanDates(config);
  if (!r) return null;
  const rows = ramadanRows(r, config, overrides);
  const todayKey = iso(today());
  const colCount = 2 + RAMADAN_COLS.reduce((n, c) => n + (c.jamaat ? 2 : 1), 0);
  const body = rows
    .map((row, i) => `${clockBanner(row, colCount)}<tr class="${rowClass(row, todayKey)}"><td class="rd">${i + 1}</td>${ramDateCell(row, i === 0)}${prayerCells(row, RAMADAN_COLS)}</tr>`)
    .join('');
  const { head1, head2, colgroup } = prayerHead(RAMADAN_COLS);
  const first = rows[0].date;
  const last = rows[rows.length - 1].date;
  const months = first.m === last.m ? `${MONTH_NAMES[first.m - 1]} ${first.y}` : `${shortDate(first)} – ${shortDate(last)} ${last.y}`;
  const table = `<table class="tt ramadan-tt">
  <colgroup><col class="c-rd"><col class="c-date">${colgroup}</colgroup>
  <thead>
    <tr><th class="pr d" rowspan="2"><span class="en">Day</span><span class="ar">رمضان</span></th><th class="pr d" rowspan="2"><span class="en">Date</span><span class="ar">التاريخ</span></th>${head1}</tr>
    <tr>${head2}</tr>
  </thead>
  <tbody class="rows-${rows.length + rows.filter((x) => x.clockChange).length}">${body}</tbody>
</table>`;
  const eidDay = DAY_NAMES[new Date(Date.UTC(r.eid.y, r.eid.m - 1, r.eid.d)).getUTCDay()];
  const extra = `<div class="ram-extra">
  <div class="ram-box ram-dua">
    <div class="ram-box-title">Dua when breaking the fast</div>
    <div class="ram-ar" lang="ar" dir="rtl">${IFTAR_DUA.ar}</div>
    <div class="ram-en">${esc(IFTAR_DUA.en)} <span class="ref">(${IFTAR_DUA.ref})</span></div>
  </div>
  <div class="ram-box ram-zakat">
    <div class="ram-box-title">Zakat-ul-Fitr${config.ramadan.zakatFitr ? ` · ${esc(config.ramadan.zakatFitr)}` : ''}</div>
    <div class="ram-en">${esc(ZAKAT_HADITH.en)} <span class="ref">(${ZAKAT_HADITH.ref})</span></div>
  </div>
  <div class="ram-box ram-eid">
    <div class="ram-box-title">Eid al-Fitr</div>
    <div class="ram-eid-date">${r.eidConfirmed ? '' : '<small>Expected</small>'}${eidDay} ${longDate(r.eid).replace(/^\w+ /, '')} ${r.eid.y}</div>
    ${config.ramadan.eidPrayer ? `<div class="ram-en"><strong>Eid prayer</strong> ${esc(config.ramadan.eidPrayer)}</div>` : ''}
    ${config.ramadan.eidVenue ? `<div class="ram-en">${esc(config.ramadan.eidVenue)}</div>` : ''}
    ${config.ramadan.zakatFitr ? `<div class="ram-en">Zakat-ul-Fitr before the Eid prayer</div>` : ''}
  </div>
</div>`;
  const head = {
    title: 'Ramadan',
    titleYear: `${r.year} AH`,
    sub: `${months}${r.startConfirmed ? '' : ' · subject to moon sighting'}`,
    subAr: `رمضان ${toArabicDigits(r.year)}هـ`,
  };
  return pageFrame(config, head, 'data-ramadan="1"', table, ramadanNotes(r, rows, config), extra);
}

/** Short text for the website/TV, e.g. "Ramadan 12 · Suhoor ends 5:12 am · Iftar 6:40 pm". */
export function ramadanSummary(row: DayRow, day: number): string {
  return `Ramadan ${day} · Suhoor ends ${fmt12ampm(row.adhan.fajr)} · Iftar ${fmt12ampm(row.adhan.maghrib)}`;
}
