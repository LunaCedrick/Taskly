# Runtime QA Checklist

Use this checklist after `static_review.py`. These checks require a browser, Firebase configuration, account interaction, network state, or multiple tabs/devices.

## Browser Smoke

- Open the app through the same path expected for the session.
- Confirm the browser console has no runtime errors.
- Confirm CSS, JS, Firebase SDK, and Google Fonts requests do not 404.
- Confirm DM Sans, indigo sidebar, and violet accent are visible.
- Confirm no horizontal overflow at 375px.

If browser automation cannot start or times out before assertions run, report `WARN - Browser Check - automation unavailable or timed out`.

## Auth

- Sign in with Google.
- Confirm the dashboard loads after auth.
- Refresh and confirm the session persists.
- Sign out and confirm the login view returns.
- Confirm sign-out detaches listeners and clears app state symptoms: no stale project/task updates after re-login.

## Firestore CRUD

- Create, rename, and delete a project.
- Create a title-only task.
- Create a task with description, due date, priority, category, and status.
- Try creating a task without a title and confirm inline validation.
- Edit a task and confirm the correct task updates by ID.
- Complete and uncomplete a task.
- Delete a task and confirm destructive confirmation works.

## Realtime And Dashboard

- Open two tabs with the same signed-in user.
- Create or edit a task in tab 1 and confirm tab 2 updates without refresh.
- Confirm dashboard overdue, today, upcoming, and stats update from all projects.
- Delete a project with tasks and confirm any transient dashboard listener error self-recovers.

## Search And Filters

- Search by title, description, and category.
- Filter by status, priority, and category.
- Combine search plus filters and confirm intersection behavior.
- Clear search/filters and confirm all active project tasks return.

## Notifications

- Confirm in-app alerts appear for due-today or overdue tasks.
- Confirm notification bell count updates.
- Open the notification panel.
- Mark a notification as read.
- Clear all notifications.
- If browser notification permission is already granted, confirm event-triggered browser notification behavior.
- If permission is denied or unsupported, confirm the app falls back to in-app alerts only.

## Offline

- Load the app while online.
- Disconnect network.
- Confirm the offline banner appears.
- Create or edit a task while offline.
- Reconnect network.
- Confirm the banner hides and queued write syncs.

## Accessibility Spot Check

- Navigate main actions by keyboard.
- Confirm modals have focusable controls and Escape closes them.
- Confirm visible status/priority information is not color-only.
- Confirm settings navigation is reachable by keyboard.
