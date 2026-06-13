---
name: router
description: Implements view switching based on auth state and user navigation.
---
## Session: 3 of 17
## Scope: router.js — view switching · auth state · topbar title · FAB visibility
## References: AGENTS.md §5, §9

---

AGENTS.md is the source of truth.
This file adds only what is specific to Session 3.
Do not repeat design tokens, naming conventions,
module boundaries, or error messages from AGENTS.md.

---

## WHAT THIS SESSION BUILDS

One file: `js/router.js` — fully implemented.
Session 1 stub is replaced with working code.
No other file is modified.

---

## WHAT THIS SESSION DOES NOT BUILD

- No Firestore calls of any kind
- No event listeners — those belong to app.js (Session 13)
- No application state management
- No rendering of data — ui.js handles that (Session 5)
- No auth logic — auth.js handles that (Session 2)

If it is not router.js — do not touch it.

---

## 1. ROUTER RESPONSIBILITY — PRECISE SCOPE

router.js has exactly one job: show the right view at the right time.

It does this by:
1. Hiding all views except the one requested
2. Updating the topbar title to match the active view
3. Toggling FAB visibility (visible in app, hidden on login)

router.js does NOT:
- Decide WHEN to switch views — app.js decides that
- Make Firebase calls — it reads firebase.auth().currentUser
  only for the initial page-load guard, nothing more
- Store which view is active — that is app.js state
- Attach click listeners to nav items — that is app.js
- Trigger ui.js renders - app.js coordinates rendering after routing changes

---

## 2. VIEW MAP

These are the only valid viewName values.
Every ID must match AGENTS.md §9 exactly.

```
viewName         Top-level toggle        Content section shown
──────────────────────────────────────────────────────────────
'login'        → #view-login shown       n/a (no sidebar/topbar)
               → #view-app hidden

'dashboard'    → #view-login hidden      #view-dashboard shown
               → #view-app shown         #view-project hidden
                                         #view-settings hidden

'project'      → #view-login hidden      #view-dashboard hidden
               → #view-app shown         #view-project shown
                                         #view-settings hidden

'settings'     → #view-login hidden      #view-dashboard hidden
               → #view-app shown         #view-project hidden
                                         #view-settings shown
```

Topbar title per view:
```
'login'      → no topbar (not visible)
'dashboard'  → "Dashboard"
'project'    → set by app.js via setTopbarTitle(name)
'settings'   → "Settings"
```

FAB visibility:
```
'login'      → hidden
'dashboard'  → visible
'project'    → visible
'settings'   → hidden
```

---

## 3. FUNCTION SPECIFICATIONS

### showView

The core function. Called by app.js whenever the active
view needs to change.

```javascript
/**
 * Shows the named view and hides all others.
 * Updates the topbar title and FAB visibility.
 * @param {string} viewName - One of: 'login', 'dashboard',
 *                            'project', 'settings'
 */
function showView(viewName) {
  // Show/hide top-level shells
  const loginEl  = document.getElementById('view-login');
  const appEl    = document.getElementById('view-app');
  const isApp    = viewName !== 'login';

  loginEl.hidden = isApp;
  appEl.hidden   = !isApp;

  if (!isApp) return; // Login view — nothing more to do

  // Show/hide content sections within #view-app
  const views = ['dashboard', 'project', 'settings'];
  views.forEach((name) => {
    const el = document.getElementById(`view-${name}`);
    if (el) el.hidden = name !== viewName;
  });

  // Update topbar title
  setTopbarTitle(getTitleForView(viewName));

  // Toggle FAB — visible on dashboard and project views only
  const fab = document.getElementById('fab-add-task');
  if (fab) fab.hidden = viewName === 'settings';
}
```

### setTopbarTitle

Separated so app.js can call it independently when the
active project name changes.

```javascript
/**
 * Sets the topbar title text.
 * Called by showView() and by app.js when a project is renamed
 * or when switching between projects.
 * @param {string} title - Display title for the current view
 */
function setTopbarTitle(title) {
  const el = document.getElementById('topbar-title');
  if (el) el.textContent = title; // textContent — never innerHTML
}
```

### getTitleForView (private — not exported)

Maps viewName to its default title string.
Project view title is set separately by app.js via
setTopbarTitle() once the project name is known.

```javascript
/**
 * Returns the default topbar title for a given view name.
 * Project view returns a placeholder — app.js sets the real name.
 * @param {string} viewName
 * @returns {string}
 */
function getTitleForView(viewName) {
  const titles = {
    dashboard : 'Dashboard',
    project   : 'Project',   // app.js will overwrite with real name
    settings  : 'Settings',
  };
  return titles[viewName] || '';
}
```

### initRouter

Called once by app.js on page load.
Checks Firebase auth state to set the initial view
without waiting for onAuthStateChanged.
This prevents a flash of the login screen for returning users.

