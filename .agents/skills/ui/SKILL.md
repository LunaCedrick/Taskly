---
name: ui
description: All shared render functions for the UI — skeletons, empty states, modals, banners, and more
---
## Session: 5 of 17
## Scope: ui.js — all shared render functions · skeletons · empty states · modals · banners
## References: AGENTS.md §2, §5, §8, §9, §10, §12

---

AGENTS.md is the source of truth.
This file adds only what is specific to Session 5.
Do not repeat design tokens, naming conventions, module
boundaries, or error messages from AGENTS.md.

---

## WHAT THIS SESSION BUILDS

Two files:
- `js/ui.js` — fully implemented (Session 1 stub replaced)
- `style.css` — APPENDED ONLY — new component styles for every
  class referenced by ui.js (Section 0 below has the full block)

No existing rules, tokens, or selectors in style.css are changed.
Only new component styles are added, in a new labeled section
at the end of the file.

---

## WHAT THIS SESSION DOES NOT BUILD

- No Firebase calls of any kind — ui.js only renders data given to it
- No application state — ui.js never reads or writes `state`
- No event listeners — those belong to app.js (Session 13)
- No data fetching — db.js handles that
- No business logic — sorting, filtering, and grouping happen
  in app.js or db.js; ui.js receives already-prepared data

Every function in this skill takes data as parameters and
produces DOM. Nothing more. If it's not building DOM from
given data, or it's not a new CSS rule listed in Section 0 —
it does not belong in this session.

Some render target containers are owned by later feature sessions.
Session 5 may implement renderers that target IDs such as `#task-list`,
`#dashboard-stats`, `#dashboard-overdue`, `#dashboard-today`,
`#dashboard-upcoming`, and `#activity-feed`, but it must not add those
view-specific containers to `index.html`. Missing containers must be
handled as safe no-ops. Session 6 creates dashboard internals; Sessions
7-8 create the project/task internals, including `#task-list` inside
`#view-project`.

---

## 0. CSS ADDITIONS — APPEND TO style.css

Every class ui.js generates needs a style. All values below use
ONLY existing `--color-*`, `--shadow-*`, and spacing tokens already
in style.css `:root` (AGENTS.md §2) — no new tokens, no hardcoded
hex anywhere in this block.

Append this entire block to the end of style.css under a new
comment header. Do not change any existing rule in style.css.

```css
/* ── UI COMPONENTS — SESSION 5 ──────────────────────────── */

/* Sidebar project list */
.sidebar-empty {
  padding: 8px 16px;
  color: var(--color-sidebar-text);
  font-size: 12px;
}

.project-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 16px;
}

.project-item__name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Task card internals */
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.task-card--done {
  opacity: 0.6;
}

.task-card--done .task-card__title {
  text-decoration: line-through;
  color: var(--color-done-text);
}

.task-card__checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--color-accent);
}

.task-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.task-card__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.task-card__description {
  font-size: 12px;
  color: var(--color-text-muted);
}

.task-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.task-card__category {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 2px 8px;
}

.task-card__due-date {
  font-size: 12px;
  color: var(--color-text-light);
}

.task-card__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.task-card__edit,
.task-card__delete {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--color-text-muted);
  padding: 4px;
  transition: color var(--transition-fast);
}

.task-card__edit:hover,
.task-card__delete:hover {
  color: var(--color-text-primary);
}

/* Priority dot + label */
.priority {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.priority__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.priority--high .priority__dot   { background: var(--color-priority-high); }
.priority--medium .priority__dot { background: var(--color-priority-med); }
.priority--low .priority__dot    { background: var(--color-priority-low); }
.priority--none .priority__dot   { background: var(--color-priority-none); }

/* Stat cards */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-card--completed .stat-card__value { color: var(--color-status-done); }
.stat-card--progress .stat-card__value  { color: var(--color-status-progress); }
.stat-card--overdue .stat-card__value   { color: var(--color-overdue-text); }

.stat-card__label {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Skeleton loading cards */
.task-card--skeleton {
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: var(--color-border);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.skeleton-line--title { width: 60%; height: 16px; }
.skeleton-line--meta  { width: 40%; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

/* Empty states */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
}

.empty-state__message {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-overdue-bg);
  border: 1px solid var(--color-overdue-border);
  border-radius: 12px;
}

.error-banner__message {
  font-size: 13px;
  color: var(--color-overdue-text);
}

.error-banner__dismiss {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-overdue-text);
  flex-shrink: 0;
}

/* Notification panel items */
.notification-empty {
  padding: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

.notification-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
}

.notification-item--unread {
  background: var(--color-bg);
}

.notification-item__message {
  font-size: 12px;
  color: var(--color-text-primary);
}

.notification-item__time {
  font-size: 11px;
  color: var(--color-text-light);
}

/* Activity feed */
.activity-empty {
  padding: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
}

.activity-item__text {
  color: var(--color-text-primary);
}

.activity-item__time {
  color: var(--color-text-light);
  flex-shrink: 0;
}

/* Modal content */
.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  padding: 20px 20px 0;
}

.modal-message {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 12px 20px 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
}

/* Task form */
.task-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 20px 0;
}

.task-form .form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-top: 8px;
}

.task-form input,
.task-form textarea,
.task-form select {
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  color: var(--color-text-primary);
  background: var(--color-bg);
}

.task-form textarea {
  height: 72px;
  padding: 8px 10px;
  resize: vertical;
}

.task-form input:focus,
.task-form textarea:focus,
.task-form select:focus {
  outline: none;
  border-color: var(--color-accent);
}
```

