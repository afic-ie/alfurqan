# How the timetable works (and why)

This is the analysis behind the generator. It is based on every published
Masjid Al-Furqan timetable from 2020 to February 2026 (about 2,200 days),
transcribed from the PDFs in the mosque's Google Drive.

## 1. Adhan times come from IFI's fixed table

The adhan (start) times on the timetable come from the **Islamic Foundation of
Ireland (IFI)** Limerick timetable. The monthly PDFs saved in the Drive say
"Prepared by the Islamic Foundation of Ireland", and the times match IFI
exactly.

IFI does not calculate times fresh each year. Its web app
(<https://islamicfoundation.ie/timetable/>) contains one fixed table per city
that repeats every year, plus a second table used in leap years. Times are in
Irish Standard Time; one hour is added during summer time.

| Year | Published adhan times that match IFI's table |
|---|---|
| 2020 | 99.7% |
| 2021 | 95.8% (March 2021 was printed without the summer-time hour) |
| 2022 | 98.8% |
| 2023 | 98.7% |
| 2024 | 99.8% |
| 2025 | 100% |
| Jan–Feb 2026 | 100% |

The few other differences were copying mistakes in the manual process, e.g.
Maghrib printed as 09:08 on 8 August, and rows copied from the wrong day.

So the app ships IFI's table (`src/data/ifi-limerick.json`) and never needs to
download a PDF. If IFI ever revises its table, re-run
`tools/extract_ifi_tables.py`.

> Earlier automation attempts guessed the adhan times by drawing straight lines
> between the first and last day of each month. Prayer times do not change in
> straight lines, so those results were wrong.

## 2. Jamaat times follow weekly rules

Looking at 2025 and 2026, the mosque's jamaat times follow a clear system:

* **Changes happen on Fridays** (announced at Jumu'ah), plus the two days the
  clocks change.
* **Fajr:** about 20–30 minutes after adhan, on a quarter-hour, never before
  4:00 am in summer.
* **Dhuhr:** a fixed time per season: 1:00 → 1:30 (last Friday of January) →
  2:00 (summer time) → 1:45 (last Friday of September) → 1:00 (clocks go back).
* **Asr:** half-hour steps. Just after the adhan in winter (3:00 → 4:30); in
  summer about 45 minutes after, up to 7:00 pm.
* **Maghrib:** at adhan time.
* **Isha:** the first quarter-hour at or after the week's latest adhan, with
  a winter floor. The floor was 7:30 pm through 2025 and January 2026; from
  November 2026 it is **7:00 pm** (the app follows the latest practice). In
  summer it is held at a fixed 11:20 pm, even though the adhan is later in
  June/July. The old timetables hid the adhan in those weeks;
  the new one shows both and marks the jamaat with `*`.

The app turns this into one rule per prayer (see `src/engine/config.ts`).
Every number can be changed in **Settings**.

### How close the rules get

Share of days where the rule gives exactly the published jamaat time:

| | Fajr | Dhuhr | Asr | Isha |
|---|---|---|---|---|
| 2025 | 64% (100% within 15 min) | 98% | 80% | 67%* |
| Jan–Feb 2026 | 88% | 100% | 88% | 15%* |
| Nov–Dec 2026 | 66% (100% within 15 min) | 100% | 100% | 92% |

\* Isha differs only because the winter floor changed to 7:00 pm in late 2026.

The rest are judgement calls, e.g. moving Fajr in 5-minute steps in March
2025, rounding Isha to 8:00 rather than 7:45, or (Nov–Dec 2026) stepping
Fajr every two weeks rather than when the rule would. Practice also changes from
year to year: summer Isha was 11:15 in 2024 and 11:20 in 2025. That is why
the app **proposes** times from the rules and lets you change any week with a
click. Those changes are saved and kept.

`tests/engine.test.ts` checks the rules against the published timetables, so a
future rule change cannot quietly drift from current practice.

## 3. Older practice (2020–2024), for reference

* 2020–2023: in summer the Isha column often held a fixed jamaat (10:30–11:15)
  and no adhan.
* Nov–Dec 2022/2023: Friday Dhuhr jamaat followed the khutbah (1:25–1:30)
  while other days were 1:00. Since 2024 the khutbah time is a footnote.
* Ramadan timetables keep the same jamaat rules. Fajr is labelled "Suhr ends"
  and Maghrib "Iftaar", with a Ramadan-day column and extra notes (du'a, Zakat
  al-Fitr, moon sighting). This will be a separate layout later.
