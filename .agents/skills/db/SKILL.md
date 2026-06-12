---
name: db
description: Firestore CRUD functions, real-time listeners, collection group query for dashboard, user profile saving, and activity log writing.
---
## Session: 4 of 17
## Scope: db.js — ALL Firestore CRUD · real-time listeners · collection group query · activity log
## References: AGENTS.md §5, §6, §7, §8, §9, §13

---

AGENTS.md is the source of truth.
This file adds only what is specific to Session 4.
Do not repeat design tokens, naming conventions, module
boundaries, or error messages from AGENTS.md.

This is the largest and most critical session. Every other
feature session depends on db.js being correct. Read this
file completely before writing any code.

---

## WHAT THIS SESSION BUILDS

One file: `js/db.js` — fully implemented.
Session 1 stub is replaced with working code.
No other file is modified.

---

## WHAT THIS SESSION DOES NOT BUILD

- No DOM access — db.js never touches HTML
- No UI rendering — db.js never calls render functions
- No application state — db.js never reads or writes `state`
- No event listeners — those belong to app.js (Session 13)
- No data display — db.js returns data and unsubscribe functions only

If it is not a Firestore operation — it does not belong in db.js.

---

## 1. FIRESTORE PATH STRUCTURE — EXACT PATHS

Every function in this skill uses these paths. Get these
exactly right — typos here cause silent failures.

```
users/{userId}/profile/data
  → single document holding: name, email, photoURL, fcmToken, createdAt

users/{userId}/projects/{projectId}
  → document fields: name, createdAt

users/{userId}/projects/{projectId}/tasks/{taskId}
  → document fields: title, description, dueDate, priority,
    category, status, userId, createdAt, updatedAt

users/{userId}/activity/{activityId}
  → document fields: type, projectId, projectName, taskTitle,
    timestamp
```

Note on profile path: `profile` is a subcollection with exactly
one document. Use a fixed document ID `data` so it can be
referenced directly without a query:
`users/{userId}/profile/data`

---

## 2. CRITICAL RULE — userId ON EVERY TASK

This is the single most important rule in this session.

Every task document — on create AND on update — must contain
a `userId` field equal to the authenticated user's UID.

This is NOT optional and NOT the caller's responsibility to add.
`createTask()` stamps it. `updateTask()` preserves it (never
allow it to be overwritten or stripped by a partial update).

Without this field, `listenToDashboardTasks()` returns zero
results — the dashboard appears broken with no error shown.

---

## 3. VALIDATION SETS — REFERENCE THESE EXACTLY

Defined in config.js (Session 1/2). db.js imports nothing —
these are globals available because config.js loads first.

```javascript
// Already defined in config.js — do not redefine here
// DEFAULT_PRIORITY = 'none'
// STATUS_TODO = 'todo'
// STATUS_PROGRESS = 'inprogress'
// STATUS_DONE = 'done'
// CATEGORIES = ['Work', 'Personal', 'School', 'Dev', 'Urgent']
// MAX_TITLE_LENGTH = 200

const VALID_PRIORITIES = ['high', 'medium', 'low', 'none'];
const VALID_STATUSES = ['todo', 'inprogress', 'done'];
```

Every write that includes `priority` or `status` must validate
against these sets before writing. See AGENTS.md §13.

---

## 4. ERROR HANDLING PATTERN — USED IN EVERY FUNCTION

Every function wraps its Firestore call in try/catch and throws
a human-readable string on failure. See AGENTS.md §8 for the
full message table — db.js uses these specific entries:

```
Firebase failure  → "Unable to load data. Try again."
Missing project   → "This project no longer exists."
Empty task title  → "Please enter a task title."
Project name empty      → "Please enter a project name."
Duplicate project name  → "A project with this name already exists."
Unknown error     → "Something went wrong. Try again."
```

Shared private helper — not exported:

```javascript
/**
 * Maps a Firestore error to a human-readable message.
 * See AGENTS.md §8 for the full message table.
 * @param {Error} err - Firestore error object
 * @returns {string} Human-readable error message
 */
function mapDbError(err) {
  const code = err.code || '';
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Connection lost. Check your internet.';
  }
  if (code === 'permission-denied') {
    return 'Unable to load data. Try again.';
  }
  if (code === 'not-found') {
    return 'This project no longer exists.';
  }
  return 'Something went wrong. Try again.';
}
```

