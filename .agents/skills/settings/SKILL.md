---
name: settings
description: "Session 12 of 17: build Taskly settings view UI contracts for visible settings navigation, profile display, notification permission/status help, theme placeholder, and sign-out confirmation. Use after offline support UI exists, while leaving app.js event listeners and sign-out cleanup to Session 13."
---

# Session 12 - Settings

## Purpose

Build the settings view contract so Taskly can display account details,
notification status, future theme controls, and a safe sign-out flow without
moving application state or auth behavior into ui.js.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/settings/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve settings product scope.
- Inspect `index.html`, `style.css`, `js/ui.js`, `js/auth.js`, and `js/app.js`
  for the actual current settings contracts.
- Do not preload prior skill files unless a contract conflict cannot be
  resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 12
settings-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- Visible settings navigation trigger in the existing sidebar.
- Settings view structure inside `#view-settings`.
- Profile display UI for the signed-in Google user.
- Notification permission/status help UI contract.
- Theme placeholder UI for future dark mode.
- Account section with sign-out confirmation contract.
- Settings-specific CSS.
- UI render helpers needed by Session 13.

This session does not build:

- No app.js event listener wiring.
- No app.js state mutation.
- No auth.js sign-out implementation changes.
- No notification permission request logic.
- No FCM token logic.
- No Firestore profile reads or writes.
- No dark mode implementation.
- No router changes.

Session 13 wires settings navigation events, profile data, notification status,
settings controls, and sign-out cleanup through app.js.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`
- `js/ui.js`

Do not modify `js/db.js`, `js/auth.js`, `js/router.js`, `js/config.js`, or
`js/app.js` in this session.

## Existing Implementation Assumptions

- `#view-settings` already exists in `index.html`.
- `#user-photo` already exists in the sidebar.
- `#user-name` already exists in the sidebar.
- `#btn-signout` already exists in the sidebar.
- `ui.showConfirmModal(message, onConfirm)` already exists.
- app.js already owns the current authenticated user object in `state.user`.

## Required DOM Targets

Use only canonical IDs from `AGENTS.md`.

Required existing targets:

- Existing sidebar navigation container.
- `#view-settings`
- `#user-photo`
- `#user-name`
- `#btn-signout`

Required settings navigation trigger:

- Visible sidebar navigation entry with `data-view="settings"`.
- It must be keyboard reachable and have accessible text or an aria-label.
- It must use existing sidebar nav item styling and active-state conventions.

Required new targets inside `#view-settings`:

- `#settings-profile`
- `#settings-notifications`
- `#settings-theme`
- `#settings-account`

Do not create a second sidebar profile block. The settings view may show a
larger profile summary, but the existing sidebar profile remains the sidebar
identity surface.

## Required UI Functions

Add this exported function to `js/ui.js` if it does not already exist:

- `renderSettingsView(user, notificationStatus)`

Purpose:

- `renderSettingsView(user, notificationStatus)` renders profile,
  notification, theme, and account sections into `#view-settings`.

Optional helper functions are allowed when they keep `renderSettingsView()`
small and readable.

Do not add event listeners in ui.js. Render controls with stable IDs and data
hooks for app.js event delegation.

## User Data Contract

The user object passed by app.js should provide:

```javascript
{
  displayName: 'User Name',
  email: 'user@example.com',
  photoURL: 'https://example.com/photo.jpg'
}
```

Rules:

- Missing `displayName` renders a safe fallback such as `Taskly user`.
- Missing `email` renders a muted fallback such as `No email available`.
- Missing `photoURL` uses a text/avatar fallback or leaves the image empty with
  descriptive alt text.
- Use `textContent` for display name and email.
- Do not read Firebase Auth directly from ui.js.

## Notification Status Contract

The notification status value is passed by app.js.

Allowed values:

- `granted`
- `denied`
- `default`
- `unsupported`
- `unknown`

Display requirements:

- `granted`: browser notifications are enabled.
- `denied`: notifications are disabled in browser settings.
- `default`: notifications are not enabled yet.
- `unsupported`: browser notifications are not supported.
- `unknown`: status could not be determined.

Rules:

