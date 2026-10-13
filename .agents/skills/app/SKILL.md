---
name: app
description: "Session 13 of 17: build Taskly app.js orchestration for application state, auth initialization, Firestore listener lifecycle, dashboard/project/task wiring, search and filter execution, notifications, offline handling, settings actions, modal submissions, and listener cleanup. Use after Sessions 1-12 are complete and UI/db/router/auth contracts exist."
---

# Session 13 Skill: app

## Purpose

Build the Taskly orchestration layer in `js/app.js`.

This session connects existing modules together. It owns application state, event listeners, Firestore listener lifecycle, view-level orchestration, filtering execution, notification state, offline state, and sign-out cleanup.

This session must not redesign lower-level modules. If a required `db.js`, `ui.js`, `router.js`, or auth module contract is missing, stop and report the mismatch instead of editing another module.

## Required Reading

Read these files before implementation:

- `AGENTS.md`
- `.agents/skills/app/SKILL.md`

Inspect these only as needed to confirm current contracts:

- `PLAN.md`
- `index.html`
- `js/app.js`
- `js/auth.js`
- `js/router.js`
- `js/db.js`
- `js/ui.js`

Do not load unrelated skill files unless a contract conflict requires comparison.

## Allowed Build Files

Session 13 may modify only:

- `js/app.js`

## Forbidden Files

Do not modify:

- `index.html`
- `style.css`
- `js/config.js`
- `js/auth.js`
- `js/router.js`
- `js/db.js`
- `js/ui.js`
- any skill file

If implementation appears to require changes outside `js/app.js`, stop and report the exact missing contract.

## Existing Module Contracts

Use the existing module globals provided by prior sessions:

- Auth module: `initAuthListener(onSignIn, onSignOut)`, `signInWithGoogle()`, `signOut()`
- Router module: `showView(viewName)`, `setTopbarTitle(title)`, `initRouter()`
- DB module: all Firestore CRUD/listener functions listed in `AGENTS.md`
- UI module: renderers, modals, banners, notification helpers, settings helper, and task filter helpers listed in `AGENTS.md`

Do not call Firebase SDK APIs directly from `app.js`.

Do not call private functions that are not exported by the existing modules.

If a required ui.js helper from AGENTS.md is missing, stop and report the
missing contract instead of writing user-visible DOM content directly in
app.js.

## Required State

Preserve the canonical state shape in `js/app.js`:

```javascript
const state = {
  user: null,
  currentProjectId: null,
  projects: [],
  tasks: [],
  dashboardData: {
    overdue: [],
    today: [],
    upcoming: [],
    activity: []
  },
  filters: {
    status: 'all',
    priority: 'all',
    category: 'all'
  },
  searchQuery: '',
  notifications: [],
  unreadCount: 0,
  listeners: [],
  isOffline: false
};
```

Additional module-local variables are allowed only for orchestration guard rails, such as:

- preventing duplicate DOM listener binding on repeated sign-in
- tracking the active project task listener
- tracking task ids that already triggered in-app/browser notifications
- tracking search debounce timer id

Keep all application state in `app.js`.

## Public API

Expose a minimal app namespace for existing modules:

```javascript
window.app = {
  init,
  handleSearch,
  handleFilter,
  handleProjectSwitch,
  handleSignOut
};
```

Do not expose internal helper functions unless another existing module already requires them.

## Required Implementation

### Initialization

Implement `init(user)` as the main auth-success entry point.

It must:

- detach existing Firestore listeners before starting a new session
- reset session state without losing the signed-in user
- store the current user in `state.user`
- render user-facing chrome through existing UI helpers
- render sidebar user fields through `ui.renderSidebarUser(user)` when present
- bind DOM event listeners once only
- initialize offline status from `navigator.onLine`
- start the projects listener
- start the dashboard collection-group listener
- render settings view using the current user and notification status
- render initial loading, empty, or dashboard UI through `ui.js`

Repeated calls to `init(user)` must not duplicate event listeners.

### Listener Lifecycle

Every Firestore `onSnapshot` unsubscribe function returned by `db.js` must be stored in `state.listeners`.

Implement cleanup helpers that:

