// Manual jamaat changes: apply a time to a set of days, or clear them.

import type { Config, JamaatPrayer } from './config';
import { ruleJamaat } from './jamaat';
import type { Overrides } from './timetable';
import { addDays, compare, iso, parseIso } from './time';

/** Every ISO date from `from` to `to` inclusive (either order). */
export function daysBetween(from: string, to: string): string[] {
  let a = parseIso(from);
  let b = parseIso(to);
  if (compare(a, b) > 0) [a, b] = [b, a];
  const out: string[] = [];
  for (let d = a; compare(d, b) <= 0; d = addDays(d, 1)) out.push(iso(d));
  return out;
}

/**
 * Set the jamaat for `prayer` on each day in `keys` (t in minutes after
 * midnight), or clear the manual change when t is null. A manual value equal
 * to what the rule already gives is stored as "no change". Returns the
 * updated overrides (the same object, mutated).
 */
export function applyJamaat(
  overrides: Overrides,
  config: Config,
  prayer: JamaatPrayer,
  keys: string[],
  t: number | null,
): Overrides {
  for (const k of keys) {
    const o = overrides[k];
    if (t === null || t === ruleJamaat(prayer, config.rules[prayer], parseIso(k))) {
      if (o) delete o[prayer];
    } else {
      (overrides[k] ??= {})[prayer] = t;
    }
    if (overrides[k] && !Object.keys(overrides[k]).length) delete overrides[k];
  }
  return overrides;
}

export function countEdits(overrides: Overrides): number {
  return Object.values(overrides).reduce((n, o) => n + Object.keys(o).length, 0);
}
