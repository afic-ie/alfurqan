// Publishing: writes public/data/published.json to the GitHub repository.
// GitHub Pages then rebuilds the site, so the public page and the TV pick
// up the change. Needs a GitHub fine-grained token with "Contents: read and
// write" on this repository, which the admin enters once in their browser.

import type { Saved } from '../ui/store';

/**
 * Which repository to publish to. Worked out from the page address on
 * GitHub Pages (owner.github.io/repo/), so moving the repository to another
 * account or organisation needs no code change. Falls back to the original
 * repository when the site is served elsewhere (e.g. a custom domain) and
 * nothing is saved in Settings.
 */
function detectTarget(): { owner: string; repo: string } {
  try {
    const saved = localStorage.getItem('alfurqan.timetable.publish-target');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  const m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
  const repo = location.pathname.split('/').filter(Boolean)[0];
  if (m && repo && repo !== 'admin') return { owner: m[1], repo };
  return { owner: 'afic-ie', repo: 'alfurqan' };
}
export const TARGET = { ...detectTarget(), branch: 'main', path: 'public/data/published.json' };
const TOKEN_KEY = 'alfurqan.timetable.github-token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; } };
export const setToken = (t: string) => { try { t ? localStorage.setItem(TOKEN_KEY, t.trim()) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

const api = `https://api.github.com/repos/${TARGET.owner}/${TARGET.repo}/contents/${TARGET.path}`;

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}

/** Encode a UTF-8 string as base64 (btoa alone breaks on non-Latin text). */
function b64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export class PublishError extends Error {}

/** Check the token can read the file. Returns the current file sha. */
async function currentSha(token: string): Promise<string | null> {
  const r = await fetch(`${api}?ref=${TARGET.branch}`, { headers: headers(token) });
  if (r.status === 404) return null;
  if (r.status === 401) throw new PublishError('GitHub rejected the token. Check it was copied fully and has not expired.');
  if (r.status === 403) throw new PublishError('The token has no access to this repository. It needs "Contents: read and write" on ' + `${TARGET.owner}/${TARGET.repo}.`);
  if (!r.ok) throw new PublishError(`GitHub error ${r.status} while reading the published file.`);
  return (await r.json()).sha as string;
}

export interface PublishResult { commitUrl: string; publishedAt: string }

export async function publish(saved: Saved, token: string): Promise<PublishResult> {
  if (!token) throw new PublishError('No GitHub token saved.');
  const sha = await currentSha(token);
  const publishedAt = new Date().toISOString();
  const body = {
    app: 'alfurqan-timetable',
    publishedAt,
    note: 'Published from the admin page. Do not edit by hand.',
    config: saved.config,
    overrides: saved.overrides,
  };
  const r = await fetch(api, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Publish timetable (${publishedAt.slice(0, 16).replace('T', ' ')})`,
      content: b64(JSON.stringify(body, null, 1)),
      branch: TARGET.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (r.status === 401 || r.status === 403) throw new PublishError('GitHub refused the write. The token needs "Contents: read and write" on this repository.');
  if (r.status === 409) throw new PublishError('The published file changed on GitHub while you were editing. Try again.');
  if (!r.ok) throw new PublishError(`GitHub error ${r.status} while publishing.`);
  const j = await r.json();
  return { commitUrl: j.commit?.html_url ?? '', publishedAt };
}

export const TOKEN_HELP_URL =
  `https://github.com/settings/personal-access-tokens/new`;