---

## 1. CORE RULE — textContent EVERYWHERE

This is the most important rule in this session. Every piece
of user-supplied or Firestore data — task titles, descriptions,
project names, category names, user names, emails — goes through
`textContent`. Never `innerHTML`.

```javascript
// ✅ CORRECT
titleEl.textContent = task.title;

// ❌ NEVER — even though it looks harmless
titleEl.innerHTML = task.title;
```

Static markup that ui.js builds itself (wrapper divs, icons,
structural elements with no external data inside) can be built
via `createElement` + `appendChild`, or via a template string
ONLY if every interpolated value is static (hardcoded strings,
not data). When in doubt — `createElement` and `textContent`.

---

## 2. SHARED DOM HELPERS (private — not exported)

Used throughout this file to avoid repetition. Keep these small.

```javascript
/**
 * Creates an element with optional class names and text content.
 * Uses textContent — never innerHTML — for the text parameter.
 * @param {string} tag - HTML tag name
 * @param {string} [className] - Space-separated class names
 * @param {string} [text] - Text content (safe — uses textContent)
 * @returns {HTMLElement}
 */
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Clears all child nodes from a container element.
 * @param {HTMLElement} container
 * @returns {void}
 */
function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Formats a Firestore Timestamp (or null) as a short display date.
 * Returns empty string for null — callers decide what to show
 * for "no due date".
 * @param {Object|null} timestamp - Firestore Timestamp or null
 * @returns {string} e.g. "Jun 14" or ""
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Returns true if a Firestore Timestamp falls before today
 * (i.e. the task is overdue).
 * @param {Object|null} timestamp - Firestore Timestamp or null
 * @returns {boolean}
 */
function isOverdue(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Returns true if a Firestore Timestamp falls on today's date.
 * @param {Object|null} timestamp - Firestore Timestamp or null
 * @returns {boolean}
 */
function isToday(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
```

---

## 3. SIDEBAR — renderSidebar / renderSidebarUser / renderProjectList

These functions are closely related. `renderSidebar` is the entry
point called by app.js. `renderProjectList` renders just the
project list portion — kept separate so app.js can refresh
only the project list when projects change without re-rendering
the whole sidebar (nav links, user profile). `renderSidebarUser`
updates the sidebar identity fields so app.js does not perform
user-visible DOM writes for profile data.

### renderSidebar

```javascript
/**
 * Renders the full sidebar — nav links stay static in HTML,
 * this function refreshes the dynamic project list portion.
 * @param {Array} projects - Array of project objects
 *                            ({ id, name, taskCount, completedCount })
 * @param {string|null} activeProjectId - Currently active project ID
 * @returns {void}
 */
function renderSidebar(projects, activeProjectId) {
  renderProjectList(projects, activeProjectId);
}
```

### renderSidebarUser

Updates the existing sidebar profile fields. Use safe fallbacks and
`textContent` for names. Do not read Firebase Auth directly.

```javascript
/**
 * Renders signed-in user details in the sidebar identity surface.
 * @param {Object|null} user - Auth user object
 * @returns {void}
 */
function renderSidebarUser(user) {
  const photo = document.getElementById('user-photo');
  const name = document.getElementById('user-name');
  const displayName = user && user.displayName ? user.displayName : 'Taskly user';

  if (name) {
    name.textContent = displayName;
  }

  if (photo) {
    photo.alt = `${displayName} profile photo`;
    if (user && user.photoURL) {
      photo.src = user.photoURL;
    } else {
      photo.removeAttribute('src');
    }
  }
}
```

### renderProjectList

Each project row shows name + progress bar.
Progress = completedCount / taskCount (AGENTS.md design system —
progress bar uses `--color-accent` fill on
`--color-progress-track`).

```javascript
/**
 * Renders the sidebar project list with per-project progress bars.
 * @param {Array} projects - Array of { id, name, taskCount,
 *                            completedCount }
 * @param {string|null} activeProjectId - Currently active project ID
 * @returns {void}
 */
function renderProjectList(projects, activeProjectId) {
  const container = document.getElementById('sidebar-project-list');
  if (!container) return;
  clearContainer(container);

  if (projects.length === 0) {
    const empty = createEl('p', 'sidebar-empty', 'No projects yet');
    container.appendChild(empty);
    return;
  }

  projects.forEach((project) => {
    const item = createEl('a', 'nav-item project-item');
    item.href = '#';
    item.dataset.projectId = project.id;
    item.setAttribute('aria-label', `Open project ${project.name}`);
    if (project.id === activeProjectId) {
      item.classList.add('nav-item--active');
    }

    const nameEl = createEl('span', 'project-item__name', project.name);
    item.appendChild(nameEl);

    const total = project.taskCount || 0;
    const completed = project.completedCount || 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const track = createEl('div', 'progress-bar');
    const fill = createEl('div', 'progress-bar__fill');
    fill.style.width = `${percent}%`;
    track.appendChild(fill);
    item.appendChild(track);

    container.appendChild(item);
  });
}
```