---

## 5. PROJECT CRUD FUNCTIONS

### createProject

```javascript
/**
 * Creates a new project document under the user's projects collection.
 * Validates the name is non-empty and not a duplicate before writing.
 * @param {string} userId - The authenticated user's UID
 * @param {string} name - The project name
 * @returns {Promise<string>} The new project document ID
 * @throws {string} Human-readable error message on failure
 */
async function createProject(userId, name) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw 'Please enter a project name.';
  }

  try {
    const projectsRef = db_firestore
      .collection('users').doc(userId)
      .collection('projects');

    // Check for duplicate name before writing
    const existing = await projectsRef
      .where('name', '==', trimmedName)
      .get();
    if (!existing.empty) {
      throw 'A project with this name already exists.';
    }

    const docRef = await projectsRef.add({
      name: trimmedName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (err) {
    if (typeof err === 'string') throw err; // re-throw validation messages
    throw mapDbError(err);
  }
}
```

### updateProject

```javascript
/**
 * Updates fields on an existing project document.
 * @param {string} userId - The authenticated user's UID
 * @param {string} projectId - The project document ID
 * @param {Object} data - Fields to update (e.g. { name: 'New Name' })
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function updateProject(userId, projectId, data) {
  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw 'Please enter a project name.';
    }
    data = { ...data, name: trimmedName };
  }

  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId)
      .update(data);
  } catch (err) {
    throw mapDbError(err);
  }
}
```

### deleteProject

```javascript
/**
 * Deletes a project and all of its tasks.
 * Tasks are deleted first via batch, then the project document.
 * @param {string} userId - The authenticated user's UID
 * @param {string} projectId - The project document ID
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function deleteProject(userId, projectId) {
  try {
    const projectRef = db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId);

    // Batch delete all tasks first — never loop individual deletes
    const tasksSnapshot = await projectRef.collection('tasks').get();
    const batch = db_firestore.batch();
    tasksSnapshot.forEach((doc) => batch.delete(doc.ref));
    batch.delete(projectRef);

    await batch.commit();
  } catch (err) {
    throw mapDbError(err);
  }
}
```

### listenToProjects

```javascript
/**
 * Listens to the user's projects collection in real time.
 * @param {string} userId - The authenticated user's UID
 * @param {Function} callback - Called with an array of project
 *                               objects ({ id, name, createdAt })
 *                               on every change
 * @returns {Function} Unsubscribe function — caller must store
 *                      this in state.listeners and call it on
 *                      sign-out
 */
function listenToProjects(userId, callback) {
  return db_firestore
    .collection('users').doc(userId)
    .collection('projects')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        const projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(projects);
      },
      (err) => {
        // onSnapshot errors cannot throw — caller handles via callback
        callback([], mapDbError(err));
      }
    );
}
```

---

## 6. TASK CRUD FUNCTIONS

### createTask

CRITICAL: stamps `userId` on every document. See Section 2.

```javascript
/**
 * Creates a new task document under the given project.
 * CRITICAL: Always stamps the userId field — required for the
 * dashboard collection group query (AGENTS.md §7).
 * Validates title is non-empty and priority/status are valid.
 * @param {string} userId - The authenticated user's UID
 * @param {string} projectId - The parent project document ID
 * @param {Object} taskData - Task fields: title, description,
 *                             dueDate, priority, category, status
 * @returns {Promise<string>} The new task document ID
 * @throws {string} Human-readable error message on failure
 */
async function createTask(userId, projectId, taskData) {
  const title = (taskData.title || '').trim();
  if (!title) {
    throw 'Please enter a task title.';
  }

  const priority = taskData.priority || DEFAULT_PRIORITY;
  const status = taskData.status || STATUS_TODO;

  if (!VALID_PRIORITIES.includes(priority)) {
    throw 'Something went wrong. Try again.';
  }
  if (!VALID_STATUSES.includes(status)) {
    throw 'Something went wrong. Try again.';
  }

  try {
    const docRef = await db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId)
      .collection('tasks')
      .add({
        title: title.slice(0, MAX_TITLE_LENGTH),
        description: (taskData.description || '').trim(),
        dueDate: taskData.dueDate || null,
        priority,
        category: (taskData.category || '').trim(),
        status,
        userId, // CRITICAL — required for collection group query
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return docRef.id;
  } catch (err) {
    if (typeof err === 'string') throw err;
    throw mapDbError(err);
  }
}
```