- call every unsubscribe function safely
- clear `state.listeners`
- detach the active project task listener when switching projects
- clear project/task/dashboard state on sign-out

On sign-out, detach all listeners before calling the auth module sign-out function.

### Dashboard Listener Resilience

The dashboard collection-group listener can emit one transient mapped error after a project batch delete:

```text
Unable to load data. Please try again.
```

When this specific error comes from `listenToDashboardTasks()`:

- do not show a persistent error banner
- detach the failed dashboard listener if still tracked
- re-subscribe to dashboard tasks
- keep the dashboard in a loading or reconnecting state if needed

For other dashboard listener errors, render a visible human-readable error through `ui.js`.

### Projects

Wire project data using `db.listenToProjects(userId, callback)`.

On project updates:

- store projects in `state.projects`
- enrich project display data with task counts when dashboard task data is available
- render sidebar projects with `ui.renderSidebar(projects, state.currentProjectId)`
- keep the active project selected if it still exists
- if the active project was deleted, clear the active project and return to the dashboard view

Project create/update/delete actions must call only the matching `db.js` functions.

Project delete must require `ui.showConfirmModal(message, onConfirm)`.

### Project Switching

Implement `handleProjectSwitch(projectId)`.

It must:

- find the selected project in `state.projects`
- show `"This project no longer exists."` if missing
- set `state.currentProjectId`
- switch to the project view through the router module
- render the project header through `ui.renderProjectView(project)`
- detach any previous project task listener
- start `db.listenToTasks(userId, projectId, callback)`
- render task filters and the filtered task list

Never use the dashboard collection-group query for a project-specific task list.

### Tasks

Wire task create/update/delete/complete actions through `db.js`.

Task writes must:

- trim user input before passing data to `db.js`
- validate title before write
- validate priority against allowed values
- validate status against allowed values
- pass `userId` through `db.createTask()` so the DB layer can persist it on the task document
- pass due dates as `Date` objects or `null`, not Firebase SDK timestamp objects

Task completion toggles must update status through `db.updateTask()`.

Task delete must require `ui.showConfirmModal(message, onConfirm)`.

Write activity log entries with `db.writeActivityLog(userId, event)` where appropriate. Activity logging must not make the primary create/update/delete action fail if the log write fails.

### Search and Filters

Implement client-side filtering in `app.js`.

`handleSearch(query)` must:

- debounce the search input at `150ms`
- trim the query before filtering
- search task `title`, `description`, and `category`
- match case-insensitively
- update `state.searchQuery`
- call the shared render path

`handleFilter(type, value)` must:

- support only `status`, `priority`, and `category`
- support `all` for every filter type
- update `state.filters`
- update visible filter active states through `ui.updateActiveFilters(state.filters)` if available
- call the shared render path

Filters combine by intersection.

`ui.renderTaskList(tasks, filters, searchQuery)` must receive already-filtered tasks.

Do not perform Firestore reads for search or filtering.

### Dashboard Data

Derive dashboard sections from tasks returned by `db.listenToDashboardTasks()`.

Required grouping:

- overdue: due date before today and status is not done
- today: due today and status is not done
- upcoming: due after today and status is not done
- activity: local recent activity entries if available, otherwise an empty array

Render dashboard data with `ui.renderDashboard(data)`.

Do not add a new Firestore activity listener in this session.

### Notifications

Maintain notification state in `state.notifications`.

Notification objects must follow this shape:

```javascript
{
  id: 'string',
  type: 'overdue' | 'today' | 'system',
  message: 'string',
  timestamp: Date,
  read: false,
  taskId: 'optional string',
  projectId: 'optional string'
}
```

`state.unreadCount` must be derived from unread notification objects.

Use existing UI helpers to:

- render notification alert banners
- render the notification panel
- update the unread badge
- show and hide the notification panel

Wire notification action hooks from the UI:

- mark one notification as read
- dismiss one alert
- clear all notifications
- toggle the notification panel from the bell

Browser notifications are event-triggered only. If the browser supports notifications and permission is already granted, app.js may fire a browser notification for newly detected due-today or overdue task events.

Do not:

- request notification permission from UI code
- alter FCM token saving
- add service workers
- add Cloud Functions
- add scheduled 8AM reminders

