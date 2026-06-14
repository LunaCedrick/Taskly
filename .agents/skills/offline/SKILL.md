---
name: offline
description: "Session 11 of 17: build Taskly offline support UI contracts for Firestore persistence verification, offline banner behavior, online/offline state handling, and sync-on-reconnect expectations. Use after notification UI exists, while leaving app.js network event wiring and state mutation to Session 13."
---

# Session 11 - Offline

## Purpose

Build the offline-support contract so Taskly clearly communicates offline mode,
verifies Firestore persistence, and remains ready for app.js to wire browser
network events without adding a custom sync system.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/offline/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve offline-support product scope.
- Inspect `js/config.js`, `js/ui.js`, `index.html`, `style.css`, and
  `js/app.js` for the actual current offline contracts.
- Do not preload prior skill files unless a contract conflict cannot be
  resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 11
offline-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- Offline banner UI contract refinements.
- Offline banner accessibility and responsive styling refinements.
- Verification that Firestore offline persistence is enabled in `js/config.js`.
- Session 13 contract for browser `online` and `offline` event wiring.
- Sync-on-reconnect behavior expectations for app.js.

This session does not build:

- No app.js network event wiring.
- No app.js state mutation.
- No custom sync engine.
- No polling or retry loop.
- No manual Firestore re-query on reconnect.
- No Firestore CRUD changes.
- No auth, router, notification, search, or task feature changes.

Session 13 wires network events, `state.isOffline`, and calls to
`ui.showOfflineBanner()` and `ui.hideOfflineBanner()`.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`
- `js/ui.js`

Do not modify `js/config.js`, `js/db.js`, `js/auth.js`, `js/router.js`, or
`js/app.js` in this session.

`js/config.js` is inspect-only for this session. If offline persistence is
missing or incorrectly configured, stop and report the mismatch instead of
editing config.

## Existing Implementation Assumptions

- `#offline-banner` already exists in `index.html`.
- `ui.showOfflineBanner()` already exists.
- `ui.hideOfflineBanner()` already exists.
- `app.js` already defines `state.isOffline`.
- `js/config.js` should call
  `db_firestore.enablePersistence({ synchronizeTabs: false })` after Firebase
  initialization.

## Required DOM Targets

Use only canonical IDs from `AGENTS.md`.

Required existing target:

- `#offline-banner`

Do not create a second offline banner. Do not create separate syncing,
reconnecting, or retry banners in this session.

## Offline Persistence Verification

Verify that `js/config.js` enables Firestore persistence using compat syntax:

```javascript
db_firestore.enablePersistence({ synchronizeTabs: false })
```

Rules:

- The call must happen after `firebase.initializeApp(firebaseConfig)` and after
  `db_firestore` is initialized.
- The configuration must stay compat-style because the project uses Firebase
  compat CDN scripts.
- Multiple-tab `failed-precondition` and unsupported-browser `unimplemented`
  cases may be logged as development warnings.
- Do not surface these persistence setup warnings as blocking user-facing
  errors in the app UI.
- Do not switch to modular Firebase imports.

If this persistence call is missing or wrong, stop and report it as a blocking
contract mismatch for the user to decide, because `js/config.js` is not an
allowed build file for Session 11.

## Required UI Functions

Preserve these exported functions in `js/ui.js`:

- `showOfflineBanner()`
- `hideOfflineBanner()`

Function requirements:

- `showOfflineBanner()` reveals `#offline-banner`.
- `hideOfflineBanner()` hides `#offline-banner`.
- Both functions are safe no-ops when the banner does not exist.
- Neither function reads or mutates app state.
- Neither function attaches network event listeners.

Do not add Firebase or network checks to ui.js.

## Offline Banner Requirements

The banner must communicate that changes are queued and will sync later.

Required or equivalent copy:

`Offline Mode - Changes will sync automatically`

Rules:

- Keep `role="alert"` on `#offline-banner`.
- Keep the banner hidden by default.
- The banner must be visible above app content when shown.
- The banner must not block task creation, editing, completion, or deletion UI.
- The banner must be readable at 375px without horizontal scrolling.
- The banner must not duplicate error banners; offline writes are not errors.

## Session 13 Network Wiring Contract

Session 11 documents this contract only. Do not implement it here.

Later app.js behavior:

- Initialize `state.isOffline` from `navigator.onLine === false`.
- Listen to browser `offline` events.
- On offline transition:
  - Set `state.isOffline = true`.
  - Call `ui.showOfflineBanner()`.
- Listen to browser `online` events.
- On online transition:
  - Set `state.isOffline = false`.
  - Call `ui.hideOfflineBanner()`.
- Do not call Firestore SDK APIs directly from app.js.
- Do not create manual sync logic; Firestore handles queued writes.

## Sync-On-Reconnect Contract

Firestore owns offline write queueing and synchronization.

Rules:

- Creating tasks offline should rely on existing db.js writes.
- Editing tasks offline should rely on existing db.js writes.
- Completing tasks offline should rely on existing db.js writes.
- Deleting tasks offline should rely on existing db.js writes.
- Reconnect should not force duplicate writes.
- Reconnect should not manually replay mutations from app state.
- Reconnect should not clear local state optimistically unless Firestore
  listeners provide fresh data.

Session 13 may re-render current cached state after reconnect, but must not
invent a separate persistence layer.

## Error Handling

Use the user-facing messages from `AGENTS.md`.

- Network failure: `"Connection lost. Check your internet."`
- Firebase load failure: `"Unable to load data. Please try again."`
- Offline write queued: no error; Firestore handles silently.
- Unknown failure: `"Something went wrong. Please try again."`

Offline mode itself is not an error. Do not render an error banner only because
`navigator.onLine` is false.

## CSS Requirements

Append offline-specific styles to the end of `style.css` under a clear Session
11 comment header only when existing styles are insufficient.

Potential required classes:

- `.offline-banner`
- `.offline-banner__message`

Rules:

- Use existing CSS variables only.
- Do not hardcode hex colors.
- Keep mobile-first layout.
- The banner must remain readable at 375px.
- Do not introduce horizontal scrolling.
- Use transform and opacity only for any animation.
- Keep the visual treatment distinct from destructive/error states.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, or `fetch` from ui.js.
- Do not add `online` or `offline` event listeners in ui.js.
- Do not mutate app state from ui.js.
- Do not modify `js/config.js` in this session.
- Do not modify db.js.
- Do not modify app.js.
- Do not implement custom offline storage.
- Do not use localStorage for queued task writes.
- Do not treat offline queued writes as user-facing errors.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm no console errors.
- Confirm `#offline-banner` exists, is hidden by default, and has
  `role="alert"`.
- Call `ui.showOfflineBanner()` and confirm the banner appears.
- Call `ui.hideOfflineBanner()` and confirm the banner hides.
- Confirm the banner has no horizontal overflow at 375px.
- Confirm `js/config.js` contains
  `db_firestore.enablePersistence({ synchronizeTabs: false })`.
- Confirm no network event listeners were added outside the future Session 13
  app.js wiring contract.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css js/ui.js
git commit -m "feat: build offline support UI contracts"
git push origin dev
```