---

## 4. TASK LIST — renderTaskList / renderTaskCard

### renderTaskCard

Single task card. Applies overdue/today highlighting per
AGENTS.md §2 (`.task-card--overdue`, `.task-card--today`).
Priority shown as a colored dot WITH a text label — color is
never the only signal (AGENTS.md §12 accessibility rule).

```javascript
/**
 * Renders a single task card element.
 * Applies overdue/today background styling. Priority is shown
 * as both a colored dot and a text label — never color alone.
 * @param {Object} task - Task object ({ id, title, description,
 *                         dueDate, priority, category, status })
 * @returns {HTMLElement} The task card element
 */
function renderTaskCard(task) {
  const card = createEl('article', 'task-card');
  card.dataset.taskId = task.id;

  if (task.status !== 'done' && isOverdue(task.dueDate)) {
    card.classList.add('task-card--overdue');
  } else if (isToday(task.dueDate)) {
    card.classList.add('task-card--today');
  }
  if (task.status === 'done') {
    card.classList.add('task-card--done');
  }

  // Checkbox — completion toggle
  const checkbox = createEl('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-card__checkbox';
  checkbox.checked = task.status === 'done';
  checkbox.setAttribute('aria-label', `Mark ${task.title} complete`);
  card.appendChild(checkbox);

  // Body — title, meta row
  const body = createEl('div', 'task-card__body');

  const title = createEl('h3', 'task-card__title', task.title);
  body.appendChild(title);

  if (task.description) {
    const desc = createEl('p', 'task-card__description', task.description);
    body.appendChild(desc);
  }

  const meta = createEl('div', 'task-card__meta');

  // Priority — dot + text label (never color alone)
  const priorityWrap = createEl('span', `priority priority--${task.priority}`);
  const priorityDot = createEl('span', 'priority__dot');
  const priorityLabel = createEl('span', 'priority__label',
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1));
  priorityWrap.appendChild(priorityDot);
  priorityWrap.appendChild(priorityLabel);
  meta.appendChild(priorityWrap);

  if (task.category) {
    const categoryTag = createEl('span', 'task-card__category', task.category);
    meta.appendChild(categoryTag);
  }

  if (task.dueDate) {
    const dueDateEl = createEl('span', 'task-card__due-date', formatDate(task.dueDate));
    meta.appendChild(dueDateEl);
  }

  body.appendChild(meta);
  card.appendChild(body);

  // Actions — edit / delete icon buttons
  const actions = createEl('div', 'task-card__actions');

  const editBtn = createEl('button', 'task-card__edit');
  editBtn.type = 'button';
  editBtn.setAttribute('aria-label', `Edit ${task.title}`);
  editBtn.textContent = '✎';
  actions.appendChild(editBtn);

  const deleteBtn = createEl('button', 'task-card__delete');
  deleteBtn.type = 'button';
  deleteBtn.setAttribute('aria-label', `Delete ${task.title}`);
  deleteBtn.textContent = '🗑';
  actions.appendChild(deleteBtn);

  card.appendChild(actions);

  return card;
}
```

### renderTaskList

Receives already-filtered/searched tasks — app.js (Session 13)
and search-filter (Session 9) own the filtering logic. This
function only renders. If the array is empty, it shows the
appropriate empty state based on whether filters/search are
active.

```javascript
/**
 * Renders a list of task cards into the task list container.
 * Receives pre-filtered tasks — does not filter itself.
 * Shows an empty state if tasks is empty, choosing the message
 * based on whether a search query or filters are active.
 * @param {Array} tasks - Pre-filtered array of task objects
 * @param {Object} filters - Active filter values (status,
 *                            priority, category) — used only to
 *                            decide which empty state to show
 * @param {string} searchQuery - Current search query — used only
 *                                to decide which empty state to show
 * @returns {void}
 */
function renderTaskList(tasks, filters, searchQuery) {
  const container = document.getElementById('task-list');
  if (!container) return;
  clearContainer(container);

  if (tasks.length === 0) {
    const hasActiveFilters =
      searchQuery.trim() !== '' ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.category !== 'all';

    renderEmptyState(hasActiveFilters ? 'no-search-results' : 'no-tasks');
    return;
  }

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    fragment.appendChild(renderTaskCard(task));
  });
  container.appendChild(fragment);
}
```

---

## 5. DASHBOARD — renderDashboard / renderStats

`renderDashboard` is the entry point Session 6 calls. It
delegates to section renderers. This session builds the
delegation structure and `renderStats` fully — the overdue/
today/upcoming/activity section bodies are simple reuses of
`renderTaskCard` and `renderActivityFeed`, wired together here
so Session 6 only needs to call `renderDashboard(data)`.

### renderDashboard

