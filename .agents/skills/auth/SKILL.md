---
name: auth
description: Implement Google Sign-In with Firebase Auth, session persistence, sign-out, and FCM permission request. auth.js is the only file modified in this session — no DOM, no router, no UI, no state. See AGENTS.md for design rules and module boundaries.
---
## Session: 2 of 17
## Scope: auth.js — Google Sign-In · session persistence · sign-out · FCM permission
## References: AGENTS.md §5, §7, §8, §13

---

AGENTS.md is the source of truth.
This file adds only what is specific to Session 2.
Do not repeat design tokens, naming conventions,
error messages, or module boundaries from AGENTS.md.

---

## WHAT THIS SESSION BUILDS

One file: `js/auth.js` — fully implemented.

Session 1 stub is replaced with working code.
No other file is modified.

---

## WHAT THIS SESSION DOES NOT BUILD

- No router logic — router.js is Session 3
- No DOM manipulation of any kind
- No Firestore read queries
- No UI rendering
- No event listeners — those belong to app.js (Session 13)
- No application state — state lives in app.js only

If it is not auth.js — do not touch it.

---

## 1. FIREBASE SDK IMPORTS

auth.js uses the Firebase compat SDK loaded via CDN in index.html.
Do not use ES module imports — the project uses script tags, not a bundler.

Required Firebase services (already initialized in config.js):
- `firebase.auth()` — Auth instance
- `firebase.messaging()` — FCM instance (for token retrieval)

These are available as globals after config.js loads.
auth.js depends on config.js loading first — guaranteed by script order.

---

## 2. AUTH FLOW — COMPLETE SEQUENCE

This is the exact sequence auth.js must implement:

```
App loads
  → firebase.auth().onAuthStateChanged fires
  → No user: router signals login view (via callback)
  → User exists: router signals app view (via callback)

User clicks Sign in with Google (event is in app.js)
  → signInWithGoogle() called
  → Firebase Auth popup opens
  → User selects Google account
  → On success:
      → save profile to Firestore via db.saveUserProfile()
      → check localStorage for 'taskly_first_login' flag
      → if flag absent: call requestNotificationPermission()
      → set localStorage flag: localStorage.setItem('taskly_first_login', '1')
      → onAuthStateChanged fires automatically
      → router callback handles view switch
  → On failure:
      → catch error code
      → return human-readable message string (caller displays it)

User clicks Sign out (event is in app.js)
  → signOut() called
  → app.js detaches all Firestore listeners BEFORE sign-out
  → firebase.auth().signOut()
  → onAuthStateChanged fires with null user
  → router callback handles view switch
```

---

## 3. FUNCTION SPECIFICATIONS

### onAuthStateChanged setup

auth.js sets up the listener once, on module load.
It accepts a callback from app.js so the orchestrator
can react to auth state changes.

```javascript
/**
 * Initialises the Firebase auth state listener.
 * Calls onSignIn(user) when a user is authenticated.
 * Calls onSignOut() when no user is present.
 * Call this once from app.js on page load.
 * @param {Function} onSignIn - Receives Firebase user object
 * @param {Function} onSignOut - Called when user is null
 */
function initAuthListener(onSignIn, onSignOut) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      onSignIn(user);
    } else {
      onSignOut();
    }
  });
}
```

### signInWithGoogle

```javascript
/**
 * Opens the Google Sign-In popup and authenticates the user.
 * Saves the user profile to Firestore on success.
 * Requests notification permission on first login only.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    // Save profile — db.js handles the Firestore write
    await db.saveUserProfile(user.uid, {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });

    // First login check — request FCM permission once only
    if (!localStorage.getItem('taskly_first_login')) {
      await requestNotificationPermission(user.uid);
      localStorage.setItem('taskly_first_login', '1');
    }

  } catch (err) {
    // Map Firebase error codes to human-readable messages
    // See AGENTS.md §8 for the full error message table
    throw mapAuthError(err);
  }
}
```

### signOut

