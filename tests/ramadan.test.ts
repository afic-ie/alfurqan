import { describe, expect, it } from 'vitest';
import { cloneConfig, DEFAULT_CONFIG } from '../src/engine/config';
import { isEid, ramadanDates, ramadanDay, ramadanSeason } from '../src/engine/ramadan';
import { ymd } from '../src/engine/time';
import { renderRamadan } from '../src/ui/ramadan';

const withRamadan = (start: string, eid = '') => {
  const c = cloneConfig(DEFAULT_CONFIG);
  c.ramadan.start = start;
  c.ramadan.eid = eid;
  return c;
};

describe('Ramadan dates', () => {
  it('is off until a start date is set', () => {
    expect(ramadanDates(DEFAULT_CONFIG)).toBeNull();
    expect(renderRamadan(DEFAULT_CONFIG, {})).toBeNull();
  });

  it('assumes 30 days when Eid is not set, and uses Eid when it is', () => {
    const r30 = ramadanDates(withRamadan('2027-02-08'))!;
    expect(r30.days).toBe(30);
    expect(r30.eid).toEqual(ymd(2027, 3, 10));
    const r29 = ramadanDates(withRamadan('2027-02-08', '2027-03-09'))!;
    expect(r29.days).toBe(29);
  });

  it('numbers the days and knows the season', () => {
    const r = ramadanDates(withRamadan('2027-02-08', '2027-03-09'))!;
    expect(r.year).toBe(1448);
    expect(ramadanDay(r, ymd(2027, 2, 7))).toBeNull();
    expect(ramadanDay(r, ymd(2027, 2, 8))).toBe(1);
    expect(ramadanDay(r, ymd(2027, 3, 8))).toBe(29);
    expect(ramadanDay(r, ymd(2027, 3, 9))).toBeNull();
    expect(isEid(r, ymd(2027, 3, 9))).toBe(true);
    expect(ramadanSeason(r, ymd(2027, 1, 20))).toBe(false);
    expect(ramadanSeason(r, ymd(2027, 1, 25))).toBe(true);
    expect(ramadanSeason(r, ymd(2027, 3, 10))).toBe(true);
    expect(ramadanSeason(r, ymd(2027, 3, 11))).toBe(false);
  });

  it('ignores an Eid date that is not 1–31 days after the start', () => {
    expect(ramadanDates(withRamadan('2027-02-08', '2027-02-01'))!.days).toBe(30);
    expect(ramadanDates(withRamadan('2027-02-08', '2027-05-01'))!.days).toBe(30);
  });

  it('renders one row per fasting day with the Ramadan labels', () => {
    const html = renderRamadan(withRamadan('2027-02-08', '2027-03-09'), {})!;
    expect(html.match(/<td class="rd">/g)?.length).toBe(29);
    expect(html).toContain('Suhoor ends');
    expect(html).toContain('Iftar');
    expect(html).toContain('subject to moon sighting');
    expect(html).toContain('رمضان ١٤٤٨هـ');
  });
});

import sheet from './fixtures/ramadan-2026.json';
import { ramadanRows } from '../src/ui/ramadan';
import { fmt12 } from '../src/engine/time';

describe('Ramadan 2026 sheet', () => {
  it('is reproduced to the minute by the rules with the Ramadan settings', () => {
    const c = cloneConfig(DEFAULT_CONFIG);
    c.ramadan.start = sheet.start;
    c.ramadan.eid = sheet.eid;
    const rows = ramadanRows(ramadanDates(c)!, c, {});
    const diffs: string[] = [];
    sheet.rows.forEach((s, i) => {
      const r = rows[i];
      const adhan = [r.adhan.fajr, r.adhan.sunrise, r.adhan.dhuhr, r.adhan.asr, r.adhan.maghrib, r.shownAdhan.isha].map(fmt12);
      const jamaat = [r.jamaat.fajr, r.jamaat.dhuhr, r.jamaat.asr, r.jamaat.isha].map(fmt12);
      if (adhan.join() !== s.adhan.join()) diffs.push(`${s.date} adhan ${adhan.join()} vs ${s.adhan.join()}`);
      if (jamaat.join() !== s.jamaat.join()) diffs.push(`${s.date} jamaat ${jamaat.join()} vs ${s.jamaat.join()}`);
      if (r.isFriday) expect(r.khutbah).toBe(13 * 60 + 30);
    });
    expect(diffs).toEqual([]);
    expect(rows.length).toBe(30);
  });

  it('leaves regular months alone when no Ramadan is set', () => {
    const feb = buildDayPlain(ymd(2026, 2, 20));
    expect(fmt12(feb.jamaat.fajr)).toBe('6:30');
    expect(feb.khutbah).toBe(13 * 60 + 20);
  });
});

function buildDayPlain(x: ReturnType<typeof ymd>) {
  return buildDay(x, DEFAULT_CONFIG);
}
import { buildDay } from '../src/engine/timetable';