```javascript
/**
 * Initialises the router on page load.
 * Reads the current Firebase auth state and shows the
 * correct view immediately — no flash of wrong view.
 * Called once from app.js after the page loads.
 * Does not attach any listeners — auth.js owns listeners.
 */
function initRouter() {
  const user = firebase.auth().currentUser;
  showView(user ? 'dashboard' : 'login');
}
```

---

## 4. WHAT router.js EXPORTS

```javascript
// At the bottom of router.js
window.router = {
  showView,
  setTopbarTitle,
  initRouter,
};
```

app.js calls them as:
```javascript
router.initRouter();
router.showView('dashboard');
router.showView('login');
router.setTopbarTitle('My Project');
```

getTitleForView is private — not exported.

---

## 5. CALL SEQUENCE — HOW router.js FITS

This is the full sequence across all modules so router.js
is understood in context. Only router.js is built this session.

```
Page loads
  → app.js runs
  → app.js calls auth.initAuthListener(onSignIn, onSignOut)
  → app.js calls router.initRouter()
      → reads firebase.auth().currentUser
      → if user exists: showView('dashboard')
      → if no user: showView('login')

User signs in (via auth.js popup)
  → onAuthStateChanged fires
  → auth.js calls onSignIn(user) callback in app.js
  → app.js calls router.showView('dashboard')

User clicks a nav item (Dashboard, project, Settings)
  → app.js event listener fires (Session 13)
  → app.js calls router.showView(targetView)
  → router shows correct content section
  → router updates topbar title

User switches to a project view
  → app.js calls router.showView('project')
  → app.js then calls router.setTopbarTitle(project.name)

User signs out
  → app.js detaches all Firestore listeners
  → app.js calls auth.signOut()
  → onAuthStateChanged fires with null
  → auth.js calls onSignOut() callback in app.js
  → app.js calls router.showView('login')
```

---

## 6. BOUNDARY RULES — WHAT router.js NEVER DOES

```javascript
// ❌ NEVER — Firebase calls beyond auth state check
firebase.firestore()
firebase.auth().onAuthStateChanged()
db.listenToProjects()

// ❌ NEVER — Application state
state.currentProjectId = ...
state.anything = ...

// ❌ NEVER — Event listeners
document.getElementById('btn-dashboard').addEventListener(...)
document.querySelector('.nav-item').addEventListener(...)

// ❌ NEVER — Data rendering
ui.renderTaskList(...)
ui.renderSidebar(...)
renderAnything(...)

// ❌ NEVER — Firestore data or innerHTML
element.innerHTML = ...
```

---

## 7. EDGE CASES — ROUTER SPECIFIC

| Scenario | Behaviour |
|---|---|
| `showView()` called with unknown viewName | All content views hidden — topbar title empty — no error thrown |
| `#view-dashboard` element not found in DOM | `getElementById` returns null — optional chain guard prevents crash |
| `initRouter()` called before Firebase init | `firebase.auth().currentUser` returns null — shows login view safely |
| `showView('project')` called before project name is known | Title shows "Project" — app.js overwrites with `setTopbarTitle(name)` immediately after |
| User navigates directly to `#view-settings` in URL | Not applicable — SPA has no URL routing in v1 |

---

## 8. SESSION 3 REVIEW CHECKLIST

Run this before committing. Every item must pass.
Then run `.agents/skills/review/SKILL.md` as required by AGENTS.md §16.

### router.js
- [ ] `showView(viewName)` implemented — hides all, shows one
- [ ] `setTopbarTitle(title)` uses `textContent` — never `innerHTML`
- [ ] `getTitleForView(viewName)` is private — not in `window.router`
- [ ] `initRouter()` reads `firebase.auth().currentUser` — no listener
- [ ] `window.router` exports exactly: `showView`, `setTopbarTitle`, `initRouter`
- [ ] No Firestore calls anywhere in router.js
- [ ] No event listeners anywhere in router.js
- [ ] No `state.*` assignments anywhere in router.js
- [ ] No `ui.render*()` calls anywhere in router.js
- [ ] No `console.log` statements
- [ ] Every function has JSDoc comment
- [ ] `getTitleForView` has JSDoc comment even though private

### No other files modified
- [ ] `auth.js` is unchanged from Session 2
- [ ] `index.html` is unchanged from Session 2
- [ ] `style.css` is unchanged from Session 1

### Behaviour test (manual — browser)
- [ ] Page load with no signed-in user → login view shown
- [ ] Page load with signed-in user → dashboard view shown (no flash)
- [ ] `router.showView('dashboard')` in console → dashboard visible
- [ ] `router.showView('settings')` in console → settings visible, FAB hidden
- [ ] `router.showView('project')` in console → project visible, FAB visible
- [ ] `router.showView('login')` in console → login shown, app hidden
- [ ] `router.setTopbarTitle('Thesis Work')` in console → title updates
- [ ] No console errors on any view switch

---

## 9. COMMIT

After all checklist items pass:

```
git add js/router.js
git commit -m "feat: implement view switching and auth state router"
git push origin dev
```
