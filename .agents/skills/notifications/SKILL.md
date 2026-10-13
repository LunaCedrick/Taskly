---
name: notifications
description: "Session 10 of 17: build Taskly notification UI contracts for in-app alert banners, notification bell and panel, unread counts, mark-as-read and clear hooks, and event-triggered browser notification behavior via FCM. Use after task and search/filter UI exist, while leaving app.js notification state, event wiring, and browser notification dispatch to Session 13."
---

# Session 10 - Notifications

## Purpose

Build the notification UI surface so Taskly can show timely in-app alerts,
unread counts, and notification history while preserving the existing auth,
FCM token, and app orchestration boundaries.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/notifications/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve notification product scope.
- Inspect `index.html`, `style.css`, `js/ui.js`, `js/auth.js`, and `js/app.js`
  for the actual current notification contracts.
- Do not preload prior skill files unless a contract conflict cannot be
  resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 10
notifications-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- In-app alert banner UI contracts for overdue and due-today task alerts.
- Notification bell and unread badge presentation refinements.
- Notification panel rendering for alert history.
- Mark-as-read and clear-all UI hooks for later app.js event delegation.
- Browser notification behavior contract for event-triggered alerts.
- CSS for notification banners, panel content, unread states, and actions.

This session does not build:

- No scheduled 8AM reminders.
- No Firebase Cloud Functions.
- No Firestore notification collection.
- No auth permission request changes.
- No FCM token saving changes.
- No app.js state wiring.
- No event listener wiring.
- No task or dashboard listener logic.
- No offline network handling.

Session 13 wires notification generation, bell toggling, unread counts,
mark-as-read, clear-all, and browser notification dispatch through app.js.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`
- `js/ui.js`

Do not modify `js/db.js`, `js/auth.js`, `js/router.js`, `js/config.js`, or
`js/app.js` in this session.

## Existing Implementation Assumptions

- `#notification-bell` already exists in the topbar.
- `#notif-count` already exists inside the bell.
- `#notification-panel` already exists as the notification panel container.
- `ui.renderNotificationPanel(notifications)` already renders notification
  objects into the panel.
- `ui.updateNotificationBadge(count)` already updates the unread badge.
- Notification permission and FCM token saving are already handled by auth and
  db modules.

## Required DOM Targets

Use only canonical IDs from `AGENTS.md`.

Required existing targets:

- `#notification-bell`
- `#notif-count`
- `#notification-panel`
- `#view-dashboard`

Required new target inside `#view-dashboard` if it does not already exist:

- `#notification-alerts`

Do not rename notification targets. Do not add a second notification bell or a
second notification panel.

`#notif-count` is the only canonical notification badge ID. Do not add,
preserve, or fallback to `#notification-count`; that ID is stale.

## Notification Data Contract

Notification objects passed from app.js to ui.js must follow this shape:

```javascript
{
  id: 'notification-id',
  type: 'overdue',
  message: 'You have 2 overdue tasks',
  timestamp: dateOrFirestoreTimestamp,
  read: false,
  taskId: 'optional-task-id',
  projectId: 'optional-project-id'
}
```

Allowed notification types for MVP:

- `overdue`
- `today`
- `task_completed`
- `task_created`
- `system`

Rules:

- `state.notifications` stores the notification objects in app.js.
- `state.unreadCount` is derived from notifications where `read !== true`.
- Timestamps render as human-readable text.
- Missing optional `taskId` or `projectId` must not break rendering.
- ui.js renders the array it receives and does not decide which app events
  should create notifications.

## Required UI Functions

Preserve these exported functions:

- `renderNotificationPanel(notifications)`
- `updateNotificationBadge(count)`

Add or refine these exported functions only if the current UI needs them:

- `renderNotificationAlerts(alerts)`
- `showNotificationPanel()`
- `hideNotificationPanel()`

Purpose of each:

- `renderNotificationAlerts(alerts)` renders dismissible in-app alert banners
  into `#notification-alerts`.
- `showNotificationPanel()` makes `#notification-panel` visible.
- `hideNotificationPanel()` hides `#notification-panel`.

Do not add listener logic to these functions. They only render or toggle UI
from values given by app.js.

## In-App Alert Banner Requirements

Dashboard alerts should appear near the top of `#view-dashboard`.