```javascript
/**
 * Renders the full dashboard view from aggregated data.
 * Delegates to renderStats and renders each task section
 * (overdue, today, upcoming) using renderTaskCard, plus the
 * activity feed via renderActivityFeed.
 * @param {Object} data - { stats, overdue, today, upcoming, activity }
 *                         stats: { total, completed, inProgress, overdue }
 *                         overdue/today/upcoming: arrays of task objects
 *                         activity: array of activity objects
 * @returns {void}
 */
function renderDashboard(data) {
  renderStats(data.stats);
  renderTaskSection('dashboard-overdue', data.overdue, 'no-overdue');
  renderTaskSection('dashboard-today', data.today, 'no-tasks-today');
  renderTaskSection('dashboard-upcoming', data.upcoming, 'no-tasks');
  renderActivityFeed(data.activity);
}
```

### renderTaskSection (private — not exported)

Shared by the three dashboard task sections. Each section
container ID is passed in — IDs defined in Session 6's HTML.

```javascript
/**
 * Renders a list of task cards into a named dashboard section,
 * or an empty state if the list is empty.
 * @param {string} containerId - ID of the section's container element
 * @param {Array} tasks - Array of task objects for this section
 * @param {string} emptyType - Empty state type to show if tasks is empty
 * @returns {void}
 */
function renderTaskSection(containerId, tasks, emptyType) {
  const container = document.getElementById(containerId);
  if (!container) return;
  clearContainer(container);

  if (tasks.length === 0) {
    container.appendChild(renderEmptyStateElement(emptyType));
    return;
  }

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    fragment.appendChild(renderTaskCard(task));
  });
  container.appendChild(fragment);
}
```

### renderStats

Four stat cards per AGENTS.md design system (`.stat-card`).
Numbers use the stats typography rule (700 weight, 28-32px) —
applied via CSS class, not inline style.

```javascript
/**
 * Renders the four dashboard stat cards: total, completed,
 * in progress, overdue.
 * @param {Object} stats - { total, completed, inProgress, overdue }
 * @returns {void}
 */
function renderStats(stats) {
  const container = document.getElementById('dashboard-stats');
  if (!container) return;
  clearContainer(container);

  const cards = [
    { label: 'Total', value: stats.total, modifier: 'total' },
    { label: 'Completed', value: stats.completed, modifier: 'completed' },
    { label: 'In Progress', value: stats.inProgress, modifier: 'progress' },
    { label: 'Overdue', value: stats.overdue, modifier: 'overdue' },
  ];

  const fragment = document.createDocumentFragment();
  cards.forEach((card) => {
    const cardEl = createEl('div', `stat-card stat-card--${card.modifier}`);
    const valueEl = createEl('span', 'stat-card__value', String(card.value));
    const labelEl = createEl('span', 'stat-card__label', card.label);
    cardEl.appendChild(valueEl);
    cardEl.appendChild(labelEl);
    fragment.appendChild(cardEl);
  });
  container.appendChild(fragment);
}
```

---

## 6. SKELETON CARDS — renderSkeletonCards

Shown while Firestore data loads (AGENTS.md §10 — loading states).
Skeletons reuse `.task-card` sizing so layout doesn't shift when
real content arrives.

```javascript
/**
 * Renders placeholder skeleton cards into the task list container
 * while data is loading. Uses the same dimensions as .task-card
 * to prevent layout shift when real content arrives.
 * @param {number} count - Number of skeleton cards to render
 * @returns {void}
 */
function renderSkeletonCards(count) {
  const container = document.getElementById('task-list');
  if (!container) return;
  clearContainer(container);

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = createEl('div', 'task-card task-card--skeleton');
    const line1 = createEl('div', 'skeleton-line skeleton-line--title');
    const line2 = createEl('div', 'skeleton-line skeleton-line--meta');
    card.appendChild(line1);
    card.appendChild(line2);
    fragment.appendChild(card);
  }
  container.appendChild(fragment);
}
```

---

## 7. EMPTY STATES — renderEmptyState

Five empty state types from AGENTS.md / PLAN.md §10:

```
no-projects       → "Create your first project to get started" + button
no-tasks          → "No tasks yet. Create your first task" + button
no-overdue        → "Great job! You have no overdue tasks"
no-tasks-today    → "Nothing due today. Enjoy your day"
no-search-results → "No tasks match your search"
```

Two functions: `renderEmptyState(type)` renders into the main
task list container (used by `renderTaskList`).
`renderEmptyStateElement(type)` (private) returns an element —
used by `renderTaskSection` for dashboard sub-sections, which
have their own containers.

### renderEmptyStateElement (private — not exported)

```javascript
/**
 * Builds an empty state element for the given type.
 * Does not append it anywhere — caller decides placement.
 * Empty states with a call-to-action include a button with the
 * appropriate aria-label; checkmark-style empty states do not.
 * @param {string} type - One of: 'no-projects', 'no-tasks',
 *                         'no-overdue', 'no-tasks-today',
 *                         'no-search-results'
 * @returns {HTMLElement}
 */
function renderEmptyStateElement(type) {
  const messages = {
    'no-projects': {
      text: 'Create your first project to get started',
      action: 'Create Project',
    },
    'no-tasks': {
      text: 'No tasks yet. Create your first task',
      action: 'Add Task',
    },
    'no-overdue': {
      text: 'Great job! You have no overdue tasks',
      action: null,
    },
    'no-tasks-today': {
      text: 'Nothing due today. Enjoy your day',
      action: null,
    },
    'no-search-results': {
      text: 'No tasks match your search',
      action: null,
    },
  };

  const config = messages[type] || { text: '', action: null };

  const wrapper = createEl('div', 'empty-state');
  wrapper.setAttribute('aria-live', 'polite');

  const message = createEl('p', 'empty-state__message', config.text);
  wrapper.appendChild(message);

  if (config.action) {
    const button = createEl('button', 'btn-primary empty-state__action', config.action);
    button.type = 'button';
    button.dataset.emptyAction = type;
    wrapper.appendChild(button);
  }

  return wrapper;
}
```

