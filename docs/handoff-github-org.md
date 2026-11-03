# Handoff: move the timetable app to an AFIC GitHub organisation

Written 3 Nov 2026 for a separate session whose only job is the GitHub
account / organisation setup and the repository transfer. Code changes to the
app continue in the original session; do not make code changes here except
the two small link updates in step 5.

## Where things are now

| Item | Value |
|---|---|
| Repository | `saajunaid/alfurqan` (public), default branch `main` |
| Live site | https://saajunaid.github.io/alfurqan/ (public timetable), `/admin/`, `/tv/` |
| Hosting | GitHub Pages via `.github/workflows/pages.yml`, deploys on every push to `main` (Settings → Pages → Source = GitHub Actions) |
| Publishing | Admin page writes `public/data/published.json` through the GitHub API with a fine-grained token the admin enters once per browser. The target repo is detected from the Pages address (`owner.github.io/repo/`), with `saajunaid/alfurqan` as the fallback in `src/site/publish.ts` |
| Mosque email | `afic.limerick@gmail.com` |

## Decision already made: the "hybrid" structure

1. A **custodian** GitHub account owned by the mosque (`afic.limerick@gmail.com`).
   Used only in emergencies; its credentials and 2FA recovery codes are held by the committee.
2. A GitHub **organisation** (suggested name `afic-ie`) that owns the repositories.
   Owners: the custodian account **and** the person's own account (`saajunaid`).
3. Day-to-day work is done by people with their own GitHub accounts as organisation members.

Reasons: one personal account per person (GitHub terms), per-person attribution and
access control, and continuity if any one person leaves.

## Steps

### 1. Custodian account (private browser window)
1. https://github.com/signup with `afic.limerick@gmail.com`; username e.g. `afic-limerick`; long generated password.
2. Verify the email.
3. Settings → Password and authentication → Enable two-factor → **Authenticator app**. Save the setup key as well as scanning the QR code.
4. Download the **recovery codes**.
5. Store password + authenticator setup key + recovery codes somewhere the committee controls.

### 2. Organisation (still as the custodian account)
6. Profile picture → Your organizations → New organization → **Create a free organization**.
7. Name `afic-ie` (or `afic-limerick`); contact email `afic.limerick@gmail.com`.
8. Org Settings → Authentication security → **Require two-factor authentication**.
9. Org People → Invite member → `saajunaid`.
10. Sign out; sign in as `saajunaid`; accept the invitation. Then (as the custodian, or once `saajunaid` is an owner) set `saajunaid`'s role to **Owner** (People → ⋯ → Change role).

### 3. Transfer the repository (as `saajunaid`)
11. https://github.com/saajunaid/alfurqan/settings → Danger Zone → **Transfer ownership** → new owner `afic-ie`. Keep the name `alfurqan` unless you decide to rename (if renamed, note the new name).
12. In the new location: Settings → Pages → Source must be **GitHub Actions**.
13. Settings → Actions → General: actions allowed.
14. Actions tab → "Deploy to GitHub Pages" → **Run workflow** (or wait for the next push). Confirm `https://afic-ie.github.io/alfurqan/` loads.

### 4. New publish token (as `saajunaid`, in the browser used for admin)
15. Open `https://afic-ie.github.io/alfurqan/admin/` → Publish → **Forget token** (if one was saved) → Publish → follow the setup. On GitHub's token page choose **Resource owner: afic-ie**, repository `alfurqan`, permission **Contents: Read and write**.
16. Publish once and confirm the public page updates within a few minutes.

### 5. Small follow-ups (can be done by the assistant in the new session)
17. Replace `saajunaid.github.io/alfurqan` with the new address in `README.md`, and update the fallback owner in `src/site/publish.ts` (`detectTarget`). Open a PR, let CI pass, merge.
18. Update the TV box start URL to `https://afic-ie.github.io/alfurqan/tv/`.
19. Later, when the `afic.ie` domain exists: Settings → Pages → custom domain `timetable.afic.ie`, plus a CNAME record at the registrar. After that the address never changes again.

## What not to do
- Do not use the custodian account for day-to-day edits.
- Do not make the custodian account the only owner.
- Do not rewrite git history or force-push; a transfer keeps everything.
- The admin publish token is kept in the browser only; never commit it.