### updateTask

CRITICAL: never strips `userId` — only updates the fields given.

```javascript
/**
 * Updates fields on an existing task document.
 * Always sets updatedAt to the current server time.
 * Never modifies the userId field — partial updates preserve it
 * automatically since Firestore update() only touches given fields.
 * Validates title (if provided), priority, and status.
 * @param {string} userId - The authenticated user's UID
 * @param {string} projectId - The parent project document ID
 * @param {string} taskId - The task document ID
 * @param {Object} data - Fields to update
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function updateTask(userId, projectId, taskId, data) {
  const updates = { ...data };

  if (updates.title !== undefined) {
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) {
      throw 'Please enter a task title.';
    }
    updates.title = trimmedTitle.slice(0, MAX_TITLE_LENGTH);
  }

  if (updates.description !== undefined) {
    updates.description = updates.description.trim();
  }

  if (updates.category !== undefined) {
    updates.category = updates.category.trim();
  }

  if (updates.priority !== undefined &&
      !VALID_PRIORITIES.includes(updates.priority)) {
    throw 'Something went wrong. Try again.';
  }

  if (updates.status !== undefined &&
      !VALID_STATUSES.includes(updates.status)) {
    throw 'Something went wrong. Try again.';
  }

  updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId)
      .collection('tasks').doc(taskId)
      .update(updates);
  } catch (err) {
    if (typeof err === 'string') throw err;
    throw mapDbError(err);
  }
}
```

### deleteTask

```javascript
/**
 * Deletes a single task document.
 * @param {string} userId - The authenticated user's UID
 * @param {string} projectId - The parent project document ID
 * @param {string} taskId - The task document ID
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function deleteTask(userId, projectId, taskId) {
  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId)
      .collection('tasks').doc(taskId)
      .delete();
  } catch (err) {
    throw mapDbError(err);
  }
}
```

### listenToTasks

```javascript
/**
 * Listens to all tasks within a single project in real time.
 * Sorted by dueDate ascending — tasks with no due date last.
 * @param {string} userId - The authenticated user's UID
 * @param {string} projectId - The project document ID
 * @param {Function} callback - Called with an array of task
 *                               objects on every change
 * @returns {Function} Unsubscribe function — caller must store
 *                      this in state.listeners
 */
function listenToTasks(userId, projectId, callback) {
  return db_firestore
    .collection('users').doc(userId)
    .collection('projects').doc(projectId)
    .collection('tasks')
    .onSnapshot(
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(sortTasksByDueDate(tasks));
      },
      (err) => {
        callback([], mapDbError(err));
      }
    );
}
```

### sortTasksByDueDate (private — not exported)

Shared by `listenToTasks` and `listenToDashboardTasks`.
See AGENTS.md — sorting rule: ascending, no-due-date last.

```javascript
/**
 * Sorts an array of task objects by dueDate ascending.
 * Tasks with no dueDate are placed at the end.
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array (new array — does not mutate input)
 */
function sortTasksByDueDate(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.toMillis() - b.dueDate.toMillis();
  });
}
```

---

## 7. DASHBOARD — COLLECTION GROUP QUERY

This is the most important query in the application.
Read AGENTS.md §7 before touching this function.

