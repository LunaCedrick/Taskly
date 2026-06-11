# Taskly Documentation

## Development Notes

This document records implementation-relevant changes that happen during build sessions. It should not contain secrets, Firebase API keys, or temporary test artifacts.

## Session Progress

### Session 1 - Setup

Created the static app shell:
- `index.html`
- `style.css`
- `js/config.js`
- `js/auth.js`
- `js/router.js`
- `js/db.js`
- `js/ui.js`
- `js/app.js`
- `config.example.js`
- `PLAN.md`
- `README.md`

The setup provides the visual shell and script loading structure only. Feature wiring starts in later sessions.

### Session 2 - Auth

Implemented `js/auth.js`:
- Google Sign-In via Firebase Auth popup.
- Local Firebase session persistence.
- Sign-out wrapper.
- Auth state listener export through `window.auth.initAuthListener`.
- First-login browser notification permission request.
- FCM token retrieval path for later db.js support.
- Human-readable auth error mapping.

Important boundary:
- `auth.js` does not manipulate the DOM.
- `auth.js` does not manage app state.
- `auth.js` does not run Firestore read queries.

## Important Corrections

### Firebase SDK Loading

Firebase compat SDK scripts now use version `12.4.0` and load in `<head>` after Google Fonts and before `style.css`.

The required SDK order is:
```html
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js"></script>
```

Application scripts remain at the bottom of `<body>`:
```html
<script src="js/config.js"></script>
<script src="js/auth.js"></script>
<script src="js/router.js"></script>
<script src="js/db.js"></script>
<script src="js/ui.js"></script>
<script src="js/app.js"></script>
```

### Auth Naming Conflict

`js/config.js` must not declare a top-level variable named `auth`. That name is reserved for the custom `window.auth` module exported by `js/auth.js`.

Use:
```javascript
const firebaseAuth = firebase.auth();
```

## Smoke Test Result

A temporary Google Sign-In smoke-test script was created, run, and deleted.

Result:
- Firebase loaded successfully.
- `window.auth.signInWithGoogle()` existed and was callable.
- A real Chrome click opened the Firebase/Google sign-in popup.

Limitations:
- The Google account login was not completed interactively.
- Firestore profile saving was stubbed during the smoke test because `db.js` is not implemented until Session 4.
