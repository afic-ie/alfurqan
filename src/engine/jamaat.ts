// Jamaat (congregation) times from the rules in config.ts.
//
// Jamaat times change only at the start of a "week": every Friday, and on the
// two clock-change Sundays. Each day's jamaat is worked out from its own week
// alone, so any date can be calculated on its own (handy for the TV screen).

import { adhanTimes } from './ifi';
import type { Anchor, Period, Rule, StepRule, JamaatPrayer } from './config';
import {
  addDays, compare, isClockChangeDay, isSummerTime, lastWeekdayOf, parseTime,
  summerTimeEnd, summerTimeStart, weekday, ymd, type Ymd,
} from './time';

export function isWeekStart(x: Ymd): boolean {
  return weekday(x) === 5 || isClockChangeDay(x);
}

export function weekStart(x: Ymd): Ymd {
  let s = x;
  while (!isWeekStart(s)) s = addDays(s, -1);
  return s;
}

export function weekDays(x: Ymd): Ymd[] {
  const out = [weekStart(x)];
  for (;;) {
    const n = addDays(out[out.length - 1], 1);
    if (isWeekStart(n)) return out;
    out.push(n);
  }
}

export function anchorDate(a: Anchor, year: number): Ymd {
  if (a === 'summer-start') return summerTimeStart(year);
  if (a === 'summer-end') return summerTimeEnd(year);
  const lf = /^last-fri-(\d{2})$/.exec(a);
  if (lf) return lastWeekdayOf(year, Number(lf[1]), 5);
  const md = /^(\d{2})-(\d{2})$/.exec(a);
  if (md) return ymd(year, Number(md[1]), Number(md[2]));
  throw new Error(`Unknown start "${a}"`);
}

/** The period in force on a date (periods repeat every year). */
export function periodFor(periods: Period[], x: Ymd): Period | undefined {
  let best: { p: Period; at: Ymd } | undefined;
  for (const year of [x.y - 1, x.y]) {
    for (const p of periods) {
      const at = anchorDate(p.from, year);
      if (compare(at, x) <= 0 && (!best || compare(at, best.at) >= 0)) best = { p, at };
    }
  }
  return best?.p;
}

const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

function stepJamaat(rule: StepRule, prayer: 'fajr' | 'asr' | 'isha', x: Ymd): number {
  const days = weekDays(x);
  const latestAdhan = Math.max(...days.map((d) => adhanTimes(d)[prayer]));
  const gap = isSummerTime(days[0]) ? rule.gapSummer : rule.gapWinter;
  let j = ceilTo(latestAdhan + gap, Math.max(1, rule.step));
  const lo = rule.earliest ? parseTime(rule.earliest) : null;
  const hi = rule.latest ? parseTime(rule.latest) : null;
  if (lo !== null) j = Math.max(j, lo);
  if (hi !== null) j = Math.min(j, hi);
  return j;
}

export function ruleJamaat(prayer: JamaatPrayer, rule: Rule, x: Ymd): number {
  switch (rule.kind) {
    case 'adhan':
      return adhanTimes(x)[prayer] + rule.offset;
    case 'periods': {
      const p = periodFor(rule.periods, x);
      const t = p ? parseTime(p.time) : null;
      return t ?? adhanTimes(x)[prayer];
    }
    case 'step':
      if (prayer === 'fajr' || prayer === 'asr' || prayer === 'isha') return stepJamaat(rule, prayer, x);
      return adhanTimes(x)[prayer];
  }
}
