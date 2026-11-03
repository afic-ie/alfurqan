// Ramadan dates from the settings: which day of Ramadan a date is, and the
// range the Ramadan timetable covers.

import type { Config } from './config';
import { hijri } from './hijri';
import { addDays, compare, parseIso, weekday, type Ymd } from './time';

export interface RamadanDates {
  start: Ymd;
  /** Eid al-Fitr (the day after the last fast). */
  eid: Ymd;
  /** Number of fasting days (29 or 30; 30 when Eid is not set yet). */
  days: number;
  startConfirmed: boolean;
  eidConfirmed: boolean;
  /** Hijri year of this Ramadan, e.g. 1448. */
  year: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The Ramadan set in the config, or null when no start date is set. */
export function ramadanDates(config: Config): RamadanDates | null {
  const r = config.ramadan;
  if (!r || !DATE.test(r.start)) return null;
  const start = parseIso(r.start);
  let eid = DATE.test(r.eid) ? parseIso(r.eid) : addDays(start, 30);
  if (compare(eid, start) <= 0 || compare(eid, addDays(start, 31)) > 0) eid = addDays(start, 30);
  const days = dayDiff(start, eid);
  const year = hijri(addDays(start, 14), config.hijriOffset)?.year ?? start.y - 579;
  return { start, eid, days, startConfirmed: !!r.startConfirmed, eidConfirmed: !!r.eidConfirmed, year };
}

/** Whole days from a to b (b - a). */
export function dayDiff(a: Ymd, b: Ymd): number {
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** 1-based day of Ramadan for a date, or null outside Ramadan. */
export function ramadanDay(r: RamadanDates | null, x: Ymd): number | null {
  if (!r) return null;
  const n = dayDiff(r.start, x) + 1;
  return n >= 1 && n <= r.days ? n : null;
}

/** True from two weeks before Ramadan until the day after Eid: when the
 *  website and TV show Ramadan information. */
export function ramadanSeason(r: RamadanDates | null, x: Ymd): boolean {
  if (!r) return false;
  return compare(x, addDays(r.start, -14)) >= 0 && compare(x, addDays(r.eid, 1)) <= 0;
}

export const isEid = (r: RamadanDates | null, x: Ymd) => !!r && compare(r.eid, x) === 0;

/** The first Friday of Ramadan (the start itself when it falls on a Friday). */
export function firstFriday(r: RamadanDates): Ymd {
  let d = r.start;
  while (weekday(d) !== 5) d = addDays(d, 1);
  return d;
}
