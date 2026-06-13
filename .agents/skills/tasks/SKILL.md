---
name: tasks
description: "Session 8 of 17: build Taskly task-management UI contracts for creating, editing, completing, deleting, sorting, and highlighting tasks, including task card action hooks, complete toggle metadata, task modal fields, inline validation targets, FAB readiness, and Session 13 app.js wiring contracts. Use after db.js, ui.js, dashboard, and projects sessions exist."
---

# Session 8 - Tasks

## Purpose

Build the task-management surface so project tasks can be created, edited,
completed, deleted, sorted, and rendered consistently once app.js wires the
existing db.js APIs to the UI.

## Required Reading

Before writing code, read these files completely:

- `AGENTS.md`
- `.agents/skills/tasks/SKILL.md`

Load extra context only when needed:

- Read `PLAN.md` only to resolve task product scope.
- Inspect `js/db.js`, `js/ui.js`, `index.html`, and `style.css` for the actual
  current task contracts.
- Do not preload prior skill files unless a contract conflict cannot be
  resolved from `AGENTS.md` or current code.

## Source Of Truth

`AGENTS.md` is the source of truth. This skill adds only Session 8
task-specific instructions.

If this skill conflicts with `AGENTS.md`, stop and report the conflict before
editing files.

## Scope

This session builds:

- Task card action hooks for complete, edit, and delete.
- Task form completeness for all MVP task fields.
- Task modal validation targets for inline errors.
- FAB and Add Task button readiness for later app.js wiring.
- Task sorting and filtering contracts for Session 13.
- Task CSS refinements needed by new task controls.

This session does not build:

- No Firestore CRUD implementation in `js/db.js` because it already exists.
- No app state wiring in `js/app.js`.
- No event listener wiring for task buttons, checkboxes, modal submit, or FAB.
- No search/filter implementation.
- No notifications.
- No offline network handling.
- No dashboard collection-group listener wiring.

Session 13 wires task CRUD through `app.js` using the db.js APIs and UI hooks
defined here.

## Allowed Files

This session may modify only:

- `index.html`
- `style.css`
- `js/ui.js`

Do not modify `js/db.js`, `js/app.js`, `js/router.js`, `js/auth.js`, or
`js/config.js` in this session.

## Existing Implementation Assumptions

- `db.createTask(userId, projectId, taskData)` already exists and stamps `userId`.
- `db.updateTask(userId, projectId, taskId, data)` already exists.
- `db.deleteTask(userId, projectId, taskId)` already exists.
- `db.listenToTasks(userId, projectId, callback)` already exists.
- `#task-list` already exists inside `#view-project`.
- `#btn-add-task` already exists in the topbar.
- `#fab-add-task` already exists globally.
- `ui.renderTaskList()`, `ui.renderTaskCard()`, `ui.showAddTaskModal()`, and
  `ui.showEditTaskModal(task)` already exist, but may need Session 8 refinements.

## Required Task Data Shape

Task objects rendered by ui.js must support this shape:

