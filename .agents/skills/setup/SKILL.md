---
name: setup
description: Build the project skeleton — folder structure, HTML shell, CSS tokens, JS module stubs. No features yet.
---
## Session: 1 of 17
## Scope: Folder structure · HTML shell · CSS tokens · JS module stubs
## References: AGENTS.md (all rules, design system, module boundaries)

---

AGENTS.md is the source of truth.
This file adds only what is specific to Session 1.
Do not repeat anything already defined in AGENTS.md.

---

## WHAT THIS SESSION BUILDS

Session 1 produces a working skeleton — no features, no Firebase calls.
Every file exists. Every module is stubbed. The browser opens index.html
and renders the correct layout with correct colors and fonts.
Nothing is interactive yet. That starts in Session 2.

---

## WHAT THIS SESSION DOES NOT BUILD

- No Firebase initialization (config.js is stubbed only)
- No authentication logic
- No Firestore calls
- No event listeners
- No rendered data — no tasks, no projects
- No modals, no notifications, no search

If it is not in the scope above — do not build it.

---

## 1. FOLDER STRUCTURE

Create exactly this. No extra files. No extra folders.

```
taskly/
├── index.html
├── style.css
├── js/
│   ├── config.js
│   ├── auth.js
│   ├── router.js
│   ├── db.js
│   ├── ui.js
│   └── app.js
├── .agents/
│   └── skills/
│       └── setup/
│           └── SKILL.md          ← this file
├── .gitignore
├── config.example.js
├── AGENTS.md
├── PLAN.md
├── DOCUMENTATION.md
└── README.md
```

.gitignore must contain at minimum:
```
js/config.js
.DS_Store
```

config.example.js is committed. It shows structure only — no real values:
```javascript
// config.example.js
// Copy this file to js/config.js and fill in your Firebase values.
// NEVER commit js/config.js — it contains real API keys.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  vapidKey: "YOUR_VAPID_KEY"
};
```

---

## 2. index.html — SHELL STRUCTURE

Build the complete HTML skeleton. All views present. All IDs correct.
No inline styles. No inline scripts. No placeholder content beyond
what is listed here.

### Head
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Taskly</title>

  <!-- Google Fonts — DM Sans — must load before style.css -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />

  <!-- Firebase compat SDKs — must load before config.js -->
  <script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js"></script>

  <link rel="stylesheet" href="style.css" />
