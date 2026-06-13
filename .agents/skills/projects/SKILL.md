---
name: projects
description: "Session 7 of 17: build the Taskly project management UI contracts and project view shell, including project CRUD entry points, sidebar project list behavior, progress bar data contract, project switching targets, and delete confirmation flow. Use when implementing project management after db.js and ui.js exist, while leaving app.js wiring to Session 13."
---

# Session 7 - Projects

## Purpose

Build the project-management surface for Taskly so users can create, rename,
delete, and switch between projects without collapsing module boundaries.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/projects/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve project-management product scope.
- Inspect `js/db.js`, `js/ui.js`, and `index.html` for the actual current
  project contracts.
- Do not preload prior skill files unless a contract conflict cannot be
  resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 7
project-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- The project view shell inside `#view-project`.
- Project-specific UI render helpers in `js/ui.js`.
- Project create and rename modal helpers in `js/ui.js`.
- Project view styling in `style.css`.
- The contract for sidebar project progress bars and project switching targets.

This session does not build:

- No Firestore CRUD implementation in `js/db.js` because it already exists.
- No app state wiring in `js/app.js`.
- No event listener wiring for project buttons or project links.
- No task CRUD.
- No search/filter logic.
- No dashboard listener logic.
- No notification logic.

Session 13 wires project CRUD actions and project switching through `app.js`
using the APIs and renderers defined earlier.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`
- `js/ui.js`

Do not modify `js/db.js`, `js/app.js`, `js/router.js`, `js/auth.js`, or
`js/config.js` in this session.

## Existing Implementation Assumptions

- `db.createProject(userId, name)` already exists.
- `db.updateProject(userId, projectId, data)` already exists.
- `db.deleteProject(userId, projectId)` already exists.
- `db.listenToProjects(userId, callback)` already exists.
- `ui.renderProjectList(projects, activeProjectId)` already renders sidebar
  rows and progress bars from passed project data.
- `ui.showConfirmModal(message, onConfirm)` already exists for delete
  confirmation.
- `#sidebar-project-list`, `#btn-new-project`, and `#view-project` already
  exist in `index.html`.

## Critical Data Contract

`db.listenToProjects()` currently returns project documents without task counts.
Do not assume `db.js` already supplies progress data.

Project objects passed into `ui.renderSidebar()` and `ui.renderProjectList()`
must eventually follow this enriched shape:

```javascript
{
  id: 'project-id',
  name: 'Project Name',
  createdAt: timestamp,
  taskCount: 0,
  completedCount: 0
}
```

Session 13 is responsible for enriching projects with `taskCount` and
`completedCount` before rendering progress bars. Session 7 must document this
explicitly so the sidebar does not rely on nonexistent DB fields.

## Required DOM Structure

Build the project view inside `#view-project`.
Keep `#view-project` itself unchanged.

Required IDs inside `#view-project`:

- `#project-header`
- `#project-title`
- `#project-meta`
- `#btn-edit-project`
- `#btn-delete-project`
- `#task-list`

Recommended structure:

1. Project header area with title and small metadata.
2. Project action buttons for rename and delete.
3. Main task list region for Sessions 8-9.

Rules:

- `#task-list` belongs inside `#view-project` and is introduced here.
- The topbar `h1` remains the only page `h1`.
- Use `h2` for the project title.
- `#task-list` should be a neutral container such as `div`.
- Do not create any non-canonical project container ID; use `#view-project`.

## Required UI Functions

Add these exported functions to `js/ui.js`:

- `renderProjectView(project)`
- `showAddProjectModal()`
- `showEditProjectModal(project)`

Purpose of each:

- `renderProjectView(project)` updates the project header shell and leaves task
  rendering to existing and later task render functions.
- `showAddProjectModal()` opens a project-name-only modal for creating a new
  project.
- `showEditProjectModal(project)` opens the same modal prefilled for rename.

Keep `showConfirmModal()` as the delete-confirmation modal. Do not create a
separate delete-project modal function.

## UI Function Behavior

### renderProjectView(project)

