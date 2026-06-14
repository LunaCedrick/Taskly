# Alignment Fixes Ledger

This ledger tracks cross-session contract drift that must update `AGENTS.md`
and affected skills before production code fixes are rerun.

Use `.agents/skills/alignment-fix/SKILL.md` before editing this file.

## Active Items

### Settings Navigation Trigger

Status: code-fixed

Problem: `app.js` supports `data-view="settings"` and `#view-settings`
exists, but there is no visible settings navigation trigger in `index.html`.

Patch:

- `AGENTS.md`
- `.agents/skills/settings/SKILL.md`
- `.agents/skills/app/SKILL.md`

Contract update:

- Settings must have a visible navigation entry using `data-view="settings"`.
- The entry should live in the existing sidebar navigation unless a later
  design decision chooses another accessible location.
- Settings owns the UI/navigation contract.
- App owns event handling for the settings navigation target.

Code Fix:

- Rerun the updated settings skill or a focused settings fix to add the
  settings nav trigger.
- Confirm the updated app skill already handles routing.
- Read-only scan: no `data-view="settings"` trigger currently exists in
  `index.html` or `js/`.

Review:

- Verify keyboard access and active nav state.

### App DOM Write Boundary

Status: ready-for-code-fix

Problem: `app.js` performs narrow DOM writes for sidebar user fields and
inline modal validation because no exported `ui.js` helpers exist for those
surfaces.

Patch:

- `AGENTS.md`
- `.agents/skills/ui/SKILL.md`
- `.agents/skills/app/SKILL.md`

Contract update:

- Prefer exported UI helpers for user-visible DOM writes.
- Add UI helper contracts for sidebar user fields, task modal validation,
  and project modal validation.
- App may read event targets and form values, but should call UI helpers
  for user-visible DOM writes when those helpers exist.

Code Fix:

- Rerun the updated UI skill or a focused UI fix to add helpers.
- Rerun the updated app skill or a focused app fix to replace direct DOM
  writes with those helpers.
- Read-only scan: `js/app.js` still writes sidebar user fields and modal
  validation directly.

Review:

- Confirm `app.js` only performs allowed event/form reads and delegates
  user-visible writes to `ui.js`.

### Notification Badge Canonical ID

Status: ready-for-code-fix

Problem: `ui.updateNotificationBadge()` still contains a legacy fallback
lookup for `#notification-count`, while `#notif-count` is canonical.

Patch:

- `.agents/skills/ui/SKILL.md`
- `.agents/skills/notifications/SKILL.md`
- `.agents/skills/review/SKILL.md`

Contract update:

- `#notif-count` is the only canonical notification badge ID.
- New code must not add or preserve `#notification-count`.
- Review should flag `#notification-count` as stale unless it appears only
  in a historical note outside build instructions.

Code Fix:

- Rerun the updated UI skill or a focused UI fix to remove the fallback
  from `ui.updateNotificationBadge()`.
- Read-only scan: `js/ui.js` still references `#notification-count`.

Review:

- Confirm `#notif-count` remains wired and badge updates still work.

### Notification Settings Action

Status: ready-for-code-fix

Problem: Settings wording says notification toggle, but the auth module does
not export a permission-request helper after first login. Current behavior can
show status/help, but should not imply a working enable toggle unless a public
permission contract exists.

Patch:

- `AGENTS.md`
- `.agents/skills/settings/SKILL.md`
- `.agents/skills/app/SKILL.md`

Contract update:

- Settings v1 displays notification permission status and explanatory help.
- Settings must not call private auth-module internals.
- A true enable-notifications action requires a public auth/app permission
  request contract first.
- If permission is denied, show:
  `Notifications disabled. You can enable them in browser settings.`

Code Fix:

- Rerun the updated settings skill or a focused settings UI fix to revise
  notification action copy/status so it does not promise enabling notifications.
- If enabling from settings is desired later, first update AGENTS and auth/app
  skills with a public permission-request contract.
- Read-only scan: `js/ui.js` still renders `Enable notifications` for default
  or unknown status.

Review:

- Confirm settings copy does not promise unavailable behavior.

### Review Browser Automation Timeout

Status: closed

Problem: Multiple formal reviews produced browser automation timeout warnings.
The review skill should distinguish an unavailable browser environment from a
failed browser test.

Patch:

- `.agents/skills/review/SKILL.md`

Contract update:

- If browser automation cannot start or times out before app assertions run,
  report it as `WARN - Browser Check`.
- Do not report unavailable automation as PASS.
- Do not report unavailable automation as FAIL unless the session explicitly
  requires a runtime browser pass and no alternative validation is acceptable.
- Static checks must still run and be listed separately.

Code Fix:

- None. This is a review-reporting contract update only.
- Docs patched in `.agents/skills/review/SKILL.md`; no production code fix is
  required.

Review:

- Confirm future review reports separate static checks from browser availability.