</head>
```

### Body — View Regions

Two top-level views. Only one visible at a time (router.js manages this).

```html
<body>

  <!-- ── LOGIN VIEW ─────────────────────────────────── -->
  <div id="view-login" class="view">
    <div class="login-card">
      <h1 class="login-title">Taskly</h1>
      <p class="login-subtitle">Sign in to manage your tasks</p>
      <button id="btn-google-signin" class="btn-primary">
        Sign in with Google
      </button>
      <p id="login-error" class="login-error" role="alert" hidden></p>
    </div>
  </div>

  <!-- ── APP VIEW ───────────────────────────────────── -->
  <div id="view-app" class="view" hidden>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">

      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="sidebar-app-name">Taskly</span>
      </div>

      <!-- Primary nav -->
      <nav class="sidebar-nav" aria-label="Main navigation">
        <a href="#" class="nav-item active" data-view="dashboard"
           aria-label="Dashboard">
          Dashboard
        </a>
        <a href="#" class="nav-item" data-view="tasks"
           aria-label="My Tasks">
          My Tasks
        </a>
      </nav>

      <!-- Projects section -->
      <div class="sidebar-section-label">Projects</div>
      <div id="sidebar-project-list" class="sidebar-project-list">
        <!-- rendered by ui.js -->
      </div>
      <button id="btn-new-project" class="btn-new-project"
              aria-label="Create new project">
        + New Project
      </button>

      <!-- User profile -->
      <div class="sidebar-user" id="sidebar-user">
        <img id="user-photo" class="user-photo" src="" alt="User profile photo" />
        <div class="user-info">
          <span id="user-name" class="user-name"></span>
          <button id="btn-signout" class="btn-signout"
                  aria-label="Sign out of Taskly">
            Sign out
          </button>
        </div>
      </div>

    </aside>

    <!-- Main content -->
    <div class="main">

      <!-- Topbar -->
      <header class="topbar">
        <button class="hamburger" id="btn-hamburger"
                aria-label="Toggle navigation menu"
                aria-expanded="false">
          &#9776;
        </button>
        <h1 class="topbar-title" id="topbar-title">Dashboard</h1>
        <div class="topbar-actions">
          <input
            type="search"
            id="search-input"
            class="search-input"
            placeholder="Search tasks…"
            aria-label="Search tasks"
          />
          <button id="btn-add-task" class="btn-primary"
                  aria-label="Add new task">
            + Add Task
          </button>
          <button id="notification-bell" class="notification-bell"
                  aria-label="Notifications 0 unread">
            &#128276;
            <span id="notif-count"
                  class="notification-count"
                  hidden>0</span>
          </button>
        </div>
      </header>

      <!-- Content region — views swap here -->
      <main class="content" id="main-content">

        <!-- Dashboard view -->
        <section id="view-dashboard" class="content-view">
          <!-- rendered by ui.js in Session 6 -->
        </section>

        <!-- Project / task list view -->
        <section id="view-project" class="content-view" hidden>
          <!-- rendered by ui.js in Session 7–8 -->
        </section>

        <!-- Settings view -->
        <section id="view-settings" class="content-view" hidden>
          <!-- rendered by ui.js in Session 12 -->
        </section>

      </main>

    </div><!-- /.main -->

  </div><!-- /#view-app -->

  <!-- ── GLOBAL OVERLAYS ────────────────────────────── -->

  <!-- Offline banner -->
  <div id="offline-banner" class="offline-banner" hidden
       role="status" aria-live="polite">
    Offline Mode — Changes will sync automatically
  </div>

  <!-- Notification panel -->
  <div id="notification-panel" class="notification-panel" hidden
       aria-live="polite"></div>

  <!-- Modal overlay -->
  <div id="modal-overlay" class="modal-overlay" hidden
       role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div id="modal-panel" class="modal-panel">
      <!-- injected by ui.js -->
    </div>
  </div>

  <!-- FAB -->
  <button id="fab-add-task" class="fab" aria-label="Add new task"
          hidden>+</button>

  <!-- ── SCRIPTS — load order is mandatory ──────────── -->
  <script src="js/config.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/router.js"></script>
  <script src="js/db.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/app.js"></script>

</body>
</html>
```

---

## 3. style.css — CSS SETUP

Three sections this session. In this order:

### Section 1 — CSS Reset
```css
/* ── RESET ───────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-primary);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  font-family: inherit;
  cursor: pointer;
}

img {
  display: block;
  max-width: 100%;
}

ul, ol {
  list-style: none;
}
```

### Section 2 — Design Tokens
Copy ALL custom properties from AGENTS.md §2 into :root.
Do not skip any. Do not modify any values.

```css
/* ── DESIGN TOKENS ───────────────────────────────────── */
:root {
  /* paste all --color-* variables from AGENTS.md §2 here */
}
```

### Section 3 — Base Layout
The app shell layout only. No component styles yet — those come
in the session that builds each component.

```css
/* ── APP SHELL LAYOUT ────────────────────────────────── */

/* Login view — centered card */
#view-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.login-card {
  background: var(--color-card);
  border: 0.5px solid var(--color-border);
  border-radius: 12px;
  padding: 40px 32px;
  width: 360px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.login-error {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-overdue-text);
}

/* App shell — sidebar + main */
#view-app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--color-sidebar);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 20px 16px 16px;
}

.sidebar-app-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-sidebar-text);
}

/* Sidebar section label */
.sidebar-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-sidebar-text);
  padding: 12px 16px 4px;
}

/* Sidebar project list */
.sidebar-project-list {
  flex: 1;
  overflow-y: auto;
}

/* New project button */
.btn-new-project {
  background: none;
  border: none;
  color: var(--color-sidebar-text);
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  text-align: left;
  width: 100%;
  transition: color 0.15s ease;
}

.btn-new-project:hover {
  color: var(--color-sidebar-text);
}

/* Sidebar user section */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
}

.user-photo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-sidebar-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-signout {
  background: none;
  border: none;
  font-size: 11px;
  color: var(--color-sidebar-text);
  padding: 0;
  text-align: left;
  transition: color 0.15s ease;
}

.btn-signout:hover {
  color: var(--color-sidebar-text);
}

/* Main content area */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
}

/* Topbar */
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  background: var(--color-card);
  border-bottom: 0.5px solid var(--color-border);
  flex-shrink: 0;
}

.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* Hamburger — hidden on desktop */
.hamburger {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--color-text-primary);
  display: none;
}

