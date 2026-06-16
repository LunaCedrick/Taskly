# Taskly Approved Fixes

Date: 2026-06-16
Status: Approved for implementation

## Scope

These fixes address the browser QA findings from the integration pass:

- Google sign-in button does not open the popup.
- Signed-out users can scroll into the hidden app shell.
- Sign-in errors should appear in the login context.

No new features are included in this patch set.

## Patch 1 - Bind Login Events Before Auth Success

Affected file: `js/app.js`

Problem:

`btn-google-signin` is currently bound through `bindDomEventsOnce()`, but that function only runs from `init(user)`. Since `init(user)` only runs after authentication succeeds, the login button has no click handler while signed out.

Fix:

Call `bindDomEventsOnce()` inside `boot()` before initializing the auth listener.

Expected shape:

```js
function boot() {
  bindDomEventsOnce();
  auth.initAuthListener(init, handleAuthSignedOut);
  router.initRouter();
}
```

Reasoning:

`bindDomEventsOnce()` is already guarded by `hasBoundDomEvents`, so keeping the existing call inside `init(user)` will not create duplicate event listeners.

## Patch 2 - Ensure Hidden Views Do Not Occupy Layout

Affected file: `style.css`

Problem:

Elements with the `hidden` attribute still receive component display rules such as `display: flex`, so `#view-app` occupies a second viewport below the login page. A signed-out user can scroll down and see the app shell.

Fix:

Add a global hidden-state rule near the base/reset CSS:

```css
[hidden] {
  display: none;
}
```

If component display rules still override this during browser QA, use the stronger browser-state contract:

```css
[hidden] {
  display: none !important;
}
```

Reasoning:

The `hidden` attribute is an application state contract. Hidden views must not be visible, focusable, or layout-affecting.

## Patch 3 - Render Sign-In Errors In The Login Card

Affected files:

- `js/ui.js`
- `js/app.js`

Problem:

`handleGoogleSignIn()` sends errors through `ui.renderErrorBanner(...)`, but the login view already has `#login-error`. Sign-in failures should appear inside the login card.

Fix:

Add a `ui.renderLoginError(message)` helper that writes to `#login-error`, then call it from `handleGoogleSignIn()`.

Expected behavior:

- Popup blocked shows: `Google login popup was blocked. Allow popups for this site.`
- Generic auth failure shows: `Sign-in failed. Please try again.`
- Empty popup-closed result should not show a blank alert.

## Retest Checklist

After implementation, rerun browser QA and verify:

- Clicking `Sign in with Google` opens the Google popup.
- Popup blocked errors render inside the login card.
- Signed-out login page cannot scroll into dashboard/sidebar UI.
- `#view-app` has `hidden=true` and no layout box while signed out.
- Sign-in, sign-out, and re-sign-in do not create duplicate listeners.
- Static review still reports no FAIL items.