### renderEmptyState

```javascript
/**
 * Renders an empty state into the main task list container.
 * For dashboard sub-sections, use renderTaskSection instead —
 * it calls renderEmptyStateElement internally.
 * @param {string} type - One of the empty state type identifiers
 * @returns {void}
 */
function renderEmptyState(type) {
  const container = document.getElementById('task-list');
  if (!container) return;
  clearContainer(container);
  container.appendChild(renderEmptyStateElement(type));
}
```

---

## 8. ERROR BANNER — renderErrorBanner

Per AGENTS.md §8: errors render in context, replace loading/empty
states (never stack), are dismissible, and have `role="alert"`.

```javascript
/**
 * Renders a dismissible error banner into the main task list
 * container, replacing any loading or empty state currently shown.
 * @param {string} message - Human-readable error message
 *                            (already mapped — never raw Firebase
 *                            error codes)
 * @returns {void}
 */
function renderErrorBanner(message) {
  const container = document.getElementById('task-list');
  if (!container) return;
  clearContainer(container);

  const banner = createEl('div', 'error-banner');
  banner.setAttribute('role', 'alert');

  const text = createEl('p', 'error-banner__message', message);
  banner.appendChild(text);

  const dismissBtn = createEl('button', 'error-banner__dismiss', 'Dismiss');
  dismissBtn.type = 'button';
  dismissBtn.setAttribute('aria-label', 'Dismiss error message');
  banner.appendChild(dismissBtn);

  container.appendChild(banner);
}
```

---

## 9. NOTIFICATION PANEL — renderNotificationPanel

Per AGENTS.md §12: `aria-live="polite"` on the panel (already
on `#notification-panel` from Session 1's index.html).

```javascript
/**
 * Renders the list of notifications inside the notification panel.
 * Each entry shows its message and a relative timestamp. Entries
 * are marked read/unread via a class modifier.
 * @param {Array} notifications - Array of { id, message, timestamp,
 *                                  read } objects
 * @returns {void}
 */
function renderNotificationPanel(notifications) {
  const container = document.getElementById('notification-panel');
  if (!container) return;
  clearContainer(container);

  if (notifications.length === 0) {
    const empty = createEl('p', 'notification-empty', 'No notifications');
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  notifications.forEach((notif) => {
    const item = createEl('div', 'notification-item');
    if (!notif.read) {
      item.classList.add('notification-item--unread');
    }
    item.dataset.notificationId = notif.id;

    const message = createEl('p', 'notification-item__message', notif.message);
    item.appendChild(message);

    const time = createEl('span', 'notification-item__time', formatDate(notif.timestamp));
    item.appendChild(time);

    fragment.appendChild(item);
  });
  container.appendChild(fragment);
}
```

---

## 10. ACTIVITY FEED — renderActivityFeed

Per PLAN.md — shows event type, name, relative timestamp,
reverse chronological order (caller provides the order;
this function renders as given).

```javascript
/**
 * Renders the recent activity feed.
 * @param {Array} activities - Array of { id, type, projectName,
 *                              taskTitle, timestamp } objects,
 *                              already in display order
 * @returns {void}
 */
function renderActivityFeed(activities) {
  const container = document.getElementById('activity-feed');
  if (!container) return;
  clearContainer(container);

  if (activities.length === 0) {
    const empty = createEl('p', 'activity-empty', 'No recent activity');
    container.appendChild(empty);
    return;
  }

  const labels = {
    task_created: 'created task',
    task_completed: 'completed task',
    task_updated: 'updated task',
    project_created: 'created project',
  };

  const fragment = document.createDocumentFragment();
  activities.forEach((activity) => {
    const item = createEl('li', 'activity-item');

    const action = labels[activity.type] || 'updated';
    const subject = activity.taskTitle || activity.projectName || '';
    const textEl = createEl('span', 'activity-item__text', `${action} "${subject}"`);
    item.appendChild(textEl);

    const timeEl = createEl('span', 'activity-item__time', formatDate(activity.timestamp));
    item.appendChild(timeEl);

    fragment.appendChild(item);
  });
  container.appendChild(fragment);
}
```

---

## 11. MODALS — showAddTaskModal / showEditTaskModal / showConfirmModal

All modals render into `#modal-overlay` / `#modal-panel` from
Session 1's index.html (`role="dialog"`, `aria-modal="true"`,
`aria-labelledby="modal-title"` already present on the overlay).

Focus trap and Escape-to-close are **Session 16 (accessibility)**
concerns — this session builds the modal markup and the show/hide
mechanism only. `hideModal` is shared by all three.

### hideModal (exported — needed by all modal show functions and app.js)