/* Search input */
.search-input {
  height: 32px;
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  padding: 0 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: var(--color-text-primary);
  background: var(--color-bg);
  width: 220px;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

/* Notification bell */
.notification-bell {
  position: relative;
  background: none;
  border: none;
  font-size: 18px;
  color: var(--color-text-muted);
  padding: 4px;
  transition: color 0.15s ease;
}

.notification-bell:hover {
  color: var(--color-text-primary);
}

.notification-count {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-priority-high);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Content region */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Content views — only one visible at a time */
.content-view {
  display: block;
}

.content-view[hidden] {
  display: none;
}

/* Offline banner */
.offline-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-text-primary);
  color: #fff;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  padding: 10px;
  z-index: 200;
}

/* Notification panel */
.notification-panel {
  position: fixed;
  top: 56px;
  right: 16px;
  width: 320px;
  background: var(--color-card);
  border: 0.5px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 90;
  max-height: 400px;
  overflow-y: auto;
}

/* View helper */
.view[hidden] {
  display: none;
}
```

Component styles (nav-item, task-card, stat-card, btn-primary,
modal-overlay, modal-panel, fab) are defined exactly as written in
AGENTS.md §2. Add them now in their own labeled CSS section:

```css
/* ── COMPONENT STYLES — see AGENTS.md §2 for source ─── */
/* nav-item, task-card, stat-card, btn-primary,           */
/* modal-overlay, modal-panel, fab                        */
```

---

## 4. JS MODULE STUBS

Each module gets a header comment block and JSDoc stubs only.
No logic. No Firebase calls. No DOM manipulation.
Functions exist so the script loading order does not throw errors.

### config.js stub
```javascript
/**
 * config.js — Firebase configuration and app-wide constants.
 * Scope: Firebase init + constants only. No functions. No DOM.
 * Session: Stubbed in Session 1. Filled with real values before Session 2.
 * See: AGENTS.md §3, §7
 */

// TODO: Fill with real Firebase config before Session 2.
// Copy from Firebase console → Project Settings → Your apps.
// This file is gitignored — never commit real values.

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  vapidKey: ""
};

// App-wide constants
const DEFAULT_PRIORITY = 'none';
const CATEGORIES = ['Work', 'Personal', 'School', 'Dev', 'Urgent'];
const MAX_TITLE_LENGTH = 200;
```

### auth.js stub
```javascript
/**
 * auth.js — Authentication only.
 * Scope: Google Sign-In, sign-out, session, FCM permission.
 * No DOM manipulation. No Firestore read queries.
 * See: AGENTS.md §5
 */

/**
 * Signs the user in with Google via Firebase Auth popup.
 * @returns {Promise<void>}
 */
async function signInWithGoogle() {
  // TODO: Session 2
}

/**
 * Signs the current user out and detaches all Firestore listeners.
 * @returns {Promise<void>}
 */
async function signOut() {
  // TODO: Session 2
}

/**
 * Requests browser notification permission on first login.
 * Saves FCM token to Firestore via db.js if granted.
 * @returns {Promise<void>}
 */
async function requestNotificationPermission() {
  // TODO: Session 2
}
```

### router.js stub
```javascript
/**
 * router.js — View switching only.
 * Scope: Show/hide views based on auth state and navigation.
 * No Firebase calls. No application state.
 * See: AGENTS.md §5
 */

/**
 * Shows the named view, hides all others.
 * @param {string} viewName - One of: 'login', 'dashboard',
 *                            'project', 'settings'
 */
function showView(viewName) {
  // TODO: Session 3
}
```

### db.js stub
```javascript
/**
 * db.js — Firestore operations only.
 * Scope: All reads, writes, and real-time listeners.
 * No DOM access. No UI rendering. No application state.
 * See: AGENTS.md §5, §7
 */

/**
 * Creates a new project document in Firestore.
 * @param {string} userId
 * @param {string} name
 * @returns {Promise<string>} New project document ID
 */
async function createProject(userId, name) {
  // TODO: Session 4
}

/**
 * Listens to the user's projects collection in real time.
 * @param {string} userId
 * @param {Function} callback - Called with snapshot on every change
 * @returns {Function} Unsubscribe function — store in state.listeners
 */
function listenToProjects(userId, callback) {
  // TODO: Session 4
}

/**
 * Creates a new task document under a project.
 * CRITICAL: Must include userId field on every task document.
 * @param {string} userId
 * @param {string} projectId
 * @param {Object} taskData
 * @returns {Promise<string>} New task document ID
 */
