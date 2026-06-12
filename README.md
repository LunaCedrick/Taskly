# Taskly

Taskly is a real-time multi-project task manager built with HTML, CSS, vanilla JavaScript, and Firebase compat SDKs. The product goal is a dashboard-first task manager that surfaces what needs attention today across all projects.

## Status

Taskly is in active development. The project shell and Firebase data/auth foundations are in place, but the main UI rendering and app orchestration layers are not built yet.

Implemented now:
- Base single-page shell in [index.html](/abs/path/c:/Users/Cedrick/Desktop/Personal%20projects/Taskly/index.html:1)
- Global design tokens and app shell styling in [style.css](/abs/path/c:/Users/Cedrick/Desktop/Personal%20projects/Taskly/style.css:1)
- Firebase initialization, constants, and offline persistence wiring in `js/config.js`
- Google Sign-In, session persistence, sign-out, and first-login notification permission flow in [js/auth.js](/abs/path/c:/Users/Cedrick/Desktop/Personal%20projects/Taskly/js/auth.js:1)
- View switching helpers for login vs app shell in [js/router.js](/abs/path/c:/Users/Cedrick/Desktop/Personal%20projects/Taskly/js/router.js:1)
- Firestore project/task CRUD, profile persistence, activity logging, and dashboard collection-group listener in [js/db.js](/abs/path/c:/Users/Cedrick/Desktop/Personal%20projects/Taskly/js/db.js:1)

Not implemented yet:
- Shared UI render layer in `js/ui.js`
- Application state orchestration and event wiring in `js/app.js`
- Dashboard, project management UI, task management UI, search/filter UI, notifications UI, offline UX, settings view, responsive pass, accessibility pass, and performance pass

## Session Progress

Completed:
- Session 1: setup
- Session 2: auth
- Session 3: router
- Session 4: db

Pending:
- Sessions 5-17

Recent project notes:
- `AGENTS.md` now includes dashboard listener resilience guidance for the transient collection-group listener error seen after batched project deletes.
- `config.example.js` now matches the compat CDN syntax used by `js/config.js` and no longer uses ES module export syntax.

## What Works Today

- The Firebase compat SDKs load from CDN in the required order.
- The login screen and app shell markup render.
- Google sign-in can be initiated through Firebase Auth.
- Auth persistence is configured to stay local across reloads.
- Firestore helper functions exist for projects, tasks, user profile writes, activity logging, and dashboard task listening.
- Firestore offline persistence is enabled with the compat API.

## Current Limitations

- There is no working end-to-end app flow yet because `ui.js` and `app.js` are still stubs.
- Project and task CRUD are implemented at the database layer, but not connected to interactive UI.
- Dashboard rendering is planned, but not implemented.
- Notification UI and settings UI are planned, but not implemented.
- `js/config.js` is a local file and is gitignored; each developer must provide their own Firebase config.

## Local Setup

1. Copy `config.example.js` to `js/config.js`.
2. Fill in your Firebase project values in `js/config.js`.
3. Enable Google Sign-In in Firebase Authentication.
4. Create a Firestore database and apply the user-scoped security rules from `AGENTS.md`.
5. Serve the project with any simple static server.

Example:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Firebase Notes

- SDK style is Firebase compat CDN only. No bundler and no ES module imports.
- The dashboard depends on a `collectionGroup('tasks')` query filtered by `userId`.
- Every task document must include `userId`.
- Offline persistence uses `db_firestore.enablePersistence({ synchronizeTabs: false })`.
- The dashboard query will need the Firestore composite index described in `PLAN.md` once the dashboard UI is wired.

## Verification Snapshot

Confirmed so far:
- Firebase initializes in the browser.
- `window.auth.signInWithGoogle()` is callable.
- A real browser click opens the Firebase/Google sign-in popup.

Not yet confirmed:
- Completing a full Google login flow against the working app UI
- Rendering projects and tasks from live Firestore data
- Dashboard live updates through the UI
- End-to-end offline behavior through the UI

## Repo Structure

```text
.
├── index.html
├── style.css
├── js/
│   ├── config.js
│   ├── auth.js
│   ├── router.js
│   ├── db.js
│   ├── ui.js
│   └── app.js
├── AGENTS.md
├── PLAN.md
├── DOCUMENTATION.md
├── config.example.js
└── README.md
```