```javascript
/**
 * Hides the modal overlay and clears its content.
 * @returns {void}
 */
function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  const panel = document.getElementById('modal-panel');
  if (!overlay || !panel) return;
  overlay.hidden = true;
  clearContainer(panel);
}
```

### showAddTaskModal

Form fields per AGENTS.md §7 task schema: title (required),
description, dueDate, priority, category, status. Category
options come from `CATEGORIES` (config.js) plus a "custom"
text input — full wiring of custom category is Session 8;
this session builds the field present in the form.

```javascript
/**
 * Shows the Add Task modal with an empty form.
 * Form submission and validation are wired in Session 8 —
 * this function builds the modal structure only.
 * @returns {void}
 */
function showAddTaskModal() {
  const overlay = document.getElementById('modal-overlay');
  const panel = document.getElementById('modal-panel');
  if (!overlay || !panel) return;
  clearContainer(panel);

  const title = createEl('h2', 'modal-title', 'Add Task');
  title.id = 'modal-title';
  panel.appendChild(title);

  panel.appendChild(buildTaskForm({}));

  overlay.hidden = false;
}
```

### showEditTaskModal

```javascript
/**
 * Shows the Edit Task modal pre-filled with the given task's data.
 * Form submission and validation are wired in Session 8 —
 * this function builds the modal structure only.
 * @param {Object} task - Task data to pre-fill the form
 * @returns {void}
 */
function showEditTaskModal(task) {
  const overlay = document.getElementById('modal-overlay');
  const panel = document.getElementById('modal-panel');
  if (!overlay || !panel) return;
  clearContainer(panel);

  const title = createEl('h2', 'modal-title', 'Edit Task');
  title.id = 'modal-title';
  panel.appendChild(title);

  panel.appendChild(buildTaskForm(task));

  overlay.hidden = false;
}
```

### buildTaskForm (private — not exported)

Shared by add and edit modals. Pre-fills values from `task`
when editing (empty object when adding).

```javascript
/**
 * Builds the task form used by both Add and Edit modals.
 * Pre-fills field values from the given task object — pass an
 * empty object for a blank Add Task form.
 * @param {Object} task - Task data to pre-fill (empty for new task)
 * @returns {HTMLFormElement}
 */
function buildTaskForm(task) {
  const form = createEl('form', 'task-form');

  // Title — required
  const titleLabel = createEl('label', 'form-label', 'Title');
  titleLabel.setAttribute('for', 'task-form-title');
  const titleInput = createEl('input');
  titleInput.type = 'text';
  titleInput.id = 'task-form-title';
  titleInput.name = 'title';
  titleInput.required = true;
  titleInput.maxLength = MAX_TITLE_LENGTH;
  titleInput.value = task.title || '';
  form.appendChild(titleLabel);
  form.appendChild(titleInput);

  // Description — optional
  const descLabel = createEl('label', 'form-label', 'Description');
  descLabel.setAttribute('for', 'task-form-description');
  const descInput = createEl('textarea');
  descInput.id = 'task-form-description';
  descInput.name = 'description';
  descInput.value = task.description || '';
  form.appendChild(descLabel);
  form.appendChild(descInput);

  // Due date — optional
  const dueDateLabel = createEl('label', 'form-label', 'Due Date');
  dueDateLabel.setAttribute('for', 'task-form-due-date');
  const dueDateInput = createEl('input');
  dueDateInput.type = 'date';
  dueDateInput.id = 'task-form-due-date';
  dueDateInput.name = 'dueDate';
  form.appendChild(dueDateLabel);
  form.appendChild(dueDateInput);

  // Priority — select
  const priorityLabel = createEl('label', 'form-label', 'Priority');
  priorityLabel.setAttribute('for', 'task-form-priority');
  const prioritySelect = createEl('select');
  prioritySelect.id = 'task-form-priority';
  prioritySelect.name = 'priority';
  ['none', 'low', 'medium', 'high'].forEach((value) => {
    const option = createEl('option', null,
      value.charAt(0).toUpperCase() + value.slice(1));
    option.value = value;
    if (task.priority === value) option.selected = true;
    prioritySelect.appendChild(option);
  });
  form.appendChild(priorityLabel);
  form.appendChild(prioritySelect);

  // Category — select from CATEGORIES + custom option
  const categoryLabel = createEl('label', 'form-label', 'Category');
  categoryLabel.setAttribute('for', 'task-form-category');
  const categorySelect = createEl('select');
  categorySelect.id = 'task-form-category';
  categorySelect.name = 'category';
  CATEGORIES.forEach((value) => {
    const option = createEl('option', null, value);
    option.value = value;
    if (task.category === value) option.selected = true;
    categorySelect.appendChild(option);
  });
  const customOption = createEl('option', null, 'Custom…');
  customOption.value = 'custom';
  categorySelect.appendChild(customOption);
  form.appendChild(categoryLabel);
  form.appendChild(categorySelect);

  // Actions
  const actions = createEl('div', 'modal-actions');
  const cancelBtn = createEl('button', 'btn-ghost', 'Cancel');
  cancelBtn.type = 'button';
  cancelBtn.dataset.modalAction = 'cancel';
  const saveBtn = createEl('button', 'btn-primary', 'Save');
  saveBtn.type = 'submit';
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(actions);

  return form;
}
```