async function createTask(userId, projectId, taskData) {
  // TODO: Session 4
}

/**
 * Listens to all tasks across all projects for the user.
 * Uses Firestore collection group query.
 * Requires composite index: userId (Asc) + dueDate (Asc).
 * @param {string} userId
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
function listenToDashboardTasks(userId, callback) {
  // TODO: Session 4
}
```

### ui.js stub
```javascript
/**
 * ui.js — DOM rendering only.
 * Scope: All render functions, modals, banners, empty states.
 * No Firebase calls. No application state management.
 * Use textContent for all external data — never innerHTML.
 * See: AGENTS.md §5
 */

/**
 * Renders the sidebar project list.
 * @param {Array} projects - Array of project objects
 * @param {string|null} activeProjectId - Currently active project ID
 */
function renderSidebar(projects, activeProjectId) {
  // TODO: Session 5
}

/**
 * Renders the task list with optional filters and search.
 * @param {Array} tasks
 * @param {Object} filters
 * @param {string} searchQuery
 */
function renderTaskList(tasks, filters, searchQuery) {
  // TODO: Session 5
}

/**
 * Shows a modal of the given type with optional data.
 * @param {string} type - Modal type identifier
 * @param {Object} [data] - Data to pre-fill the modal
 */
function showModal(type, data) {
  // TODO: Session 5
}

/**
 * Hides and clears the modal overlay.
 */
function hideModal() {
  // TODO: Session 5
}

/**
 * Shows the offline mode banner.
 */
function showOfflineBanner() {
  // TODO: Session 5
}

/**
 * Hides the offline mode banner.
 */
function hideOfflineBanner() {
  // TODO: Session 5
}
```

### app.js stub
```javascript
/**
 * app.js — Orchestrator.
 * Scope: Application state, event listeners, module wiring.
 * No direct DOM manipulation — always calls ui.js.
 * No direct Firebase calls — always calls db.js.
 * See: AGENTS.md §5, §6
 */

/**
 * Application state — single source of truth.
 * Only app.js reads or writes this object.
 */
const state = {
  user: null,
  currentProjectId: null,
  projects: [],
  tasks: [],
  dashboardTasks: [],
  activities: [],
  filters: {
    status: 'all',
    priority: 'all',
    category: 'all',
  },
  searchQuery: '',
  notifications: [],
  listeners: [],
  isOffline: false,
};

// TODO: Session 13 — wire all modules, attach all event listeners
```

---

## 5. SESSION 1 REVIEW CHECKLIST

Run this before committing. Every item must pass.

### Files
- [ ] All files and folders from Section 1 exist
- [ ] `.gitignore` includes `js/config.js`
- [ ] `config.example.js` is present and has no real values
- [ ] `js/config.js` is NOT committed (check `git status`)

### index.html
- [ ] DM Sans Google Fonts link appears before `style.css`
- [ ] All view IDs match AGENTS.md §9 exactly
- [ ] Script load order matches AGENTS.md §4 exactly
- [ ] No inline styles anywhere
- [ ] No inline scripts anywhere
- [ ] `role="alert"` on `#login-error`
- [ ] `role="dialog"` and `aria-modal="true"` on `#modal-overlay`
- [ ] `aria-live="polite"` on `#notification-panel`
- [ ] `aria-label` on every interactive element

### style.css
- [ ] All `--color-*` tokens from AGENTS.md §2 are in `:root`
- [ ] No hardcoded color values outside `:root`
- [ ] All component styles from AGENTS.md §2 are present
- [ ] No `!important` declarations
- [ ] No inline styles

### JS Modules
- [ ] All 6 files exist with correct headers
- [ ] `state` object in `app.js` matches AGENTS.md §6 exactly
- [ ] All stub functions have JSDoc comments
- [ ] No `console.log` statements
- [ ] No actual logic — stubs only
- [ ] No cross-module calls (nothing calls anything yet)

### Browser Check
- [ ] Open `index.html` in browser — no console errors
- [ ] Login view renders with correct colors and font
- [ ] No layout breaks at 375px viewport width
- [ ] Run .agents/skills/review/SKILL.md as required by the build-setup prompt in AGENTS.md

---

## 6. COMMIT

After all checklist items pass:

```
git add .
git commit -m "feat: project setup — HTML shell, CSS tokens, JS module stubs"
git push origin dev
```
