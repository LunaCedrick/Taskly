# Taskly Session Skill Template

Use this template when drafting or updating Taskly build skills for Sessions 6-17.
This is an authoring template only. It is not a build session and should not be
run directly as a project implementation skill.

Every generated session skill must stay aligned with `AGENTS.md` and the
session scope. Use `PLAN.md` and prior skills only as conditional references.
Do not duplicate the full project rules in each skill; reference them and add
only session-specific instructions.

---

## Template

```markdown
# Session NN - SESSION_NAME

## Purpose

One concise paragraph explaining what this session builds and why it exists in
the Taskly workflow.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/SESSION_NAME/SKILL.md`

Do not preload every prior skill. Load extra context only when needed:

- Read `PLAN.md` only to resolve unclear scope, sequencing, or product intent.
- Read a prior skill only when this session directly depends on that skill's
  contract and the contract is not already clear from `AGENTS.md` or current
  code.
- Prefer inspecting the actual current file over reading a prior skill when
  implementation details matter.

## Source Of Truth

`AGENTS.md` is the source of truth for architecture, naming, design tokens,
module boundaries, error handling, accessibility, and Firestore constraints.
If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- ITEM_1
- ITEM_2
- ITEM_3

This session does not build:

- FUTURE_SESSION_ITEM_1
- FUTURE_SESSION_ITEM_2
- ANYTHING_OUTSIDE_THIS_SCOPE

## Allowed Files

This session may modify only:

- `path/to/file.ext`
- `path/to/file.ext`

Do not modify completed prior-session modules unless this skill explicitly says
to do so. If a required change appears outside this file list, stop and report it.

## Existing Implementation Assumptions

State only the assumptions this session needs. Keep this section short.

Example:

- `db.js` already exposes `listenToDashboardTasks()`.
- `ui.js` already exposes shared card, empty-state, and skeleton helpers.

Do not restate every completed module contract unless the session depends on it.

## Required DOM Targets

Use only canonical IDs from `AGENTS.md`.

- `#view-login`
- `#view-app`
- `#sidebar`
- `#main-content`
- `#topbar`
- `#search-input`
- `#notification-bell`
- `#notif-count`
- `#sidebar-project-list`
- `#view-dashboard`
- `#view-project`
- `#view-settings`
- `#task-list`
- `#fab-add-task`
- `#offline-banner`

If a DOM target belongs to a later session, do not create fake runtime behavior
for it. Either leave the renderer as a safe no-op or state that the target will
be introduced by the owning session.

Important ownership notes:

- `#view-dashboard` is owned by Session 6.
- `#sidebar-project-list` is populated by project/dashboard orchestration.
- `#task-list` belongs inside `#view-project` and is introduced by Sessions 7-8.
- Modal IDs are owned by the UI and task/project sessions that use them.

## Data Flow

Follow this direction only:

```text
Firebase -> db.js -> app.js state -> ui.js renderers -> DOM
DOM events -> app.js handlers -> db.js writes
Auth state -> router.js -> app.js init or cleanup
```

Never invert this flow.

## Module Boundary Rules

- `db.js` must not touch the DOM.
- `ui.js` must not call Firebase, Firestore, Auth, FCM, or `fetch`.
- `router.js` must not contain business logic or Firestore operations.
- `auth.js` must not render UI or manage application state.
- `app.js` must not directly call Firestore SDK APIs; use `db.js`.
- User and Firestore data must be rendered with `textContent`, never `innerHTML`.
- Every async Firebase operation must be wrapped in `try/catch`.
- Every function must have a JSDoc block.

## Required Behavior

Describe exact behavior here in implementation order.

1. BEHAVIOR_1
2. BEHAVIOR_2
3. BEHAVIOR_3

## Error Handling

Use the user-facing messages from `AGENTS.md`.

- Empty task title: `"Please enter a task title."`
- Missing project: `"This project no longer exists."`
- Firebase load failure: `"Unable to load data. Please try again."`
- Unknown failure: `"Something went wrong. Please try again."`

Do not show raw Firebase error codes to users.

## Firestore And Listener Rules

- Every task document must include `userId`.
- Store every Firestore unsubscribe function in app state when listeners are
  created.
- Detach every listener on sign-out.
- Use one collection listener per collection, never per document.
- Use collection group queries only for dashboard aggregation.

Dashboard listener resilience:

- `listenToDashboardTasks()` may emit a transient `"Unable to load data. Please try again."`
  after deleting a project and its tasks in one batch.
- Session 13 must re-subscribe to the dashboard listener when this happens.
- Do not show this specific transient dashboard listener error as a persistent
  user-facing error banner.

## UI And Accessibility Requirements

- Preserve the Taskly design system from `AGENTS.md`.
- Use CSS variables for colors.
- Do not add inline styles.
- Keep mobile-first behavior.
- Interactive controls need accessible labels.
- Modals need `role="dialog"`, `aria-modal="true"`, focus handling, and Escape
  close behavior when the session owns modal behavior.
- Loading states use skeletons.
- Empty states use `aria-live="polite"`.
- Error banners use `role="alert"` and must be dismissible.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.
```

---

## Session Drafting Rules

When drafting an actual Session 6-17 skill from this template:

- Replace every placeholder before using the skill.
- Keep the final skill specific to one session.
- Do not copy broad project sections from `AGENTS.md` unless the session needs a
  narrowed version of the rule.
- Keep required reading minimal: `AGENTS.md` plus the active session skill.
- State allowed files explicitly.
- State what belongs to later sessions explicitly.
- Include only a short review handoff, not a duplicated checklist.
- Keep future-session notes short and concrete.

## Known Stale Terms To Avoid

Do not introduce these names in new skills unless the codebase is intentionally
migrating them:

- `#notification-count`
- `#dashboard-view`
- `#project-view`
- `#content`
- `getProjects`
- `getTasks`
- `subscribeToProjects`
- `subscribeToTasks`
- `logout`
- `window.auth` as the Firebase Auth instance

Use the canonical names from `AGENTS.md` instead.
