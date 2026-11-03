import { describe, expect, it } from 'vitest';
import { adhanTimes } from '../src/engine/ifi';
import { DEFAULT_CONFIG, type JamaatPrayer } from '../src/engine/config';
import { buildDay, buildMonth } from '../src/engine/timetable';
import { anchorDate, periodFor, weekDays, weekStart } from '../src/engine/jamaat';
import { fmt12, fmt24, iso, isSummerTime, parseIso, ymd } from '../src/engine/time';
import { hijri } from '../src/engine/hijri';
import published from './fixtures/published-jamaat.json';

const t = (x: { y: number; m: number; d: number }) => {
  const a = adhanTimes(x);
  return [a.fajr, a.sunrise, a.dhuhr, a.asr, a.maghrib, a.isha].map(fmt24);
};

describe('IFI adhan times', () => {
  it('match IFI "Limerick - April 2026" PDF', () => {
    expect(t(ymd(2026, 4, 1))).toEqual(['05:29', '07:08', '13:41', '17:11', '20:10', '21:42']);
    expect(t(ymd(2026, 4, 15))).toEqual(['04:53', '06:35', '13:37', '17:24', '20:34', '22:09']);
    expect(t(ymd(2026, 4, 30))).toEqual(['04:16', '06:03', '13:34', '17:36', '21:00', '22:40']);
  });

  it('match IFI Ramadan 2026 Limerick PDF (normal year, winter time)', () => {
    expect(t(ymd(2026, 2, 19))).toEqual(['06:01', '07:42', '12:50', '15:22', '17:55', '19:30']);
    expect(t(ymd(2026, 3, 20))).toEqual(['04:59', '06:36', '12:44', '15:59', '18:49', '20:20']);
  });

  it('match the published Jan 2026 timetable (1 Jan)', () => {
    expect(t(ymd(2026, 1, 1)).map((s) => fmt12(Number(s.slice(0, 2)) * 60 + Number(s.slice(3))))).toEqual([
      '6:50', '8:43', '12:40', '2:15', '4:33', '6:19',
    ]);
  });

  it('use the leap-year table for 29 February', () => {
    expect(t(ymd(2028, 2, 29))).toEqual(['05:41', '07:20', '12:49', '15:36', '18:14', '19:47']);
  });

  it('has data for every day of a normal and a leap year', () => {
    for (const y of [2027, 2028]) for (let m = 1; m <= 12; m++) expect(buildMonth(y, m, DEFAULT_CONFIG).length).toBeGreaterThan(27);
  });
});

describe('Irish Summer Time', () => {
  it('starts last Sunday of March and ends last Sunday of October', () => {
    expect(isSummerTime(ymd(2027, 3, 27))).toBe(false);
    expect(isSummerTime(ymd(2027, 3, 28))).toBe(true);
    expect(isSummerTime(ymd(2027, 10, 30))).toBe(true);
    expect(isSummerTime(ymd(2027, 10, 31))).toBe(false);
  });

  it('marks clock-change days', () => {
    expect(buildDay(ymd(2027, 3, 28), DEFAULT_CONFIG).clockChange).toBe('forward');
    expect(buildDay(ymd(2027, 10, 31), DEFAULT_CONFIG).clockChange).toBe('back');
  });
});

describe('jamaat weeks', () => {
  it('run Friday to Thursday', () => {
    expect(iso(weekStart(ymd(2027, 1, 13)))).toBe('2027-01-08');
    expect(weekDays(ymd(2027, 1, 13)).map(iso)).toEqual([
      '2027-01-08', '2027-01-09', '2027-01-10', '2027-01-11', '2027-01-12', '2027-01-13', '2027-01-14',
    ]);
  });

  it('also restart on clock-change Sundays', () => {
    expect(iso(weekStart(ymd(2027, 3, 30)))).toBe('2027-03-28');
    expect(weekDays(ymd(2027, 3, 26)).map(iso)).toEqual(['2027-03-26', '2027-03-27']);
  });

  it('only change jamaat on week starts', () => {
    for (let m = 1; m <= 12; m++) {
      for (const row of buildMonth(2027, m, DEFAULT_CONFIG)) {
        const changed = (['fajr', 'asr', 'isha'] as JamaatPrayer[]).some((p) => row.changed[p]);
        if (changed) expect(row.isFriday || row.clockChange !== null).toBe(true);
      }
    }
  });

  it('keep jamaat on or after adhan (except fixed summer Isha)', () => {
    for (let m = 1; m <= 12; m++) {
      for (const row of buildMonth(2027, m, DEFAULT_CONFIG)) {
        expect(row.jamaat.fajr).toBeGreaterThanOrEqual(row.adhan.fajr);
        expect(row.jamaat.asr).toBeGreaterThanOrEqual(row.adhan.asr);
        expect(row.jamaat.dhuhr).toBeGreaterThanOrEqual(row.adhan.dhuhr);
        if (!row.beforeAdhan.isha) expect(row.jamaat.isha).toBeGreaterThanOrEqual(row.adhan.isha);
      }
    }
  });
});

