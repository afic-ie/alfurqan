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
