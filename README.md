# Masjid Al-Furqan – prayer timetable app

Manages and publishes the prayer timetable for Masjid Al-Furqan (Limerick).
Live at <https://afic-ie.github.io/alfurqan/>.

| Page | What it is |
|---|---|
| `/` | Public timetable: today's adhan and jamaat times, next-prayer countdown, the monthly timetable, print / save as PDF |
| `/tv/` | TV display for the mosque screen (landscape, full screen, works offline) |
| `/admin/` | Editor: jamaat rules, manual changes, settings, print |

The public page reads `public/data/published.json`. The admin page edits a
copy in the browser and **Publish** writes it back to the repository, which
republishes the site within a couple of minutes.

## Publishing (admins)

1. Open `/admin/`, make your changes, click **Publish**.
2. The first time, it asks for a GitHub token. Create a *fine-grained*
   personal access token on GitHub with access to only this repository and
   the permission **Contents: read and write**. Paste it in; it is kept in
   that browser only. Only people with write access to the repository can
   create such a token, so only they can publish.
3. Later publishes are one click. Use **Forget token** in the dialog to
   remove it from a shared computer.

Edits are stored per browser. On a new computer, Settings → **Load the
published version** starts you from what is live.

## Install as an app (PWA)

The site is a progressive web app: on a phone, use the browser's **Add to
Home Screen** (iPhone: Share → Add to Home Screen; Android: the install
prompt or ⋮ → Install app). It opens full screen with the mosque icon, and
every page keeps working without internet once it has been opened once.
New versions are picked up automatically on the next online visit.

## The TV display (`/tv/`)

Shows the clock, date (English and Hijri), the five prayers with adhan and
jamaat, the next prayer with a countdown, sunrise, the Jumu'ah khutbah time,
and the announcement set in Admin. For ten minutes from each jamaat time it
switches to a full-screen "jamaat in progress" reminder.

It keeps working with no internet: the page and the published data are
cached on the device after the first load. It checks for newly published
data every 30 minutes (when online) and reloads itself at 03:30 each day.

**Android box setup:** install a kiosk browser (e.g. Fully Kiosk Browser,
free), set its start URL to `https://afic-ie.github.io/alfurqan/tv/`, turn on
"start on boot", "keep screen on" and "fullscreen". Tap the screen once to go
full screen in an ordinary browser. The box must keep the correct time, so
set its time zone to Dublin and leave automatic time on if it has internet.

The mosque website (afic.ie) is a separate project; it will embed today's
times and the timetable from this app.

## The timetable generator

Generates the monthly prayer timetable ready to print or save as PDF. It
replaces the manual process of downloading IFI's PDF, converting it and adding
jamaat times in Excel.

* **Adhan times** come from the Islamic Foundation of Ireland's Limerick
  table, which is bundled in the app. It works offline and gives exact times
  for any year.
* **Jamaat times** are proposed by rules that reproduce how the mosque set
  them in 2025–26. Click any jamaat time to change it for that week or day.
* **Print / Save PDF** gives one A4 page per month.

See [docs/analysis.md](docs/analysis.md) for how the times and rules were
worked out from the mosque's past timetables.

## Using the admin page

1. Open `/admin/` and pick the first month (it starts on the next two-month
   block, e.g. January when used in November).
2. Check the jamaat columns. Blue diamonds mark the days a jamaat time
   changes. Click a time to change it for that day, the whole week (Friday to
   Thursday) or any range of dates. **Adjust jamaat** in the toolbar does the
   same for any prayer and date range.
3. **Settings:** the mosque logo and the WhatsApp and Stripe QR codes are
   built in. You can replace them, add more QR codes (from an image or just a
   link), and change the bank details, khutbah times and the jamaat rules.
4. **Print / Save PDF:** choose A4, margins *None*, and turn on *Background
   graphics*.

The Hijri column uses the Umm al-Qura (Saudi) calendar; Settings has a
day offset if the local announcement differs.

Settings and changes are saved in the browser. Use **Download settings file**
to back them up or move them to another computer.

You can link straight to a month: `?y=2027&m=3&n=2` (year, first month,
number of months).

## Running it

Needs Node.js 20 or later.

```bash
npm install
npm run dev      # local development server
npm test         # engine tests (IFI data, clock changes, rules vs history)
npm run build    # builds dist/index.html
```

`npm run build` writes the whole site to `dist/`. Every merge into `main`
publishes it to GitHub Pages automatically (`.github/workflows/pages.yml`).

## Ramadan

Settings → **Ramadan** holds the first day of fasting, the Eid date (30 days
assumed when empty), the Eid prayer time and venue, the Zakat-ul-Fitr amount and
the Taraweeh time, plus the Ramadan jamaat rules (Fajr 10 minutes after the
week's latest adhan, Isha not before 8 pm, khutbah 1:30 pm, days before the
first Friday follow that Friday). Tick *confirmed* after the moon sighting to drop the
"subject to moon sighting" wording. **Ramadan** in the admin toolbar shows the
printable Ramadan timetable (day number, Suhoor ends, Iftar, the dua for
breaking the fast, Zakat-ul-Fitr and Eid). After publishing, the website and the
TV show the Ramadan day, Suhoor/Iftar and Taraweeh from two weeks before the
start until Eid, and the TV checks for changes every five minutes in that period.

## Hadith on the TV display