If notification permission is denied or unsupported, fall back to in-app alerts only.

### Offline State

Wire browser network events in `app.js`.

Required behavior:

- set `state.isOffline` from `navigator.onLine`
- on `offline`, call `ui.showOfflineBanner()`
- on `online`, call `ui.hideOfflineBanner()`
- treat offline writes as queued, not as errors

Do not implement a custom sync engine, polling, manual retry loop, or manual Firestore re-query on reconnect.

### Settings

Render settings through `ui.renderSettingsView(user, notificationStatus)`.

Notification status should be derived safely from the browser `Notification` API when available:

- `granted`
- `denied`
- `default`
- `unsupported`

Wire settings action hooks:

- settings navigation: delegated sidebar nav handling must support
  `data-view="settings"`
- notification action: show status/help only unless an exported public auth/app
  contract exists for requesting permission
- notification action must not call private auth-module internals
- denied notification help must use exactly:
  `Notifications disabled. You can enable them in browser settings.`
- theme action: no-op or coming-soon feedback only
- sign-out action: use `ui.showSignOutConfirmModal(onConfirm)` when available, otherwise `ui.showConfirmModal(message, onConfirm)`

Before sign-out, detach all Firestore listeners.

### Events

All DOM event listeners live in `app.js`.

Use delegated listeners where practical for dynamic UI:

- sidebar navigation via `data-view`
- sidebar project switching via `data-project-id`
- project create/edit/delete entry points
- task card actions via `data-task-action`
- filter controls via `data-filter-type` and `data-filter-value`
- empty-state actions via `data-empty-action`
- notification actions via `data-notification-action`
- settings actions via `data-settings-action`
- modal cancel and confirm actions via `data-modal-action`
- search input
- add task buttons and FAB
- sign-out button
- online/offline browser events

Do not attach inline handlers in HTML.

Do not bind duplicate listeners after repeated sign-in.

### Router Integration

Use the router module for view switching.

The `tasks` navigation target represents the task/project area. If there is an active project, route to the project view. If there is no active project, show the project/task empty state through existing UI helpers.

Do not create new view IDs.

## Boundaries

`app.js` must not:

- call Firebase SDK APIs directly
- perform direct Firestore reads/writes
- mutate DOM content directly when a UI helper exists
- use `innerHTML` for user or Firestore data
- implement rendering that belongs in `ui.js`
- add CSS or HTML
- change auth/session logic
- change Firestore data access logic
- introduce any framework, build tool, package, or dependency
- use `console.log` in committed code

Small DOM reads for event targets and form values are allowed because `app.js` owns event handling. DOM writes should go through `ui.js`.

Required visible write helpers from AGENTS.md:

- `ui.renderSidebarUser(user)` for sidebar profile fields.
- `ui.renderTaskModalValidation(message)` and
  `ui.clearTaskModalValidation()` for task modal inline validation.
- `ui.renderProjectModalValidation(message)` and
  `ui.clearProjectModalValidation()` for project modal inline validation.

Do not replace these with direct `textContent`, `hidden`, `classList`, or
attribute writes in app.js once the helpers exist.

## Validation Requirements

After implementation, run the review skill:

- `.agents/skills/review/SKILL.md`

Minimum local checks for this session:

- `node --check js/app.js`
- `git diff --check`
- stale API/name scan for forbidden older contracts from the review skill
- no `console.log` in committed JavaScript
- no direct Firebase SDK calls in `js/app.js`
- no private auth-module calls from settings notification actions
- no direct user-visible DOM writes where AGENTS.md defines a ui.js helper
- no new writes outside `js/app.js`

Do not duplicate the full review checklist in this skill. Use `.agents/skills/review/SKILL.md` for the formal report.

## Completion Criteria

Session 13 is ready for review when:

- `js/app.js` is the only modified build file
- app initialization runs without duplicate listeners
- all Firestore listeners are tracked and detached on sign-out
- dashboard, projects, tasks, search, filters, notifications, offline, and settings are wired through existing module contracts
- dashboard listener transient delete errors trigger re-subscribe instead of a persistent user error
- all user-visible errors are human-readable
- no lower-level module boundaries are violated
- review reports zero blocking failures
