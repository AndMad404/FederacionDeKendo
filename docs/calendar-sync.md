# Calendar sync

This site can update `src/app/data/calendarEvents.ts` from a Google Calendar iCal
feed. The update runs automatically every Monday and can also be started from the
GitHub Actions button.

## President workflow

The president only edits Google Calendar.

1. Open Google Calendar.
2. Open the official federation events calendar.
3. Create or edit the event.
4. Confirm title, date, time, location, and optional description.
5. Save the event.

The site checks the calendar automatically every Monday.

## Manual update button

Use this when the site needs to update before the weekly run.

1. Open the GitHub repository.
2. Go to Actions.
3. Select Sync calendar events.
4. Click Run workflow.
5. Click the green Run workflow button.

This button means: "check the calendar now and update the site data".

## Technical setup

Add this repository secret in GitHub:

```text
CALENDAR_ICS_URL
```

Use the Google Calendar iCal URL as the secret value. Do not commit that URL to
the repository.

The workflow lives in:

```text
.github/workflows/sync-calendar.yml
```

The sync script lives in:

```text
scripts/sync-calendar-events.mjs
```

Local maintenance command:

```powershell
$env:CALENDAR_ICS_URL="https://calendar.google.com/calendar/ical/.../basic.ics"
pnpm run sync:calendar
```

If `pnpm` is not available directly in PowerShell, run `corepack pnpm run sync:calendar` instead.
