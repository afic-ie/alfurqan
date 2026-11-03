// Hadith rotation for the TV display: which hadith to show and when.
//
// A curated list lives in src/data/hadith.json (Arabic, English, reference
// and grading); more can be added in Settings. When switched on, a hadith appears for `showSec` seconds at the start of
// every `everyMin`-minute slot, except in a quiet window around each jamaat
// (`quietBefore` minutes before to `quietAfter` after), around the Jumu'ah
// khutbah, and while the jamaat screen is up. Slots rotate through the list
// in order, so the same hadith does not come back for a long time.

import data from '../data/hadith.json';
import type { Config } from './config';
import type { DayRow } from './timetable';
import { JAMAAT_PRAYERS } from './config';
import type { Ymd } from './time';

export interface Hadith {
  id: string;
  ar: string;
  en: string;
  ref: string;
  grade: string;
  url: string;
  season?: 'ramadan';
}

export const ALL_HADITH: Hadith[] = data as Hadith[];

/** The hadith eligible today: built-in and custom, not hidden in Settings;
 *  Ramadan ones only in Ramadan; custom entries need Arabic or English text. */
export function hadithList(config: Config, inRamadan: boolean): Hadith[] {
  const hidden = new Set(config.hadith.hidden);
  const custom: Hadith[] = (config.hadith.custom ?? [])
    .filter((h) => (h.ar?.trim() || h.en?.trim()) && !hidden.has(h.id))
    .map((h) => ({ id: h.id, ar: h.ar.trim(), en: h.en.trim(), ref: h.ref.trim(), grade: h.grade.trim(), url: '' }));
  return [...ALL_HADITH.filter((h) => !hidden.has(h.id) && (inRamadan || h.season !== 'ramadan')), ...custom];
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
export function hadithNow(config: Config, row: DayRow, date: Ymd, nowMin: number, inRamadan: boolean): Hadith | null {
  const h = config.hadith;
  if (!h.enabled) return null;
  const every = Math.max(5, h.everyMin);
  const slotStart = Math.floor(nowMin / every) * every;
  if (nowMin - slotStart >= Math.max(5, h.showSec) / 60) return null;
  if (isQuietTime(config, row, nowMin)) return null;
  const list = hadithList(config, inRamadan);
  if (!list.length) return null;
  const dayNo = Math.floor(Date.UTC(date.y, date.m - 1, date.d) / 86_400_000);
  const slot = dayNo * Math.ceil(1440 / every) + slotStart / every;
  return list[slot % list.length];
}