describe('seasonal periods', () => {
  it('resolve anchors', () => {
    expect(iso(anchorDate('last-fri-01', 2027))).toBe('2027-01-29');
    expect(iso(anchorDate('summer-start', 2027))).toBe('2027-03-28');
    expect(iso(anchorDate('11-01', 2027))).toBe('2027-11-01');
  });

  it('carry over from the previous year', () => {
    const periods = [{ from: '03-01', time: '14:00' }, { from: '11-01', time: '13:00' }];
    expect(periodFor(periods, ymd(2027, 1, 5))?.time).toBe('13:00');
    expect(periodFor(periods, ymd(2027, 3, 1))?.time).toBe('14:00');
  });
});

describe('manual edits', () => {
  it('override the rule for that day only', () => {
    const day = ymd(2027, 1, 8);
    const row = buildDay(day, DEFAULT_CONFIG, { [iso(day)]: { fajr: 7 * 60 } });
    expect(row.jamaat.fajr).toBe(420);
    expect(row.edited.fajr).toBe(true);
    expect(buildDay(ymd(2027, 1, 9), DEFAULT_CONFIG).edited.fajr).toBe(false);
  });
});

describe('Hijri dates', () => {
  it('uses Umm al-Qura with an optional offset', () => {
    // alfurqan.ie showed 23 Jumada al-Ula 1448 on 3 Nov 2026
    expect(hijri(ymd(2026, 11, 3))).toMatchObject({ day: 23, month: 5, year: 1448 });
    expect(hijri(ymd(2026, 2, 18))?.monthName).toBe('Ramadan');
    expect(hijri(ymd(2026, 2, 18), -1)?.monthName).toBe("Sha'ban");
  });
});

// How close do the default rules come to what the mosque actually published?
// These thresholds stop a rule change from silently drifting away from
// current practice. Numbers are the share of days that match exactly.
describe('default rules vs published timetables', () => {
  const days = (published as { days: Record<string, Partial<Record<JamaatPrayer, number>>> }).days;
  const rate = (prayer: JamaatPrayer, from: string, to: string, within = 0) => {
    let n = 0;
    let ok = 0;
    for (const [k, v] of Object.entries(days)) {
      if (k < from || k > to || v[prayer] === undefined) continue;
      n++;
      if (Math.abs(buildDay(parseIso(k), DEFAULT_CONFIG).jamaat[prayer] - v[prayer]!) <= within) ok++;
    }
    return ok / n;
  };

  const report: string[] = [];
  for (const [label, from, to] of [['2025', '2025-01-01', '2025-12-31'], ['Jan-Feb 2026', '2026-01-01', '2026-02-28']]) {
    it(`are close to ${label}`, () => {
      const r = Object.fromEntries((['fajr', 'dhuhr', 'asr', 'isha'] as JamaatPrayer[]).map((p) => [p, rate(p, from, to)]));
      const w = Object.fromEntries((['fajr', 'asr', 'isha'] as JamaatPrayer[]).map((p) => [p, rate(p, from, to, 15)]));
      report.push(`${label}: exact ${JSON.stringify(r)} within 15 min ${JSON.stringify(w)}`);
      expect(r.dhuhr).toBeGreaterThan(0.95);
      expect(r.isha).toBeGreaterThan(0.7);
      expect(r.fajr).toBeGreaterThan(0.6);
      expect(r.asr).toBeGreaterThan(0.75);
      expect(w.fajr).toBeGreaterThan(0.95);
    });
  }
  it('report', () => console.log(report.join('\n')));
});
