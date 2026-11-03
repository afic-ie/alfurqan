// Published timetable data for the public pages and the TV.
// The admin page publishes to public/data/published.json; everything else reads it.

import { normaliseConfig, type Config } from '../engine/config';
import type { Overrides } from '../engine/timetable';

export interface Published {
  config: Config;
  overrides: Overrides;
  publishedAt?: string;
}

export async function loadPublished(root: string): Promise<Published> {
  try {
    const r = await fetch(`${root}data/published.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(String(r.status));
    const s = await r.json();
    return { config: normaliseConfig(s.config), overrides: s.overrides ?? {}, publishedAt: s.publishedAt };
  } catch {
    return { config: normaliseConfig(null), overrides: {} };
  }
}