```javascript
/**
 * Signs the current user out of Firebase Auth.
 * NOTE: app.js must detach all Firestore listeners
 * BEFORE calling this function to prevent memory leaks.
 * See AGENTS.md §6 for listener cleanup requirement.
 * @returns {Promise<void>}
 */
async function signOut() {
  try {
    await firebase.auth().signOut();
  } catch (err) {
    throw mapAuthError(err);
  }
}
```

### requestNotificationPermission

```javascript
/**
 * Requests browser push notification permission.
 * Called once on first login only — never repeat if denied.
 * Saves FCM token to Firestore if permission is granted.
 * Fails silently if FCM is unavailable — never blocks sign-in.
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<void>}
 */
async function requestNotificationPermission(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      // User declined — do not re-request. In-app alerts only.
      return;
    }
    const messaging = firebase.messaging();
    const token = await messaging.getToken({
      vapidKey: firebaseConfig.vapidKey,
    });
    if (token) {
      await db.saveFcmToken(userId, token);
    }
  } catch (err) {
    // FCM failure must not block sign-in — log only, no throw
    // Do not use console.log in committed code — remove before commit
  }
}
```

### mapAuthError (private — not exported)

```javascript
/**
 * Maps a Firebase Auth error to a human-readable string.
 * See AGENTS.md §8 for the full message table.
 * @param {Error} err - Firebase Auth error object
 * @returns {string} Human-readable error message
 */
function mapAuthError(err) {
  const code = err.code || '';
  if (code === 'auth/popup-blocked') {
    return 'Login popup was blocked. Allow popups for this site.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return ''; // User dismissed — no message needed
  }
  if (code === 'auth/network-request-failed') {
    return 'Connection lost. Check your internet.';
  }
  if (code.startsWith('auth/')) {
    return 'Sign-in failed. Please try again.';
  }
  return 'Something went wrong. Try again.';
}
```

---

## 4. WHAT auth.js EXPORTS

auth.js exposes exactly three functions to app.js.
mapAuthError is private — not exported, not called externally.

```javascript
// At the bottom of auth.js — after all function declarations
// No ES module syntax — plain assignment for script-tag loading
window.auth = {
  initAuthListener,
  signInWithGoogle,
  signOut,
};
```

app.js calls them as:
```javascript
auth.initAuthListener(onSignIn, onSignOut);
auth.signInWithGoogle();
auth.signOut();
```

---

## 5. WHAT config.js MUST HAVE BEFORE SESSION 2 STARTS

config.js must be filled with real Firebase values before
auth.js can work. The stub from Session 1 must be replaced.

config.js must also initialize Firebase and export instances:

```javascript
// js/config.js — filled values + Firebase init
// This file is gitignored. Never commit.

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  vapidKey: "..."
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Firestore instance — used by db.js
const db_firestore = firebase.firestore();

// Auth instance — used by auth.js
// (accessed via firebase.auth() directly in auth.js)

// Enable offline persistence immediately after init
// See AGENTS.md §7 for the full persistence block
db_firestore.enablePersistence({ synchronizeTabs: false })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs — persistence works in one tab only
    } else if (err.code === 'unimplemented') {
      // Browser does not support IndexedDB
    }
  });

// App-wide constants — see AGENTS.md §5 config.js scope
const DEFAULT_PRIORITY = 'none';
const CATEGORIES = ['Work', 'Personal', 'School', 'Dev', 'Urgent'];
const MAX_TITLE_LENGTH = 200;
```

Note: config.js uses the Firebase compat SDK loaded via CDN.
firebase.initializeApp() must be called before any other
firebase.auth() or firebase.firestore() calls.

---

## 6. FIREBASE SDK — CDN LINKS

Add these to index.html `<head>` before all other scripts.
Use Firebase compat SDK v12 (compat layer — no bundler needed).

```html
<!-- Firebase App (core — must be first) -->
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js"></script>
<!-- Firebase Auth -->
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-auth-compat.js"></script>
<!-- Firebase Firestore -->
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore-compat.js"></script>
<!-- Firebase Cloud Messaging -->
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js"></script>
```