```javascript
/**
 * Listens to tasks across ALL projects for the current user
 * using a Firestore collection group query.
 * Requires a composite index: userId (Asc) + dueDate (Asc),
 * Query scope: Collection group. Must exist in Firebase console
 * before this function is called — see AGENTS.md §7.
 * @param {string} userId - The authenticated user's UID
 * @param {Function} callback - Called with an array of task
 *                               objects (including projectId on
 *                               each, derived from the doc path)
 *                               on every change
 * @returns {Function} Unsubscribe function — caller must store
 *                      this in state.listeners
 */
function listenToDashboardTasks(userId, callback) {
  return db_firestore
    .collectionGroup('tasks')
    .where('userId', '==', userId)
    .onSnapshot(
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => {
          // Parent of a task doc is the project doc —
          // extract projectId from the document path
          const projectId = doc.ref.parent.parent.id;
          return {
            id: doc.id,
            projectId,
            ...doc.data(),
          };
        });
        callback(sortTasksByDueDate(tasks));
      },
      (err) => {
        callback([], mapDbError(err));
      }
    );
}
```

---

## 8. USER PROFILE AND FCM TOKEN

### saveUserProfile

Called by auth.js on every sign-in (merge — never overwrite
createdAt on repeat logins).

```javascript
/**
 * Saves or updates the user's profile document.
 * Uses merge so repeat logins do not overwrite createdAt.
 * createdAt is only set if the document does not already exist.
 * @param {string} userId - The authenticated user's UID
 * @param {Object} profileData - { name, email, photoURL }
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function saveUserProfile(userId, profileData) {
  try {
    const profileRef = db_firestore
      .collection('users').doc(userId)
      .collection('profile').doc('data');

    const existing = await profileRef.get();
    const payload = { ...profileData };

    if (!existing.exists) {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    await profileRef.set(payload, { merge: true });
  } catch (err) {
    throw mapDbError(err);
  }
}
```

### saveFcmToken

```javascript
/**
 * Saves the FCM push notification token to the user's profile.
 * @param {string} userId - The authenticated user's UID
 * @param {string} token - The FCM registration token
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function saveFcmToken(userId, token) {
  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('profile').doc('data')
      .set({ fcmToken: token }, { merge: true });
  } catch (err) {
    throw mapDbError(err);
  }
}
```

---

## 9. ACTIVITY LOG

Used by the dashboard's Recent Activity feed (Session 6).
This session only implements the write function.

```javascript
/**
 * Writes an activity log entry for the dashboard recent
 * activity feed.
 * @param {string} userId - The authenticated user's UID
 * @param {Object} eventData - { type, projectId, projectName,
 *                               taskTitle } — type is one of:
 *                               'task_created', 'task_completed',
 *                               'task_updated', 'project_created'
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure
 */
async function writeActivityLog(userId, eventData) {
  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('activity')
      .add({
        ...eventData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
  } catch (err) {
    throw mapDbError(err);
  }
}
```

Note: Calling `writeActivityLog` is the responsibility of app.js
(Session 13) — e.g. after a successful `createTask`, app.js calls
both `db.createTask(...)` and `db.writeActivityLog(...)`. db.js
does not call this internally from other db.js functions —
keeps each function single-purpose and testable.

---

## 10. WHAT db.js EXPORTS

```javascript
// At the bottom of db.js
window.db = {
  createProject,
  updateProject,
  deleteProject,
  listenToProjects,
  createTask,
  updateTask,
  deleteTask,
  listenToTasks,
  listenToDashboardTasks,
  saveUserProfile,
  saveFcmToken,
  writeActivityLog,
};
```

`mapDbError` and `sortTasksByDueDate` are private — not exported.

---

## 11. BOUNDARY RULES — WHAT db.js NEVER DOES

```javascript
// ❌ NEVER — DOM access
document.getElementById('...')
document.querySelector('...')

// ❌ NEVER — UI rendering
ui.renderTaskList(...)
renderAnything(...)

// ❌ NEVER — Application state
state.tasks = ...
state.projects = ...

// ❌ NEVER — Looped individual writes for batch operations
tasksSnapshot.forEach(doc => doc.ref.delete()) // ❌ — use batch instead

// ❌ NEVER — Modular Firebase imports
import { collection, query, where } from 'firebase/firestore'

// ❌ NEVER — One listener per document
tasks.forEach(task => task.ref.onSnapshot(...)) // ❌
```

---

## 12. EDGE CASES — DB SPECIFIC

