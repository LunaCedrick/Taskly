---
name: dashboard
description: "Session 6 of 17: build the Taskly dashboard view shell and dashboard styling for aggregated stats, overdue, today, upcoming, and recent activity sections. Use when implementing the dashboard feature after ui.js and db.js exist, while leaving app.js listener wiring to Session 13."
---

# Session 6 - Dashboard

## Purpose

Build the dashboard view structure and styling so Taskly can answer
"What needs my attention today?" from one aggregated screen.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/dashboard/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve unclear dashboard product scope.
- Inspect `js/ui.js` and `js/db.js` for the actual current contracts.
- Do not preload prior skill files unless a contract conflict cannot be resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 6
dashboard-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- Dashboard section markup inside `#view-dashboard`.
- Dashboard CSS for stats grid, urgency sections, task section layout, and recent activity layout.
- A dashboard layout that matches the existing `ui.renderDashboard()` target IDs.
- Loading/reconnecting-compatible containers for later app.js orchestration.

This session does not build:

- No Firestore listeners.
- No direct calls to `db.listenToDashboardTasks()`.
- No application state or listener cleanup.
- No project CRUD.
- No task CRUD.
- No search/filter logic.
- No notification logic.
- No app.js orchestration.

Session 13 wires `db.listenToDashboardTasks()` into app state and calls
`ui.renderDashboard(data)`.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`

Do not modify `js/db.js`, `js/ui.js`, `js/router.js`, `js/auth.js`, or
`js/app.js` in this session. If `ui.renderDashboard()` lacks a required
contract, stop and report the mismatch instead of patching ui.js.

## Existing Implementation Assumptions

- `#view-dashboard` already exists in `index.html`.
- `ui.renderDashboard(data)` already targets:
  - `#dashboard-stats`
  - `#dashboard-overdue`
  - `#dashboard-today`
  - `#dashboard-upcoming`
  - `#activity-feed`
- `ui.renderStats(stats)` expects `stats.total`, `stats.completed`,
  `stats.inProgress`, and `stats.overdue`.
- `db.listenToDashboardTasks(userId, callback)` already returns all user tasks
  across projects through a collection group query.

## Required DOM Structure

Replace the empty contents of `#view-dashboard` with semantic dashboard sections.
Keep `#view-dashboard` itself unchanged.

Required target IDs:

- `#dashboard-stats`
- `#dashboard-overdue`
- `#dashboard-today`
- `#dashboard-upcoming`
- `#activity-feed`

Required section order:

1. Dashboard header or intro copy.
2. Stats cards container.
3. Overdue tasks.
4. Today tasks.
5. Upcoming tasks.
6. Recent activity.

Use semantic elements:

- Use one `h1` on the page only. The existing topbar title is the page `h1`.
- Use `section` for dashboard regions.
- Use `h2` for dashboard section headings.
- Use `ul` only for `#activity-feed`, because `ui.renderActivityFeed()` renders `li` items.
- Task section containers must be neutral containers such as `div`, because
  `ui.renderTaskSection()` appends task cards or empty-state elements.

## Dashboard Data Shape

The eventual call from app.js should pass this shape to `ui.renderDashboard()`:

```javascript
{
  stats: {
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  },
  overdue: [],
  today: [],
  upcoming: [],
  activity: []
}
```

Do not implement this grouping in Session 6. Add this shape only as a contract
note for Session 13.

## Dashboard Grouping Rules For Session 13

Record these rules in comments only if needed. Do not implement them here.

- `overdue`: tasks with due dates before today and `status !== 'done'`.
- `today`: tasks due today and `status !== 'done'`.
- `upcoming`: incomplete tasks due after today.
- Completed tasks count toward stats but do not appear in urgency sections.
- Tasks with no due date do not belong in overdue, today, or upcoming unless
  Session 13 explicitly adds a separate no-date section.

## Listener Resilience Note

Do not implement re-subscribe logic in this session.

The dashboard view must support a temporary reconnecting/loading state if
Session 13 re-subscribes after the known dashboard collection-group listener
error. That state must use skeleton/loading UI, not a persistent error banner.

## CSS Requirements

Append dashboard styles to the end of `style.css` under a clear Session 6
comment header.

Required classes:

- `.dashboard`
- `.dashboard__header`
- `.dashboard__eyebrow`
- `.dashboard__title`
- `.dashboard__subtitle`
- `.dashboard__stats`
- `.dashboard__grid`
- `.dashboard-section`
- `.dashboard-section__header`
- `.dashboard-section__title`
- `.dashboard-section__meta`
- `.dashboard-section__body`
- `.dashboard-section--overdue`
- `.dashboard-section--today`
- `.dashboard-section--upcoming`
- `.dashboard-section--activity`

Rules:

- Use existing CSS variables from `AGENTS.md` and existing `:root`.
- Do not hardcode hex colors in rules.
- Do not add a framework or dependency.
- Keep mobile-first layout.
- Stats should stack on mobile and use a responsive grid on tablet/desktop.
- Urgency sections should be readable at 375px without horizontal scrolling.
- Activity feed should visually align with card/list styling from Session 5.
- Use `transform` and `opacity` only for any animation.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, or `fetch`.
- Do not add direct DOM manipulation scripts.
- Do not add event listeners.
- Do not add inline styles.
- Do not use `innerHTML`.
- Do not add `#task-list`; it belongs inside `#view-project` in Sessions 7-8.
- Do not create project or task forms.
- Do not wire FAB behavior.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm no console errors are introduced by the dashboard markup.
- In the browser console, call `ui.renderDashboard()` with mock data matching the data shape above.
- Confirm stats render into `#dashboard-stats`.
- Confirm overdue, today, and upcoming sections render task cards or empty states.
- Confirm recent activity renders into `#activity-feed`.
- Confirm the layout has no horizontal scrolling at mobile width.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css
git commit -m "feat: build aggregated dashboard view"
git push origin dev
```
