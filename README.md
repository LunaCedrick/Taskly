# Taskly

Taskly is a real-time, multi-project task manager built with HTML, CSS, vanilla JavaScript, and Firebase compat SDKs.

## Current Status

Active development. Sessions 1 and 2 are complete enough to proceed to Session 3.

Completed:
- Project shell, base layout, CSS tokens, and JavaScript module stubs.
- Firebase compat SDK loading updated to version `12.4.0`.
- Firebase SDK scripts load in `<head>` after Google Fonts and before `style.css`.
- Application scripts still load at the bottom of `<body>` in this order: `config.js`, `auth.js`, `router.js`, `db.js`, `ui.js`, `app.js`.
- `auth.js` implements Google Sign-In, session persistence, sign-out, first-login notification permission, and `window.auth` export.
- `js/config.js` uses `firebaseAuth` for the Firebase Auth instance to avoid shadowing `window.auth`.

## Verification Notes

Google Sign-In smoke test passed at the wiring level:
- Firebase initialized in the browser.
- `window.auth.signInWithGoogle()` was callable.
- A real Chrome click opened the Firebase/Google sign-in popup.

Not yet fully verified:
- Completing an actual Google account login.
- Firestore profile saving, because `db.js` is still a Session 4 stub.