| Scenario | Behaviour |
|---|---|
| `createProject` called with duplicate name | Throws "A project with this name already exists." before writing |
| `createProject`/`createTask` called with whitespace-only name/title | Trimmed first — empty after trim throws validation error |
| `onSnapshot` listener fails mid-session (e.g. permission revoked) | Error callback fires with `(data, errorMessage)` — caller (app.js) shows error via ui.js, does not crash |
| `deleteProject` called on project with 0 tasks | Batch still works — empty forEach, batch deletes project doc only |
| `updateTask` called with no fields except `status` | Only `status` and `updatedAt` written — `userId`, `title`, etc. untouched |
| Collection group query has no composite index | Firestore throws `failed-precondition` with a console link — error callback returns generic "Unable to load data" message to UI |
| `listenToDashboardTasks` task has missing `userId` (legacy bug) | Task is excluded from results — query `where('userId', '==', userId)` filters it out silently |
| Title exceeds `MAX_TITLE_LENGTH` | Silently truncated to 200 chars — no error thrown |

---

## 13. SESSION 4 REVIEW CHECKLIST

Run this before committing. Every item must pass.
Then run `.agents/skills/review/SKILL.md` as required by AGENTS.md §16.

### Firestore paths
- [ ] All paths match Section 1 exactly — `users/{uid}/projects/{id}/tasks/{id}`
- [ ] Profile uses fixed document ID `users/{uid}/profile/data`
- [ ] Activity log uses `users/{uid}/activity/{id}` (auto-ID)

### userId — CRITICAL
- [ ] `createTask` stamps `userId` field on every document
- [ ] `updateTask` never strips or overwrites `userId`
- [ ] `listenToDashboardTasks` filters `where('userId', '==', userId)`

### Validation
- [ ] `createProject`/`updateProject` reject empty/whitespace names
- [ ] `createProject` rejects duplicate names
- [ ] `createTask`/`updateTask` reject empty/whitespace titles
- [ ] `createTask`/`updateTask` validate priority against `VALID_PRIORITIES`
- [ ] `createTask`/`updateTask` validate status against `VALID_STATUSES`
- [ ] Title truncated to `MAX_TITLE_LENGTH`
- [ ] All string inputs trimmed before writing

### Listeners
- [ ] `listenToProjects`, `listenToTasks`, `listenToDashboardTasks` each
      return the Firestore unsubscribe function
- [ ] Each listener has an error callback — never throws on snapshot error
- [ ] One listener per collection — no per-document listeners anywhere

### Batch operations
- [ ] `deleteProject` uses a single batch — no loop of individual deletes

### Firebase architecture
- [ ] No modular Firebase imports anywhere
- [ ] All Firestore access via `db_firestore` (compat global from config.js)
- [ ] `listenToDashboardTasks` uses `collectionGroup('tasks')`

### Code standards
- [ ] Every exported and private function has JSDoc
- [ ] try/catch around every async Firestore operation
- [ ] `mapDbError` covers all cases in AGENTS.md §8 relevant to db.js
- [ ] No `console.log` statements
- [ ] No DOM access, no `ui.*` calls, no `state.*` assignments anywhere
- [ ] `window.db` exports exactly the 12 functions listed in Section 10

### Manual test (browser console — after sign-in)
- [ ] `db.createProject(uid, 'Test Project')` → returns an ID, appears in Firestore
- [ ] `db.createProject(uid, 'Test Project')` again → throws duplicate error
- [ ] `db.createTask(uid, projectId, { title: 'Test Task' })` → task appears
      with `userId` field set correctly in Firestore console
- [ ] `db.listenToDashboardTasks(uid, console.log)` → logs array including
      the test task — confirms composite index is working
- [ ] `db.updateTask(uid, projectId, taskId, { status: 'done' })` →
      `userId` field still present after update
- [ ] `db.deleteProject(uid, projectId)` → project and its tasks both
      removed from Firestore

---

## 14. COMMIT

After all checklist items pass:

```
git add js/db.js
git commit -m "feat: implement Firestore CRUD, real-time listeners, and collection group dashboard query"
git push origin dev
```