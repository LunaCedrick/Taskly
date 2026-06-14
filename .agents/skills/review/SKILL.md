---
name: review
description: Run a full QA audit of all code produced in the current session, based on the rules in AGENTS.md
---
## Session: Run after EVERY session (required by AGENTS.md §16)
## Scope: Full QA audit of all code produced in the current session
## References: AGENTS.md §2, §4, §5, §6, §8, §9, §10, §11, §12, §13, §14

---

AGENTS.md is the source of truth for every rule in this checklist.
This skill translates those rules into a structured pass/fail audit.
Run this after every session — before every commit.

Output format for every item:
✅ PASS — rule satisfied
⚠️ WARN — not a blocker but should be noted
❌ FAIL — must be fixed before committing

Do not commit with any ❌ FAIL items open.

---

## HOW TO RUN THIS REVIEW

1. Read every checklist item below
2. Check the code produced in this session against it
3. Output a full report — every item gets ✅ ⚠️ or ❌
4. Fix all ❌ FAIL items immediately
5. Re-check fixed items and confirm ✅
6. List every change made during fixes
7. Only then proceed to commit

---

## 1. FILE SCOPE — Did this session touch only what it should?

- [ ] Only the files assigned to this session were modified
- [ ] No module was edited outside its assigned skill scope
- [ ] No new files were created that are not in AGENTS.md §4
- [ ] No files were deleted that should still exist

---

## 2. HTML AUDIT — See AGENTS.md §10

- [ ] Semantic tags used — header, nav, main, section, aside, footer
- [ ] No inline styles anywhere in HTML
- [ ] No JS logic in HTML — no onclick, no onchange attributes
- [ ] All images have descriptive alt attributes
- [ ] All interactive elements have aria-label or aria-labelledby
- [ ] All modals have role="dialog" and aria-modal="true"
- [ ] All error messages have role="alert"
- [ ] Scripts at bottom of body only
- [ ] Script load order matches AGENTS.md §4 exactly:
      config.js → auth.js → router.js → db.js → ui.js → app.js
- [ ] Firebase CDN scripts load before config.js in head
- [ ] Google Fonts link loads before style.css in head
- [ ] All HTML IDs match AGENTS.md §9 — no invented IDs

---

## 3. CSS AUDIT — See AGENTS.md §2, §10

- [ ] All styles are in style.css — no inline styles, no style tags
- [ ] All color values use CSS custom properties — no hardcoded hex
- [ ] All --color-* tokens from AGENTS.md §2 are present in :root
- [ ] No CSS frameworks referenced — no Bootstrap, Tailwind, etc.
- [ ] Animations use only transform and opacity
- [ ] All transitions are 0.15s ease
- [ ] No !important declarations
- [ ] CSS sections have comment headers explaining purpose
- [ ] BEM naming followed — .block__element--modifier
- [ ] All class names are kebab-case

---

## 4. JAVASCRIPT AUDIT — See AGENTS.md §10

- [ ] ES6+ only — const and let used, never var
- [ ] No jQuery or any external JS libraries
- [ ] No eval(), no dynamic script creation
- [ ] textContent used for ALL user-supplied or Firestore data
- [ ] innerHTML never used for external data — zero exceptions
- [ ] try/catch wraps every async Firebase operation
- [ ] Every function has a JSDoc comment above it
- [ ] JSDoc includes @param and @returns for every function
- [ ] No console.log statements anywhere
- [ ] No commented-out code blocks
- [ ] All function names are camelCase
- [ ] All variable names are camelCase
- [ ] All constants are SCREAMING_SNAKE_CASE
- [ ] No function exceeds ~25 lines — split if longer

---

## 5. MODULE BOUNDARY AUDIT — See AGENTS.md §5

Run this for every module touched this session.

### config.js
- [ ] No functions defined
- [ ] No DOM access
- [ ] No Firestore queries

### auth.js (if touched)
- [ ] No DOM manipulation
- [ ] No Firestore read queries
- [ ] No application state assignments (state.anything)

### router.js (if touched)
- [ ] No Firebase calls beyond firebase.auth().currentUser
- [ ] No application state assignments
- [ ] No event listeners for user actions
- [ ] No ui.render*() calls

### db.js (if touched)
- [ ] No DOM access — never touches HTML
- [ ] No ui.render*() calls
- [ ] No application state assignments

### ui.js (if touched)
- [ ] No Firebase calls of any kind
- [ ] No application state assignments
- [ ] No business logic — rendering only
- [ ] textContent used for all external data

### app.js (if touched)
- [ ] No user-visible DOM writes when AGENTS.md defines a ui.js helper
- [ ] No direct Firebase calls — always calls db.js
- [ ] All Firestore listener references stored in state.listeners