Alert behavior contract:

- Overdue alert copy: `X tasks are overdue`.
- Today alert copy: `You have X tasks due today`.
- Alerts are dismissible for the current browser session.
- Dismissal state is owned by app.js, not ui.js.
- Alerts use `role="alert"` for immediate announcement.
- Alert dismiss buttons expose `data-notification-action="dismiss-alert"`.
- Each alert element carries `data-notification-id` when an ID exists.

Do not use alerts for the known transient dashboard listener re-subscribe case.
That case remains a loading/reconnecting state from the dashboard/app sessions.

## Notification Panel Requirements

The panel must support:

- Empty state copy: `No notifications`.
- Notification message text.
- Timestamp text.
- Visible unread styling.
- Per-item mark-as-read action.
- Clear-all action when at least one notification exists.

Required data hooks:

- Notification item: `data-notification-id`.
- Mark-as-read button: `data-notification-action="mark-read"`.
- Clear-all button: `data-notification-action="clear-all"`.

Rules:

- Use `textContent` for notification messages.
- Do not use notification type color as the only status signal.
- The panel visibility is controlled by app.js in Session 13.
- ui.js may expose show/hide helpers, but must not attach click listeners.

## Notification Bell Requirements

The bell remains `#notification-bell`.

Rules:

- Keep `aria-label="Notifications"`.
- Keep unread badge target `#notif-count`.
- Keep `aria-live="polite"` on the badge.
- Hide the badge when unread count is zero.
- Show the badge when unread count is greater than zero.
- Do not use `#notification-count` as a fallback or alias.
- Do not store unread count in the DOM as state; app.js owns the count.

Session 13 wires the bell click to show or hide the panel.

## Browser Notification Contract For Session 13

Browser notifications are event-triggered only.

Rules:

- Permission request remains owned by auth on first login.
- FCM token saving remains owned by auth and db modules.
- app.js may fire browser notifications only when the browser supports
  notifications and permission is granted.
- If permission is denied or unsupported, app.js falls back to in-app alerts
  only.
- Browser notifications may be triggered when a task becomes overdue while the
  app is active.
- Scheduled daily reminders are not part of the MVP.
- Do not add Cloud Functions, service worker logic, or scheduled jobs in this
  session.

## CSS Requirements

Append notification styles to the end of `style.css` under a clear Session 10
comment header only when existing styles are insufficient.

Potential required classes:

- `.notification-alerts`
- `.notification-alert`
- `.notification-alert--overdue`
- `.notification-alert--today`
- `.notification-alert__message`
- `.notification-alert__dismiss`
- `.notification-panel__header`
- `.notification-panel__title`
- `.notification-panel__action`
- `.notification-item__actions`
- `.notification-item__button`
- `.notification-item__type`

Rules:

- Use existing CSS variables only.
- Do not hardcode hex colors.
- Keep mobile-first layout.
- Notification actions must meet 44px touch targets on mobile.
- Do not introduce horizontal scrolling.
- Use transform and opacity only for any animation.
- Keep the panel compact and operational, not marketing-style.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, or `fetch` from ui.js.
- Do not add event listeners in ui.js.
- Do not mutate app state from ui.js.
- Do not implement notification generation rules in ui.js.
- Do not modify auth permission or token logic.
- Do not modify db.js.
- Do not create a Firestore notifications collection.
- Do not implement scheduled reminders.
- Do not use `innerHTML` for user, Firestore, or notification message data.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm no console errors.
- Confirm `#notification-bell`, `#notif-count`, and `#notification-panel` still
  exist.
- Confirm `#notification-count` is not introduced or preserved in new code.
- Call `ui.updateNotificationBadge(3)` and confirm the badge shows `3`.
- Call `ui.updateNotificationBadge(0)` and confirm the badge hides.
- Call `ui.renderNotificationPanel([mockNotification])` and confirm the panel
  renders message, timestamp, unread state, and mark-as-read hook.
- Call `ui.renderNotificationPanel([])` and confirm the empty state appears.
- If added, call `ui.renderNotificationAlerts(mockAlerts)` and confirm overdue
  and today alerts render with dismiss hooks.
- Confirm no browser notification permission prompt appears during this
  session's UI-only checks.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css js/ui.js
git commit -m "feat: build notification UI contracts"
git push origin dev
```
