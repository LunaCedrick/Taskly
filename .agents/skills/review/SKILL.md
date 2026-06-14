---
name: review
description: "Run Taskly Session 14 QA or the required post-session review using deterministic static checks plus targeted manual/runtime verification. Use after every build session before commit, and for full-codebase QA against AGENTS.md and PLAN.md."
---

# Session 14 Skill: review

## Purpose

Run the Taskly QA gate. This skill is both:

- the required review after every build session
- Session 14 full-codebase QA after Sessions 1-13 are implemented

`AGENTS.md` is the source of truth. `PLAN.md` is the product and architecture reference. The static script handles repeatable checks; the reviewer handles runtime behavior, browser/Firebase checks, and judgment calls.

## Required Reading

Read these before reviewing:

- `AGENTS.md`
- `PLAN.md`
- `.agents/skills/review/SKILL.md`

If `.agents/ALIGNMENT_FIXES.md` has active items, use the alignment-fix workflow before accepting a review as final.

## Review Workflow

1. Run the deterministic static audit:

```powershell
python .agents\skills\review\scripts\static_review.py --session SESSION_NUMBER --skill SKILL_NAME
```

2. Inspect every `FAIL` and `WARN` from the script.
3. Perform the relevant manual checks from `scripts/runtime_checklist.md`.
4. Fix all `FAIL` items before commit.
5. Rerun the static audit after fixes.
6. Output the formal report using the exact format below.

The static script is read-only. It must never edit, format, stage, commit, generate production artifacts, or mutate tracked project files.

## What Static QA Covers

The script checks the repeatable parts of AGENTS/PLAN:

- Git safety: branch, changed files, staged risks, `config.js`, `node_modules`
- HTML contracts: inline styles/handlers, script order, required IDs, canonical `#notif-count`
- CSS contracts: color token presence, hardcoded hex outside `:root`, `!important`, transition/animation risks
- JavaScript contracts: `node --check`, `var`, `console.log`, `eval`, dynamic scripts, `innerHTML`, JSDoc coverage
- Module boundaries: no Firebase in UI, no DOM in DB/auth, no direct Firebase in app, listener tracking in app
- Firebase architecture: compat SDK, no modular imports, persistence call, collection group user filter, task `userId`
- Contract drift: stale names/APIs such as legacy notification badge ID and old DB API names
- Current alignment contracts: UI helper boundary, settings navigation, notification settings status/help, dashboard listener resubscribe

Treat script `FAIL` output as blocking unless the script itself is clearly wrong. If the script is wrong, fix the review script or document the exact false positive in the report.

## What Manual QA Must Cover

Use `scripts/runtime_checklist.md` for behavior that static analysis cannot prove:

- real Google sign-in and sign-out
- Firestore project/task CRUD
- dashboard aggregation and transient dashboard listener recovery
- realtime updates across tabs/devices
- offline queue and sync on reconnect
- notification panel, in-app alerts, and browser notification permission behavior
- browser console and missing asset checks
- 375px responsive smoke check

If browser automation cannot start or times out before app assertions run, report:

```text
WARN - Browser Check - automation unavailable or timed out
```

Do not count unavailable automation as `PASS`. Do not count it as `FAIL` unless the session explicitly requires a runtime browser pass and no alternative validation is acceptable.

## Current Contracts To Enforce

- `#notif-count` is the only notification badge ID; stale `#notification-count` is not allowed in production code.
- `app.js` owns state and event listeners.
- `app.js` must use `ui.renderSidebarUser()`, task modal validation helpers, and project modal validation helpers for those user-visible writes when the helpers exist.
- Settings must have a visible `data-view="settings"` navigation entry.
- Settings v1 shows notification permission status/help and must not promise a working enable toggle unless a public permission request contract exists.
- `listenToDashboardTasks()` transient `"Unable to load data. Please try again."` errors must trigger app-level re-subscribe instead of a persistent user error.
- Every Firestore listener unsubscribe must be tracked and cleaned up on sign-out.
- New tasks must include `userId` through the DB write path.
- No scheduled 8AM push notifications belong in MVP.

## Formal Report Format

Output exactly:

```text
SESSION REVIEW REPORT
Session: [number] - [skill name]
Date: [date]

SUMMARY
PASS : [count]
WARN : [count]
FAIL : [count]

FAILS - must fix before commit
FAIL - [section] - [item] - [what to fix]

WARNINGS - note but not blocking
WARN - [section] - [item] - [note]

FIXES APPLIED
- [description of each fix made]

FINAL STATUS
[READY TO COMMIT] or [DO NOT COMMIT - fixes pending]
```

If there are no failures, write `None.` under `FAILS`. If there are no warnings, write `None.` under `WARNINGS`.

## Hard Fail Rules

These are always blocking:

- `innerHTML` in production JavaScript
- `var` in production JavaScript
- `console.log` in committed JavaScript
- `config.js` staged or tracked
- Firebase modular imports
- async Firebase write/read/listener path without error handling
- task write path missing `userId`
- function without JSDoc in production JavaScript
- inline style or inline JS handler in HTML
- hardcoded color hex outside `:root`
- direct Firebase calls from `app.js`
- Firebase calls or application state management in `ui.js`
- DOM access or UI rendering in `db.js`

Do not mark `READY TO COMMIT` with any hard fail open.