---

## 6. APPLICATION STATE AUDIT — See AGENTS.md §6

Only relevant if app.js was touched this session.

- [ ] state object lives only in app.js — nowhere else
- [ ] state object contains all required fields from AGENTS.md §6:
      user, currentProjectId, projects, tasks, dashboardTasks,
      activities, filters, searchQuery, notifications,
      listeners, isOffline
- [ ] No other module reads or writes state directly
- [ ] Every onSnapshot reference is pushed to state.listeners
- [ ] Listener cleanup on sign-out calls all unsub functions
- [ ] state.listeners reset to [] after cleanup

---

## 7. SECURITY AUDIT — See AGENTS.md §13

- [ ] config.js is NOT staged in git status
- [ ] config.js is in .gitignore
- [ ] config.example.js has no real API key values
- [ ] No real Firebase keys appear anywhere in committed files
- [ ] textContent used everywhere — no innerHTML for external data
- [ ] All Firestore input is trimmed before writing
- [ ] Priority values validated against allowed set before writing
- [ ] Status values validated against allowed set before writing
- [ ] External links use rel="noopener noreferrer"
- [ ] No eval() anywhere
- [ ] No dynamic script creation anywhere

---

## 8. ERROR HANDLING AUDIT — See AGENTS.md §8

- [ ] Every async Firebase operation has try/catch
- [ ] No raw Firebase error codes shown to users
- [ ] Every caught error maps to a human-readable message
- [ ] Human-readable messages match AGENTS.md §8 table exactly
- [ ] Errors render in context — not only in the console
- [ ] Error elements have role="alert"
- [ ] No silent failures — every error path is visible

---

## 9. FIREBASE ARCHITECTURE AUDIT — See AGENTS.md §7

Only relevant for sessions touching Firebase directly.

- [ ] Every task document includes userId field
- [ ] Collection group query filters by userId
- [ ] One listener per collection — never one per document
- [ ] Offline persistence enabled in config.js using compat style:
      db_firestore.enablePersistence({ synchronizeTabs: false })
- [ ] No modular Firebase imports (import { } from 'firebase/...')
- [ ] All Firebase access uses compat SDK globals

---

## 10. GIT AUDIT — See AGENTS.md §14

Run before every commit.

- [ ] git status shows no config.js
- [ ] git status shows no node_modules
- [ ] Commit message follows convention from AGENTS.md §14:
      feat: / fix: / style: / refactor: / docs:
- [ ] Only files from this session's scope are staged
- [ ] No console.log statements in staged files
- [ ] Pushing to dev branch — never directly to main

---

## 11. BROWSER CHECK

Open index.html in browser and confirm:

- [ ] No errors in browser console
- [ ] No 404s for any linked file (CSS, JS, fonts)
- [ ] Correct fonts loaded — DM Sans visible
- [ ] Correct colors — violet accent, indigo sidebar
- [ ] No layout breaks at 375px viewport width
- [ ] Expected behavior for this session works end to end

If browser automation cannot start or times out before app assertions run:

- Report `⚠️ WARN — Browser Check — automation unavailable or timed out`.
- Do not report browser availability as `✅ PASS`.
- Do not report browser availability as `❌ FAIL` unless the session
  explicitly requires a runtime browser pass and no alternative validation is
  acceptable.
- Continue and list static checks separately.

---

## REPORT FORMAT

Output exactly this structure after running the audit:

```
SESSION REVIEW REPORT
Session: [number] — [skill name]
Date: [date]

SUMMARY
✅ PASS : [count]
⚠️ WARN : [count]
❌ FAIL : [count]

FAILS — must fix before commit
❌ [section] — [item] — [what to fix]

WARNINGS — note but not blocking
⚠️ [section] — [item] — [note]

FIXES APPLIED
- [description of each fix made]

FINAL STATUS
[READY TO COMMIT] or [DO NOT COMMIT — fixes pending]
```

---

## HARD RULES — NON-NEGOTIABLE

These items are instant ❌ FAIL regardless of context.
No exceptions. No justifications accepted.

```
innerHTML used for external data          → ❌ FAIL always
var used anywhere                         → ❌ FAIL always
console.log in committed code             → ❌ FAIL always
config.js staged in git                   → ❌ FAIL always
Firebase modular imports used             → ❌ FAIL always
No try/catch on async Firebase operation  → ❌ FAIL always
userId missing from task document         → ❌ FAIL always
Function has no JSDoc comment             → ❌ FAIL always
Inline style in HTML                      → ❌ FAIL always
Hardcoded color hex outside :root         → ❌ FAIL always
```
