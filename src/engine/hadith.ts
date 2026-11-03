// Hadith rotation for the TV display: which hadith to show and when.
//
// The list in src/data/hadith.json is built by tools/build_hadith.py from an
// open dump of Sunnah.com (Arabic, the translator's English, reference and
// grading), plus any added in Settings. Every hadith belongs to a category;
// Settings decides when each category is shown: always, never, in chosen
// Hijri months (e.g. Ramadan hadith in Ramadan) or on Fridays. A hadith
// appears for `showSec` seconds at the start of every `everyMin`-minute
// slot, except in a quiet window around each jamaat, around the Jumu'ah
// khutbah, and while the jamaat screen is up. Slots rotate through the list
// in order, seasonal and general alternating, so repeats are far apart.

import data from '../data/hadith.json';
import type { Config, HadithSchedule } from './config';
import type { DayRow } from './timetable';
import { JAMAAT_PRAYERS } from './config';
import { hijri } from './hijri';
import { ramadanDates, ramadanDay } from './ramadan';
import type { Ymd } from './time';

export interface Hadith {
  id: string;
  category: string;
  ar: string;
  en: string;
  ref: string;
  grade: string;
  url: string;
}

export const ALL_HADITH: Hadith[] = data as Hadith[];

/** Categories, in the order Settings lists them. `season` marks the ones
 *  that are off outside their months by default. */
export const CATEGORIES: { id: string; label: string; season?: boolean }[] = [
  { id: 'faith', label: 'Faith' },
  { id: 'prayer', label: 'Prayer and the mosque' },
  { id: 'character', label: 'Character and manners' },
  { id: 'community', label: 'Brotherhood and community' },
  { id: 'family', label: 'Family and parents' },
  { id: 'charity', label: 'Charity' },
  { id: 'knowledge', label: "Knowledge and the Qur'an" },
  { id: 'dhikr', label: 'Dhikr and dua' },
  { id: 'honesty', label: 'Honesty and trade' },
  { id: 'patience', label: 'Patience and the hereafter' },
  { id: 'health', label: 'Cleanliness and health' },
  { id: 'prophet', label: 'The Prophet ﷺ' },
  { id: 'jumuah', label: "Jumu'ah", season: true },
  { id: 'ramadan', label: 'Ramadan', season: true },
  { id: 'shaban', label: "Sha'ban", season: true },
  { id: 'shawwal', label: 'Shawwal and Eid al-Fitr', season: true },
  { id: 'hajj', label: 'Hajj and Dhul-Hijjah', season: true },
  { id: 'muharram', label: 'Muharram', season: true },
  { id: 'sacred', label: 'The sacred months', season: true },
];

export const HIJRI_MONTH_NAMES = ['Muharram', 'Safar', 'Rabi I', 'Rabi II', 'Jumada I', 'Jumada II', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah'];

/** How each category is scheduled unless changed in Settings. */
export const DEFAULT_SCHEDULE: Record<string, HadithSchedule> = {
  jumuah: { when: 'friday' },
  ramadan: { when: 'months', months: [9] },
  shaban: { when: 'months', months: [8] },
  shawwal: { when: 'months', months: [10] },
  hajj: { when: 'months', months: [11, 12] },
  muharram: { when: 'months', months: [1] },
  sacred: { when: 'months', months: [1, 7, 11, 12] },
};

export const scheduleFor = (config: Config, cat: string): HadithSchedule =>
  config.hadith.schedule?.[cat] ?? DEFAULT_SCHEDULE[cat] ?? { when: 'always' };

export interface DayContext {
  /** Hijri month 1–12 (Ramadan from the Ramadan settings when set). */
  hijriMonth: number;
  isFriday: boolean;
}

/** The Hijri month and Friday flag for a date, honouring the Ramadan dates in Settings. */
export function dayContext(config: Config, x: Ymd, isFriday: boolean): DayContext {
  const rd = ramadanDates(config);
  const inRamadan = !!ramadanDay(rd, x);
  const hijriMonth = inRamadan ? 9 : (hijri(x, config.hijriOffset)?.month ?? 0);
  return { hijriMonth, isFriday };
}

function isOn(s: HadithSchedule, ctx: DayContext): boolean {
  if (s.when === 'always') return true;
  if (s.when === 'never') return false;
  if (s.when === 'friday') return ctx.isFriday;
  return (s.months ?? []).includes(ctx.hijriMonth);
}

/** The hadith eligible today, with the seasonal ones (Friday or this
 *  month's categories) interleaved with the general ones so they come up
 *  every other slot. Hidden entries are left out; custom entries need text. */
export function hadithList(config: Config, ctx: DayContext): Hadith[] {
  const hidden = new Set(config.hadith.hidden);
  const custom: Hadith[] = (config.hadith.custom ?? [])
    .filter((h) => (h.ar?.trim() || h.en?.trim()) && !hidden.has(h.id))
    .map((h) => ({ id: h.id, category: h.category || 'faith', ar: h.ar.trim(), en: h.en.trim(), ref: h.ref.trim(), grade: h.grade.trim(), url: '' }));
  const all = [...ALL_HADITH.filter((h) => !hidden.has(h.id)), ...custom].filter((h) => isOn(scheduleFor(config, h.category), ctx));
  const seasonal = all.filter((h) => scheduleFor(config, h.category).when !== 'always');
  const general = all.filter((h) => scheduleFor(config, h.category).when === 'always');
  if (!seasonal.length || !general.length) return all;
  const out: Hadith[] = [];
  const n = Math.max(seasonal.length, general.length);
  for (let i = 0; i < n; i++) {
    out.push(seasonal[i % seasonal.length]);
    out.push(general[i % general.length]);
  }
  return out;
}

/** True inside the quiet window around a jamaat or the Friday khutbah. */
export function isQuietTime(config: Config, row: DayRow, nowMin: number): boolean {
  const { quietBefore, quietAfter } = config.hadith;
  for (const p of JAMAAT_PRAYERS) {
    const j = row.jamaat[p];
    if (nowMin >= j - quietBefore && nowMin < j + quietAfter) return true;
  }
  if (row.isFriday && row.khutbah !== null && nowMin >= row.khutbah - quietBefore && nowMin < row.khutbah + 60) return true;
  return false;
}

/** Which hadith (if any) the TV should show right now. */
export function hadithNow(config: Config, row: DayRow, date: Ymd, nowMin: number, ctx: DayContext): Hadith | null {
  const h = config.hadith;
  if (!h.enabled) return null;
  const every = Math.max(5, h.everyMin);
  const slotStart = Math.floor(nowMin / every) * every;
  if (nowMin - slotStart >= Math.max(5, h.showSec) / 60) return null;
  if (isQuietTime(config, row, nowMin)) return null;
  const list = hadithList(config, ctx);
  if (!list.length) return null;
  const dayNo = Math.floor(Date.UTC(date.y, date.m - 1, date.d) / 86_400_000);
  const slot = dayNo * Math.ceil(1440 / every) + slotStart / every;
  return list[slot % list.length];
}