These must appear BEFORE `<script src="js/config.js">`.
Order inside head: Google Fonts → Firebase SDKs → style.css.
Order at bottom of body: config.js → auth.js → router.js → db.js → ui.js → app.js.

---

## 7. EDGE CASES — AUTH SPECIFIC

These are not in AGENTS.md §8 at this level of detail.

| Scenario | Behaviour |
|---|---|
| Popup blocked by browser | `auth/popup-blocked` → message shown in `#login-error` via app.js |
| User closes popup without selecting | `auth/popup-closed-by-user` → return empty string → no message shown |
| Network drops during sign-in | `auth/network-request-failed` → "Connection lost" message |
| FCM `getToken()` fails | Catch silently — sign-in completes normally, no notification |
| `Notification.requestPermission` not supported | Wrap in `if ('Notification' in window)` guard |
| User signs in on new device | Profile overwrites (merge) with latest Google data — no duplicate |
| `saveFcmToken` fails in db.js | auth.js does not re-throw — FCM failure never blocks auth |

---

## 8. BOUNDARY RULES — WHAT auth.js NEVER DOES

These repeat AGENTS.md §5 briefly as a session-specific guard.
If the code below ever appears in auth.js — it is wrong.

```javascript
// ❌ NEVER — DOM access
document.getElementById('...')
document.querySelector('...')
element.textContent = '...'
element.hidden = ...

// ❌ NEVER — Firestore reads
firebase.firestore().collection('...').get()
firebase.firestore().collection('...').onSnapshot()

// ❌ NEVER — Application state
state.user = user
state.anything = anything

// ❌ NEVER — Router calls
showView('dashboard')
router.showView(...)

// ❌ NEVER — UI calls
ui.renderSidebar(...)
renderAnything(...)
```

All of the above belong in app.js, router.js, or ui.js respectively.
auth.js returns data and throws errors — nothing more.

---

## 9. SESSION 2 REVIEW CHECKLIST

Run this before committing. Every item must pass.
Then run `.agents/skills/review/SKILL.md` as required by AGENTS.md §16.

### config.js
- [ ] Real Firebase values filled in (not empty strings)
- [ ] `firebase.initializeApp()` called at top
- [ ] Offline persistence enabled immediately after init
- [ ] `config.js` still in `.gitignore` — not staged in `git status`

### index.html
- [ ] Firebase compat SDK scripts added to `<head>`
- [ ] Script order: Firebase SDKs → config.js → auth.js → ...
- [ ] No other files modified from Session 1

### auth.js
- [ ] `initAuthListener(onSignIn, onSignOut)` implemented
- [ ] `signInWithGoogle()` implemented with try/catch
- [ ] `signOut()` implemented with try/catch
- [ ] `requestNotificationPermission(userId)` implemented
- [ ] `mapAuthError(err)` implemented — covers all cases in AGENTS.md §8
- [ ] `window.auth` exports exactly: `initAuthListener`, `signInWithGoogle`, `signOut`
- [ ] First login check uses `localStorage.getItem('taskly_first_login')`
- [ ] FCM permission failure is caught silently — never blocks sign-in
- [ ] `Notification` API guarded with `if ('Notification' in window)`
- [ ] No DOM access anywhere in auth.js
- [ ] No Firestore read queries anywhere in auth.js
- [ ] No `state.*` assignments anywhere in auth.js
- [ ] No `console.log` statements
- [ ] Every function has JSDoc comment

### Behaviour test (manual — browser)
- [ ] Click "Sign in with Google" → popup opens
- [ ] Complete sign-in → no console errors
- [ ] `#login-error` shows message if popup is blocked
- [ ] Sign out button triggers `auth.signOut()` without error
- [ ] Refresh page → user remains signed in (session persists)
- [ ] Open Firebase console → user appears under Authentication
- [ ] Open Firestore → `users/{uid}/profile` document exists

---

## 10. COMMIT

After all checklist items pass:

```
git add js/auth.js js/config.js index.html
git commit -m "feat: implement Google Sign-In with session persistence and FCM permission"
git push origin dev
```