### Modal Validation Helpers

app.js owns form submission and validation decisions. ui.js owns the
visible inline validation targets.

```javascript
/**
 * Shows a task modal validation message.
 * @param {string} message - Human-readable validation message
 * @returns {void}
 */
function renderTaskModalValidation(message) {
  renderModalValidation('task-form-error', message);
}

/**
 * Clears the task modal validation message.
 * @returns {void}
 */
function clearTaskModalValidation() {
  clearModalValidation('task-form-error');
}

/**
 * Shows a project modal validation message.
 * @param {string} message - Human-readable validation message
 * @returns {void}
 */
function renderProjectModalValidation(message) {
  renderModalValidation('project-form-error', message);
}

/**
 * Clears the project modal validation message.
 * @returns {void}
 */
function clearProjectModalValidation() {
  clearModalValidation('project-form-error');
}
```

The private `renderModalValidation(id, message)` and
`clearModalValidation(id)` helpers may create or clear an element inside
the current modal panel. Validation elements must use `role="alert"`.

### showConfirmModal

Per AGENTS.md — used for delete task, delete project, sign-out,
clear all notifications. The callback is stored and invoked by
app.js when the confirm button is clicked — ui.js does not call
db.js directly.

```javascript
/**
 * Shows a confirmation modal with the given message.
 * The onConfirm callback is attached to the confirm button's
 * dataset via a stored reference — app.js wires the actual
 * click listener and invokes this callback (Session 13).
 * @param {string} message - Confirmation message to display
 * @param {Function} onConfirm - Callback to invoke on confirm
 * @returns {void}
 */
function showConfirmModal(message, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  const panel = document.getElementById('modal-panel');
  if (!overlay || !panel) return;
  clearContainer(panel);

  const title = createEl('h2', 'modal-title', 'Confirm');
  title.id = 'modal-title';
  panel.appendChild(title);

  const messageEl = createEl('p', 'modal-message', message);
  panel.appendChild(messageEl);

  const actions = createEl('div', 'modal-actions');
  const cancelBtn = createEl('button', 'btn-ghost', 'Cancel');
  cancelBtn.type = 'button';
  cancelBtn.dataset.modalAction = 'cancel';

  const confirmBtn = createEl('button', 'btn-danger', 'Confirm');
  confirmBtn.type = 'button';
  confirmBtn.dataset.modalAction = 'confirm';
  // Store callback for app.js to retrieve and invoke (Session 13)
  confirmBtn.onConfirmCallback = onConfirm;

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  panel.appendChild(actions);

  overlay.hidden = false;
}
```

---

## 12. OFFLINE BANNER — showOfflineBanner / hideOfflineBanner

Targets `#offline-banner` from Session 1's index.html
(already has `role="status"` and `aria-live="polite"`).

```javascript
/**
 * Shows the offline mode banner.
 * @returns {void}
 */
function showOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.hidden = false;
}

/**
 * Hides the offline mode banner.
 * @returns {void}
 */
function hideOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.hidden = true;
}
```

---

## 13. NOTIFICATION BADGE — updateNotificationBadge

Targets `#notif-count` from Session 1's index.html.
Per AGENTS.md §12: `aria-live="polite"` for count changes —
already on the element from Session 1.

`#notif-count` is the only canonical notification badge ID. Do not add,
preserve, or fallback to `#notification-count`; that ID is stale.

```javascript
/**
 * Updates the notification bell's unread count badge.
 * Hides the badge entirely when count is 0.
 * @param {number} count - Unread notification count
 * @returns {void}
 */
function updateNotificationBadge(count) {
  const badge = document.getElementById('notif-count');
  if (!badge) return;

  if (count <= 0) {
    badge.hidden = true;
    badge.textContent = '0';
    return;
  }

  badge.hidden = false;
  badge.textContent = String(count);
}
```

---

## 14. WHAT ui.js EXPORTS

```javascript
// At the bottom of ui.js
window.ui = {
  renderSidebar,
  renderSidebarUser,
  renderProjectList,
  renderTaskList,
  renderTaskCard,
  renderDashboard,
  renderStats,
  renderSkeletonCards,
  renderEmptyState,
  renderErrorBanner,
  renderNotificationPanel,
  renderActivityFeed,
  renderSettingsView,
  renderTaskModalValidation,
  clearTaskModalValidation,
  renderProjectModalValidation,
  clearProjectModalValidation,
  showAddTaskModal,
  showEditTaskModal,
  showConfirmModal,
  hideModal,
  showOfflineBanner,
  hideOfflineBanner,
  updateNotificationBadge,
};
```

Private helpers — NOT exported: `createEl`, `clearContainer`,
`formatDate`, `isOverdue`, `isToday`, `renderTaskSection`,
`renderEmptyStateElement`, `buildTaskForm`, `renderModalValidation`,
`clearModalValidation`.

---

## 15. BOUNDARY RULES — WHAT ui.js NEVER DOES