- ui.js must not call `Notification.permission`.
- ui.js must not call `Notification.requestPermission()`.
- Permission request behavior remains owned by auth/app contracts.
- Include a settings control or status/help surface with
  `data-settings-action="notifications"` only when the UI clearly behaves as
  help/status and does not imply a working enable toggle.
- Do not render copy that promises enabling notifications from settings unless
  AGENTS.md and the auth/app skills first define a public permission-request
  contract.
- Disable or explain the control when status is `denied` or `unsupported`.
- For `denied`, show exactly:
  `Notifications disabled. You can enable them in browser settings.`

## Theme Placeholder Contract

Settings must include a visible theme section for future dark mode.

Rules:

- Show the current theme as `Light`.
- Show dark mode as `Coming soon`.
- Do not implement theme switching.
- Do not add CSS variable theme swapping.
- Do not write to localStorage for theme preferences in this session.
- If a control is rendered, disable it and label it clearly.

## Account And Sign-Out Contract

Settings must include an account section with a sign-out action.

Rules:

- Use a settings sign-out button with `data-settings-action="sign-out"`.
- Sign-out must require confirmation before auth sign-out runs.
- Use `ui.showConfirmModal()` for confirmation.
- Suggested confirmation message: `Sign out of Taskly? Unsaved offline changes may still be syncing.`
- app.js must detach all Firestore listeners before calling auth sign-out.
- ui.js must not call `auth.signOut()` directly.

The existing sidebar `#btn-signout` remains valid. Session 13 should wire both
sidebar and settings sign-out entry points to the same confirmation flow.

## Required Settings Sections

Render sections in this order:

1. Profile.
2. Notifications.
3. Theme.
4. Account.

Use semantic structure:

- The topbar title remains the page `h1`.
- Use `section` for settings regions.
- Use `h2` or `h3` for settings section headings.
- Keep copy concise and operational.

## Error Handling

Use the user-facing messages from `AGENTS.md`.

- Notification permission denied: `"Notifications disabled. You can enable them in browser settings."`
- Auth failure: `"Sign-in failed. Please try again."`
- Unknown failure: `"Something went wrong. Please try again."`

Do not show raw Firebase or browser permission errors to users.

## CSS Requirements

Append settings styles to the end of `style.css` under a clear Session 12
comment header.

Potential required classes:

- `.settings`
- `.settings__header`
- `.settings__title`
- `.settings__subtitle`
- `.settings-grid`
- `.settings-card`
- `.settings-card__header`
- `.settings-card__title`
- `.settings-card__body`
- `.settings-profile`
- `.settings-profile__avatar`
- `.settings-profile__name`
- `.settings-profile__email`
- `.settings-status`
- `.settings-status--granted`
- `.settings-status--denied`
- `.settings-action`

Rules:

- Use existing CSS variables only.
- Do not hardcode hex colors.
- Keep mobile-first layout.
- Controls must meet 44px touch targets on mobile.
- Do not introduce horizontal scrolling.
- Keep settings consistent with dashboard and card styling.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, `Notification`, or `fetch` from ui.js.
- Do not call private auth-module internals from settings controls.
- Do not add event listeners in ui.js.
- Do not mutate app state from ui.js.
- Do not modify auth.js.
- Do not modify app.js.
- Do not implement notification permission requests.
- Do not implement dark mode.
- Do not use `innerHTML` for user or settings data.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm no console errors.
- Confirm `#view-settings` exists.
- Confirm the sidebar has one visible, keyboard-reachable settings entry with
  `data-view="settings"`.
- Call `ui.renderSettingsView(mockUser, 'granted')`.
- Confirm profile name, email, and avatar render safely.
- Confirm notification status copy renders for `granted`, `denied`,
  `default`, `unsupported`, and `unknown`.
- Confirm denied notification status uses the exact AGENTS.md message and no
  settings copy promises an unavailable enable action.
- Confirm theme section shows Light and Coming soon.
- Confirm account section includes a sign-out action hook.
- Call `ui.showConfirmModal('Sign out of Taskly?', () => {})` and confirm the
  existing confirmation modal remains suitable for sign-out confirmation.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css js/ui.js
git commit -m "feat: build settings view UI contracts"
git push origin dev
```