- Target only the project view shell created in `index.html`.
- Update `#project-title` with the current project name.
- Update `#project-meta` with concise project information such as created date
  or project status copy. Keep it brief.
- Stamp `data-project-id` onto project action buttons if useful for later
  app.js wiring.
- Do not render tasks directly here; Sessions 8-9 and existing task renderers
  own `#task-list`.
- If `project` is missing or null, do not crash. Render a safe fallback state
  or leave the current shell unchanged until app.js decides how to recover.

### showAddProjectModal()

- Reuse the existing global modal overlay and panel.
- Render a simple form with one required name field.
- Include inline validation placeholder space for later app.js error display.
- Include Cancel and Save actions.
- Do not submit to Firestore here.

### showEditProjectModal(project)

- Reuse the same form and modal structure as add-project.
- Prefill the name field from `project.name`.
- Keep behavior purely presentational; app.js will handle submit.

## Modal Requirements

Project create and rename should use the shared modal system in `ui.js`, not
`window.prompt()`.

Rules:

- Use the existing `#modal-overlay` and `#modal-panel`.
- Preserve `role="dialog"` and `aria-modal="true"`.
- Use `textContent`, never `innerHTML`, for project names.
- Label the project name input properly.
- Leave focus trapping and Escape-close behavior to Session 16.

## Sidebar Behavior Contract

Sidebar project rows are rendered by `ui.renderProjectList()`. Session 7 should
not replace that contract.

Required behavior contract for later wiring:

- Clicking a project row switches to `#view-project`.
- The active project row uses `.nav-item--active`.
- Progress bar fill is derived from `completedCount / taskCount`.
- A project with zero tasks shows a 0% progress bar without errors.
- No-projects state uses the existing empty-state copy from Session 5.

## Delete Confirmation Contract

Deleting a project must always require confirmation before calling
`db.deleteProject()`.

Use this confirmation message pattern:

`Delete [project name]? All tasks will also be permanently deleted. This cannot be undone.`

Use `ui.showConfirmModal()` for the UI. Session 13 wires the confirm callback.

## Error Handling

Use the user-facing messages from `AGENTS.md`.

- Empty project name: `"Please enter a project name."`
- Duplicate project name: `"A project with this name already exists."`
- Missing project: `"This project no longer exists."`
- Firebase load failure: `"Unable to load data. Please try again."`
- Unknown failure: `"Something went wrong. Please try again."`

Do not show raw Firebase error codes to users.

## CSS Requirements

Append project shell styles to the end of `style.css` under a clear Session 7
comment header.

Required classes:

- `.project-header`
- `.project-header__body`
- `.project-header__title`
- `.project-header__meta`
- `.project-header__actions`
- `.project-shell`
- `.project-shell__tasks`
- `.project-modal`
- `.project-modal__field`
- `.project-modal__error`

Rules:

- Use existing CSS variables only.
- Do not hardcode hex colors.
- Keep mobile-first layout.
- Project header actions must remain usable at 375px.
- Do not add horizontal scrolling.
- Keep the project shell visually consistent with dashboard/task cards.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, or `fetch` from `ui.js`.
- Do not add event listeners in `ui.js`.
- Do not manipulate DOM from `db.js` or `auth.js`.
- Do not add `window.prompt()` or `window.confirm()`.
- Do not implement task cards, task sort logic, or task form wiring here.
- Do not put project state into `ui.js`.
- Do not assume `db.listenToProjects()` returns progress counts.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm the project shell loads with no console errors.
- In the browser console, call `ui.renderProjectView({ id: 'p1', name: 'Test Project' })`.
- Confirm `#project-title` and `#project-meta` update safely.
- Call `ui.showAddProjectModal()` and confirm the name-only modal appears.
- Call `ui.showEditProjectModal({ id: 'p1', name: 'Renamable Project' })` and
  confirm the input is prefilled.
- Call `ui.showConfirmModal('Delete Test Project?', () => {})` and confirm the
  existing confirmation modal remains suitable for project deletion.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css js/ui.js
git commit -m "feat: build project management view and project modals"
git push origin dev
```