```javascript
{
  id: 'task-id',
  projectId: 'project-id',
  userId: 'user-id',
  title: 'Task title',
  description: '',
  dueDate: null,
  priority: 'none',
  category: '',
  status: 'todo',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Every new task written through `db.createTask()` must include `userId`.
This is already db.js responsibility; do not duplicate Firestore write logic in
ui.js.

## Task Form Requirements

The Add/Edit task form must include:

- `title` text input, required, max length from `MAX_TITLE_LENGTH`.
- `description` textarea, optional.
- `dueDate` date input, optional.
- `priority` select with `none`, `low`, `medium`, `high`.
- `category` select from `CATEGORIES` plus a custom option if already present.
- `status` select with `todo`, `inprogress`, `done`.
- Inline validation target for task title errors.
- Cancel and Save actions.

Rules:

- Add and edit modals must reuse the same task form builder.
- `showEditTaskModal(task)` must prefill title, description, due date,
  priority, category, and status.
- `showAddTaskModal()` must default priority to `DEFAULT_PRIORITY` and status
  to `STATUS_TODO`.
- Do not submit to Firestore from ui.js.
- Use existing global modal overlay and panel.

## Task Card Requirements

`renderTaskCard(task)` must expose clear hooks for later app.js event delegation:

- The card must have `data-task-id`.
- The card should carry `data-project-id` when `task.projectId` exists.
- The complete checkbox must have `data-task-action="toggle-status"`.
- The edit button must have `data-task-action="edit"`.
- The delete button must have `data-task-action="delete"`.
- Action controls should carry `data-task-id`; include `data-project-id` when
  available.

Visual behavior:

- Completed tasks use `.task-card--done`.
- Incomplete overdue tasks use `.task-card--overdue`.
- Today tasks use `.task-card--today`.
- Completed tasks should not be styled as overdue.
- Priority must remain dot plus text label; color alone is not enough.
- Tasks with no due date omit due-date text.
- Tasks with no category omit the category tag.

## Complete Toggle Contract

Clicking the checkbox is wired in Session 13, but Session 8 must make the target
unambiguous.

Later app.js behavior:

- If current status is `done`, update to `todo`.
- If current status is not `done`, update to `done`.
- Use `db.updateTask(userId, projectId, taskId, { status })`.
- Do not change title, priority, dueDate, category, or userId during the toggle.

## Delete Confirmation Contract

Deleting a task must always require confirmation before calling
`db.deleteTask()`.

Use this confirmation message pattern:

`Delete this task?`

Use `ui.showConfirmModal()` for the UI. Session 13 wires the confirm callback.

## Sorting Contract

`db.listenToTasks()` already sorts by due date ascending with no-date tasks last.
Session 8 must not add sorting in ui.js.

Later app.js should treat the listener result as already sorted unless Session 9
search/filter creates a filtered list that needs preserving the same order.

Rules:

- No due date tasks appear last.
- Due dates sort earliest first.
- Sorting happens before `ui.renderTaskList()`.
- ui.js renders the array it receives.

## FAB And Add Button Contract

The FAB and topbar Add Task button are entry points for the same Add Task modal.

Rules:

- `#btn-add-task` remains in the topbar.
- `#fab-add-task` remains global and available.
- Session 8 may ensure the FAB is visible in app/project contexts, but must not
  wire click listeners.
- Session 13 wires both buttons to `ui.showAddTaskModal()`.
- Add task should require an active project. If no project is selected, app.js
  must show `"This project no longer exists."` or a contextual missing-project
  state rather than creating an orphan task.

## Error Handling

Use the user-facing messages from `AGENTS.md`.

- Empty task title: `"Please enter a task title."`
- Missing project: `"This project no longer exists."`
- Firebase load failure: `"Unable to load data. Please try again."`
- Unknown failure: `"Something went wrong. Please try again."`

Do not show raw Firebase error codes to users.

## CSS Requirements

Append task-specific refinements to the end of `style.css` under a clear
Session 8 comment header only when existing styles are insufficient.

Potential required classes:

- `.task-form__error`
- `.task-form__custom-category`
- `.task-card__status`
- `.task-card__action`
- `.task-card__action--edit`
- `.task-card__action--delete`

Rules:

- Use existing CSS variables only.
- Do not hardcode hex colors.
- Keep task cards full width.
- Keep mobile touch targets at least 44px where controls are interactive.
- Do not introduce horizontal scrolling.
- Do not duplicate existing Session 5 task-card styles unless refinement is
  required.

## Boundary Rules

- Do not call Firebase, Firestore, Auth, FCM, or `fetch` from `ui.js`.
- Do not add event listeners in `ui.js`.
- Do not put task state into `ui.js`.
- Do not implement search/filter logic in this session.
- Do not modify `db.js` unless a blocking mismatch is found and reported first.
- Do not use `innerHTML` for user or Firestore data.
- Do not use `window.prompt()` or `window.confirm()`.
- Do not create a second task list container.

## Manual Browser Check

After implementation:

- Open `index.html` and confirm no console errors.
- Call `ui.showAddTaskModal()` and confirm the modal includes title,
  description, due date, priority, category, status, validation space, Cancel,
  and Save.
- Call `ui.showEditTaskModal(mockTask)` and confirm every task field is
  prefilled, including status and due date.
- Call `ui.renderTaskList([mockTask], { status: 'all', priority: 'all', category: 'all' }, '')`.
- Confirm the task card has `data-task-id` and action hooks for toggle, edit,
  and delete.
- Confirm overdue, today, and done visual states still render correctly.
- Confirm `#fab-add-task` exists and is positioned as the global add entry.

## Review Handoff

Do not duplicate the full QA checklist here.
After implementation, run `.agents/skills/review/SKILL.md` before committing.
The review skill owns the complete validation checklist and final report format.

## Commit

After review passes:

```bash
git add index.html style.css js/ui.js
git commit -m "feat: build task management UI contracts"
git push origin dev
```
