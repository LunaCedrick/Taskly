---
name: search-filter
description: "Session 9 of 17: build Taskly search and filter UI contracts for real-time task search, status filters, priority filters, category filters, combined client-side filtering, and 150ms debounce behavior. Use after task rendering exists, while leaving app.js state wiring and filtering execution to Session 13."
---

# Session 9 - Search Filter

## Purpose

Build the search and filter surface so users can narrow the active project task
list by text, status, priority, and category without creating extra Firestore
reads or moving state outside app.js.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/search-filter/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve search or filter product scope.
- Inspect `js/app.js`, `js/ui.js`, `index.html`, and `style.css` for the actual
  current search/filter contracts.
- Do not preload prior skill files unless a contract conflict cannot be
  resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 9
search-filter-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- Search and filter UI contracts for the active project task list.
- Filter controls for status, priority, and category.
- UI render helpers needed to display active filters.
- CSS for filter controls and active filter states.
- The exact filtering contract that Session 13 must wire in app.js.

This session does not build:

- No Firestore queries.
- No db.js changes.
- No app.js state wiring.
- No event listener wiring.
- No task CRUD changes.
- No dashboard collection-group filtering.
- No notifications.
- No offline network handling.

Session 13 wires `#search-input`, filter controls, debounce, state updates, and
calls to `ui.renderTaskList()`.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`
- `js/ui.js`

Do not modify `js/db.js`, `js/app.js`, `js/router.js`, `js/auth.js`, or
`js/config.js` in this session.

## Existing Implementation Assumptions

- `#search-input` already exists in the topbar.
- `#task-list` already exists inside `#view-project`.
- `app.js` already defines `state.filters.status`, `state.filters.priority`,
  `state.filters.category`, and `state.searchQuery`.
- `ui.renderTaskList(tasks, filters, searchQuery)` already expects filtered
  tasks and uses `filters` plus `searchQuery` only to choose empty-state copy.
- Task objects include `title`, `description`, `category`, `status`, and
  `priority`.

## Required DOM Targets

Use only canonical IDs from `AGENTS.md`.

Required existing targets:

- `#search-input`
- `#view-project`
- `#task-list`

Required new target inside `#view-project`:

- `#task-filter-bar`

Do not create another search input. The topbar search input remains the single
search source for project tasks.

## Required UI Functions

Add these exported functions to `js/ui.js`:

- `renderTaskFilters(filters, categories)`
- `updateActiveFilters(filters)`

Purpose of each:

- `renderTaskFilters(filters, categories)` renders filter controls for status,
  priority, and category into `#task-filter-bar`.
- `updateActiveFilters(filters)` updates active button/select states without
  rebuilding task cards.

Do not add filter logic to ui.js. These functions only render filter controls
from values given by app.js.

## Filter Controls

The filter bar must support:

- Status: `all`, `todo`, `inprogress`, `done`.
- Priority: `all`, `high`, `medium`, `low`, `none`.
- Category: `all` plus categories passed by app.js.

Control requirements:

- Each filter control must expose `data-filter-type`.
- Each filter option must expose `data-filter-value`.
- The active option must use a visible active class.
- Controls must be keyboard usable.
- Button labels must be human-readable:
  - `all` -> `All`
  - `todo` -> `To do`
  - `inprogress` -> `In progress`
  - `done` -> `Done`
  - `none` -> `None`

## Filtering Contract For Session 13

Filtering is implemented later in app.js. Session 9 must document this contract
and provide UI hooks only.

Search behavior:

- Match task `title`, `description`, and `category`.
- Trim the query before matching.
- Match case-insensitively.
- Empty query matches all tasks.
- Debounce input at `150ms`.

Filter behavior:

- Filters combine by intersection.
- `status: 'all'` matches every status.
- `priority: 'all'` matches every priority.
- `category: 'all'` matches every category.
- Missing task fields must not crash filtering.
- Filtering operates on in-memory `state.tasks`.
- Filtering must not call Firestore or db.js.

Render behavior:

- app.js updates `state.searchQuery` and `state.filters`.
- app.js computes the filtered array.
- app.js calls `ui.renderTaskList(filteredTasks, state.filters, state.searchQuery)`.
- `ui.renderTaskList()` renders the array it receives and does not filter again.

## Category Source Contract

Category filter options should come from:

- `CATEGORIES` constants, and
- categories present in the current in-memory task list.

Session 13 should de-duplicate and sort category labels before passing them to
`ui.renderTaskFilters(filters, categories)`.

Do not read categories from Firestore in Session 9.

## Empty State Contract

`ui.renderTaskList()` already chooses `no-search-results` when the search query
or any filter is active.

Session 9 must preserve this behavior:

- No tasks with no active search/filter: show no-tasks empty state.
- No tasks after active search/filter: show no-search-results empty state.

Do not create a separate no-filter-results container.

## CSS Requirements

Append search-filter styles to the end of `style.css` under a clear Session 9
comment header.

Required classes:

- `.task-filter-bar`
- `.task-filter-group`
- `.task-filter-group__label`
- `.task-filter-options`
- `.task-filter-option`
- `.task-filter-option--active`
- `.task-filter-select`

Rules:

- Use existing CSS variables only.
- Do not hardcode hex colors.
- Keep mobile-first layout.
- Controls must wrap on narrow screens.
- Touch targets must be at least 44px on mobile.
- Do not introduce horizontal scrolling.
- Keep filters visually compact because this is an operational task list, not a
  marketing section.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, or `fetch` from ui.js.
- Do not add event listeners in ui.js.
- Do not mutate app state from ui.js.
- Do not implement filtering logic in ui.js.
- Do not modify db.js.
- Do not create additional Firestore indexes.
- Do not create another task list container.
- Do not use `innerHTML` for user or Firestore data.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm no console errors.
- Confirm `#search-input` remains the only search input.
- Call `ui.renderTaskFilters({ status: 'all', priority: 'all', category: 'all' }, ['Work', 'School'])`.
- Confirm `#task-filter-bar` renders status, priority, and category controls.
- Call `ui.updateActiveFilters({ status: 'done', priority: 'high', category: 'School' })`.
- Confirm active filter states update without re-rendering `#task-list`.
- Confirm `ui.renderTaskList([], { status: 'done', priority: 'all', category: 'all' }, '')` shows the no-search-results empty state.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css js/ui.js
git commit -m "feat: build task search and filter controls"
git push origin dev
```