Settings → **Hadith on the TV display** runs a rotation of short hadith on the
TV: Arabic, the translator's English, the Sunnah.com reference and the grading.
`src/data/hadith.json` holds 157 of them in 19 groups (faith, prayer and the
mosque, character, community, family, charity, knowledge and the Qur'an, dhikr
and dua, honesty and trade, patience and the hereafter, health, the Prophet ﷺ,
Jumu'ah, Ramadan, Sha'ban, Shawwal and Eid, Hajj and Dhul-Hijjah, Muharram, the
sacred months). It is generated by `tools/build_hadith.py` from the open
hadith corpus (fawazahmed0/hadith-api, a dump of Sunnah.com) and the selection in
`tools/hadith-selection.json`: each entry is found by a distinctive phrase, the
Prophet's words are taken verbatim from the corpus, and only sahih and hasan
narrations are accepted. Entries marked with a cut carry a short translation of
that part written for the screen.

Each group has a schedule: always, never, in chosen Hijri months, or on Fridays.
By default the seasonal groups show only in their months (Ramadan uses the
Ramadan dates from Settings), Jumu'ah hadith on Fridays, and the rest all year.
While a seasonal group is on it alternates with the everyday groups, so a
Ramadan hadith comes up every other slot in Ramadan. Individual hadith can be
unticked and more can be added, edited or removed in the same panel, each with
a group. The rotation is on by default and can be switched off there.

One hadith appears for the set number of seconds at the start of every interval
(default every 15 minutes for 30 seconds), never within the quiet window around
a jamaat (default 10 minutes before to 20 after), around the Jumu'ah khutbah, or
while the jamaat screen is up. Preview with `tv/?preview=hadith`.

To rebuild the list after editing the selection, download the editions
(`ara-<collection>.min.json` and `eng-<collection>.min.json`) from
`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/` into a folder
and run `python3 -I tools/build_hadith.py <folder>`.

## Setting up the TV box

The TV page is an ordinary web page that keeps working without internet once
it has loaded, so the box only needs a browser that opens it full screen on
boot. These steps use **Fully Kiosk Browser**, a one-off licence per device;
any kiosk browser with a start URL and autostart will do.

1. Connect the box to the mosque wifi. In the box's settings set the date and
   time to automatic and the time zone to Europe/Dublin: the display uses the
   box's clock.
2. Install Fully Kiosk Browser from the Play Store, or the APK from
   fully-kiosk.com if the store on the box does not list it.
3. In Fully's settings set the **Start URL** to
   `https://afic-ie.github.io/alfurqan/tv/`.
4. Turn on: Autostart on boot, Keep screen on, Fullscreen mode, Hide
   navigation bar, Auto reload on network reconnect; set the screen-off timer
   to never. In the box's own settings set display sleep to never and switch
   off any screensaver.
5. Reboot. The timetable should appear on its own; press once on the remote
   if the page asks to go full screen. Optionally set a kiosk PIN in Fully so
   the remote cannot leave the page.
6. Leave the box online for a minute after the first load so the page can
   store everything it needs (see below).

What happens afterwards:

* The page checks for a newly published version every 30 minutes (every 5
  minutes from two weeks before Ramadan until Eid) and reloads itself at 03:30
  each night to pick up app updates, but only when the site is reachable.
* Publishing from the admin page is all that is needed to change what is on
  the screen.
* When the repository moves to the AFIC organisation, or a custom domain is
  set up, change the Start URL in Fully to the new address.

### Working without internet

After the first load the page has everything it needs stored on the box: the
app, the fonts, the published settings and the whole adhan table, so it can
compute any date on its own. With the wifi off it keeps showing the right
times, Hijri dates, Ramadan details and hadith indefinitely, including across
the clock changes, as long as the box's own clock stays right.

The page asks the browser for persistent storage and fetches every font while
online so nothing is missing later, and it never reloads itself while offline.
Setting up over a phone hotspot and disconnecting afterwards is fine: load the
TV page, leave it a minute, then switch the hotspot off; the page carries on.
Do not turn on any "clear cache on start" or "clear web storage" option in the
kiosk browser, as that would throw away the stored copy on every boot.
Two limits remain: nothing published from the admin page reaches an offline
box until it is back on wifi, and a browser that is uninstalled, reset or
cleared loses the stored copy and needs one more online load. A box that is
normally offline should be put on wifi (or a phone hotspot) after each publish.

## Project layout

| Path | What it is |
|---|---|
| `src/data/ifi-limerick.json` | IFI Limerick adhan table (normal and leap year) |
| `src/engine/` | Adhan times, clock changes, jamaat rules, Hijri dates |
| `src/engine/config.ts` | Default settings and jamaat rules (explained in comments) |
| `src/assets/` | Logo and QR code images (WhatsApp group, Stripe donations) |
| `src/ui/` | Timetable page design, Ramadan page, settings panel, storage |
| `src/site/` | Public page: layout and navigation, today widget, published data |
| `src/pages/` | Entry script for the public page |
| `public/data/published.json` | Published jamaat changes read by the public pages |
| `src/styles/app.css` | Look and feel, including the print layout |
| `tests/` | Tests; `fixtures/published-jamaat.json` holds the mosque's published jamaat times (2024 – Dec 2026) |
| `tools/extract_ifi_tables.py` | Rebuilds the IFI table from IFI's web app |
| `tools/build_hadith.py`, `tools/hadith-selection.json` | Builds the hadith list from the open Sunnah.com corpus |

## Roadmap

1. ~~Monthly timetable generator~~
2. ~~Public timetable page with today's times~~
3. ~~Publish from the admin page~~
4. ~~TV display mode for the mosque screen~~
5. ~~Ramadan timetable~~
6. ~~Hadith rotation on the TV display~~
7. Embed for the afic.ie website (separate project)