```javascript
// ❌ NEVER — Firebase calls
firebase.firestore()
db.createTask(...)
db.listenToProjects(...)

// ❌ NEVER — Application state
state.tasks = ...
state.currentProjectId = ...

// ❌ NEVER — innerHTML for external data
el.innerHTML = task.title           // ❌
el.innerHTML = `<p>${task.title}</p>` // ❌ — even interpolated

// ❌ NEVER — business logic
tasks.filter(t => t.status === 'done')  // ❌ — app.js's job
tasks.sort((a, b) => ...)               // ❌ — app.js/db.js's job

// ❌ NEVER — event listeners for user actions
document.getElementById('btn-add-task').addEventListener(...)
```

ui.js receives data already filtered, sorted, and grouped.
It builds DOM from that data and returns/inserts it. That's all.

---

## 16. EDGE CASES — UI SPECIFIC

| Scenario | Behaviour |
|---|---|
| `renderTaskList([], ...)` with active search query | Shows `'no-search-results'` empty state, not `'no-tasks'` |
| `renderTaskCard` called with `task.dueDate === null` | No due-date element rendered — `.task-card__due-date` omitted entirely |
| `renderTaskCard` called with `task.category === ''` | No category tag rendered |
| `renderStats` called with all zeros | Renders normally — "0" is a valid stat, not treated as empty |
| `showEditTaskModal({})` called with incomplete task object | Form fields default to empty/none — no crash on missing fields |
| `renderActivityFeed` receives unknown `activity.type` | Falls back to label `'updated'` rather than showing `undefined` |
| View-specific container (`#task-list`, `#dashboard-stats`, etc.) not yet in DOM | `getElementById` returns null — function returns early, no crash |
| `updateNotificationBadge(0)` | Badge hidden, not shown with "0" |
| `#notification-count` exists in old code | Treat as stale; do not use as a fallback |

---

## 17. SESSION 5 REVIEW CHECKLIST

Run this before committing. Every item must pass.
Then run `.agents/skills/review/SKILL.md` as required by AGENTS.md §16.

### Core rule
- [ ] textContent used for ALL external data — zero innerHTML
      with interpolated/external values anywhere in ui.js
- [ ] Priority always shown as dot + text label — never dot alone

### Functions implemented
- [ ] All functions in Section 14's export list implemented
- [ ] Sidebar user fields are updated only through `renderSidebarUser(user)`
- [ ] Task/project modal inline validation helpers exist and are exported
- [ ] `updateNotificationBadge()` targets only `#notif-count` with no
      `#notification-count` fallback
- [ ] Private helpers (Section 2, plus renderTaskSection,
      renderEmptyStateElement, buildTaskForm) are NOT in window.ui

### Module boundaries
- [ ] No Firebase calls anywhere in ui.js
- [ ] No `state.*` reads or writes anywhere in ui.js
- [ ] No event listeners attached to user-action elements
      (btn-add-task, nav items, etc.) — only modal-internal
      structure is built, not wired
- [ ] No filtering/sorting logic — all data received pre-processed

### Accessibility (structural — full pass is Session 16)
- [ ] Modals reuse existing `#modal-overlay`/`#modal-panel` with
      `role="dialog"`, `aria-modal="true"` from index.html
- [ ] `modal-title` id is set on every modal's heading, matching
      `aria-labelledby="modal-title"` on the overlay
- [ ] Error banners have `role="alert"`
- [ ] Empty states have `aria-live="polite"`
- [ ] All icon-only buttons (edit, delete, dismiss) have aria-label
- [ ] Checkbox aria-label includes the task title

### Code standards
- [ ] Every exported and private function has JSDoc
- [ ] No `console.log` statements
- [ ] No `var` — const/let only
- [ ] No function exceeds ~25 lines — split if longer
      (buildTaskForm may need internal helper extraction if over)

### CSS additions (Section 0)
- [ ] All CSS from Section 0 appended to end of style.css under
      `/* ── UI COMPONENTS — SESSION 5 ── */` comment header
- [ ] No existing rule in style.css modified or removed
- [ ] Every new class uses `var(--color-*)` — zero hardcoded hex
- [ ] No new CSS custom properties introduced — only existing
      `:root` tokens referenced
- [ ] No `!important` declarations
- [ ] Class names are kebab-case, BEM modifiers use `--`/`__`

### Browser check
- [ ] Open index.html — no console errors from ui.js loading
- [ ] After a temporary `#task-list` container is present in the
      console or in a later feature view: `ui.renderEmptyState('no-tasks')`
      renders a styled empty state with an "Add Task" button
- [ ] In console: `ui.showConfirmModal('Delete this?', () => {})` →
      modal overlay becomes visible with Cancel/Confirm buttons,
      styled per AGENTS.md §2 (white panel, shadow, rounded)
- [ ] In console: `ui.hideModal()` → overlay hides, panel cleared
- [ ] After a temporary `#task-list` container is present in the
      console or in a later feature view: `ui.renderSkeletonCards(3)`
      renders 3 skeleton cards with pulsing animation
- [ ] In console: `ui.updateNotificationBadge(5)` →
      badge shows "5"; `ui.updateNotificationBadge(0)` → badge hides

---

## 18. COMMIT

After all checklist items pass:

```
git add js/ui.js style.css
git commit -m "feat: implement shared render functions, modals, skeletons, and empty states"
git push origin dev
```
