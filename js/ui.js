/**
 * ui.js - DOM rendering only.
 * Scope: Shared render functions, modals, banners, skeletons, and empty states.
 * No Firebase calls. No application state management.
 */

/**
 * Creates an element with optional class names and text content.
 * @param {string} tag - HTML tag name.
 * @param {string} [className] - Space-separated class names.
 * @param {string} [text] - Text content assigned safely.
 * @returns {HTMLElement} Created element.
 */
function createEl(tag, className, text) {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (text !== undefined) {
    el.textContent = text;
  }

  return el;
}

/**
 * Clears all child nodes from a container element.
 * @param {HTMLElement} container - Container to clear.
 * @returns {void}
 */
function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Formats a Firestore Timestamp or date-like value for display.
 * @param {Object|null} timestamp - Timestamp, Date, date string, or null.
 * @returns {string} Short display date or empty string.
 */
function formatDate(timestamp) {
  if (!timestamp) {
    return '';
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a Firestore Timestamp or date-like value for date inputs.
 * @param {Object|null} timestamp - Timestamp, Date, date string, or null.
 * @returns {string} Date input value in yyyy-mm-dd format.
 */
function formatInputDate(timestamp) {
  if (!timestamp) {
    return '';
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/**
 * Returns true when a timestamp falls before today.
 * @param {Object|null} timestamp - Firestore Timestamp or null.
 * @returns {boolean} Whether the timestamp is overdue.
 */
function isOverdue(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
}

/**
 * Returns true when a timestamp falls on today's date.
 * @param {Object|null} timestamp - Firestore Timestamp or null.
 * @returns {boolean} Whether the timestamp is today.
 */
function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

/**
 * Renders the full sidebar dynamic project area.
 * @param {Array} projects - Project objects to render.
 * @param {string|null} activeProjectId - Currently active project ID.
 * @returns {void}
 */
function renderSidebar(projects, activeProjectId) {
  renderProjectList(projects, activeProjectId);
}

/**
 * Renders sidebar projects with progress bars.
 * @param {Array} projects - Project objects to render.
 * @param {string|null} activeProjectId - Currently active project ID.
 * @returns {void}
 */
function renderProjectList(projects, activeProjectId) {
  const container = document.getElementById('sidebar-project-list');

  if (!container) {
    return;
  }

  clearContainer(container);
  appendProjectListContent(container, projects, activeProjectId);
}

/**
 * Appends project rows or the no-projects message.
 * @param {HTMLElement} container - Project list container.
 * @param {Array} projects - Project objects to render.
 * @param {string|null} activeProjectId - Currently active project ID.
 * @returns {void}
 */
function appendProjectListContent(container, projects, activeProjectId) {
  if (!projects || projects.length === 0) {
    container.appendChild(createEl('p', 'sidebar-empty', getEmptyStateConfig('no-projects').text));
    return;
  }

  projects.forEach((project) => {
    container.appendChild(buildProjectItem(project, activeProjectId));
  });
}

/**
 * Builds a single sidebar project item.
 * @param {Object} project - Project data.
 * @param {string|null} activeProjectId - Currently active project ID.
 * @returns {HTMLElement} Project link element.
 */
function buildProjectItem(project, activeProjectId) {
  const item = createEl('a', 'nav-item project-item');
  item.href = '#';
  item.dataset.view = 'project';
  item.dataset.projectId = project.id;
  item.setAttribute('aria-label', `Open project ${project.name}`);

  if (project.id === activeProjectId) {
    item.classList.add('nav-item--active');
  }

  item.appendChild(createEl('span', 'project-item__name', project.name));
  item.appendChild(buildProgressBar(project.taskCount || 0, project.completedCount || 0));

  return item;
}

/**
 * Builds a project progress bar.
 * @param {number} total - Total task count.
 * @param {number} completed - Completed task count.
 * @returns {HTMLElement} Progress bar element.
 */
function buildProgressBar(total, completed) {
  const safeTotal = Number(total) || 0;
  const safeCompleted = Number(completed) || 0;
  const percent = safeTotal > 0
    ? Math.min(100, Math.max(0, Math.round((safeCompleted / safeTotal) * 100)))
    : 0;
  const track = createEl('div', 'progress-bar');
  const fill = createEl('div', 'progress-bar__fill');

  fill.style.width = `${percent}%`;
  track.appendChild(fill);

  return track;
}

/**
 * Renders the selected project shell without rendering project tasks.
 * Project progress counts are enriched by app.js in Session 13.
 * @param {Object|null} project - Active project object or null.
 * @returns {void}
 */
function renderProjectView(project) {
  const title = document.getElementById('project-title');
  const meta = document.getElementById('project-meta');

  if (!title || !meta) {
    return;
  }

  if (!project) {
    title.textContent = 'Select a project';
    meta.textContent = 'Choose a project from the sidebar to view its tasks.';
    updateProjectActionButtons(null);
    return;
  }

  title.textContent = project.name || 'Untitled project';
  meta.textContent = getProjectMeta(project);
  updateProjectActionButtons(project);
}

/**
 * Builds concise metadata for the project header.
 * @param {Object} project - Project object to describe.
 * @returns {string} Project metadata copy.
 */
function getProjectMeta(project) {
  const hasTaskCounts = project.taskCount !== undefined || project.completedCount !== undefined;

  if (hasTaskCounts) {
    return formatProjectTaskCounts(project.taskCount || 0, project.completedCount || 0);
  }

  if (project.createdAt) {
    return `Created ${formatDate(project.createdAt)}`;
  }

  return 'Project tasks will appear below.';
}

/**
 * Formats project task count metadata.
 * @param {number} taskCount - Total task count.
 * @param {number} completedCount - Completed task count.
 * @returns {string} Task count summary.
 */
function formatProjectTaskCounts(taskCount, completedCount) {
  const total = Number(taskCount) || 0;
  const completed = Number(completedCount) || 0;
  const taskLabel = total === 1 ? 'task' : 'tasks';

  return `${total} ${taskLabel}, ${completed} complete`;
}

/**
 * Updates project action buttons for the active project.
 * @param {Object|null} project - Active project object or null.
 * @returns {void}
 */
function updateProjectActionButtons(project) {
  const buttons = [
    document.getElementById('btn-edit-project'),
    document.getElementById('btn-delete-project'),
  ];

  buttons.forEach((button) => updateProjectActionButton(button, project));
}

/**
 * Updates one project action button with active project data.
 * @param {HTMLButtonElement|null} button - Project action button.
 * @param {Object|null} project - Active project object or null.
 * @returns {void}
 */
function updateProjectActionButton(button, project) {
  if (!button) {
    return;
  }

  button.disabled = !project;

  if (project && project.id) {
    button.dataset.projectId = project.id;
  } else {
    delete button.dataset.projectId;
  }
}

/**
 * Renders a list of task cards into the task list container.
 * @param {Array} tasks - Pre-filtered task objects.
 * @param {Object} filters - Current filter values.
 * @param {string} searchQuery - Current search query.
 * @returns {void}
 */
function renderTaskList(tasks, filters, searchQuery) {
  const container = document.getElementById('task-list');

  if (!container) {
    return;
  }

  clearContainer(container);

  if (tasks.length === 0) {
    container.appendChild(renderEmptyStateElement(getTaskEmptyState(filters, searchQuery)));
    return;
  }

  container.appendChild(buildTaskCardFragment(tasks));
}

/**
 * Gets the empty state type for a rendered task list.
 * @param {Object} filters - Current filter values.
 * @param {string} searchQuery - Current search query.
 * @returns {string} Empty state type.
 */
function getTaskEmptyState(filters, searchQuery) {
  const safeFilters = filters || {};
  const hasSearch = (searchQuery || '').trim() !== '';
  const hasFilters =
    (safeFilters.status || 'all') !== 'all' ||
    (safeFilters.priority || 'all') !== 'all' ||
    (safeFilters.category || 'all') !== 'all';

  return hasSearch || hasFilters ? 'no-search-results' : 'no-tasks';
}

/**
 * Builds a document fragment containing task cards.
 * @param {Array} tasks - Task objects to render.
 * @returns {DocumentFragment} Fragment containing task cards.
 */
function buildTaskCardFragment(tasks) {
  const fragment = document.createDocumentFragment();

  tasks.forEach((task) => {
    fragment.appendChild(renderTaskCard(task));
  });

  return fragment;
}

/**
 * Renders a single task card element.
 * @param {Object} task - Task object to render.
 * @returns {HTMLElement} Task card element.
 */
function renderTaskCard(task) {
  const card = createEl('article', 'task-card');
  card.dataset.taskId = task.id;
  applyTaskCardState(card, task);
  card.appendChild(buildTaskCheckbox(task));
  card.appendChild(buildTaskBody(task));
  card.appendChild(buildTaskActions(task));

  return card;
}

/**
 * Applies state classes to a task card.
 * @param {HTMLElement} card - Task card element.
 * @param {Object} task - Task object.
 * @returns {void}
 */
function applyTaskCardState(card, task) {
  if (task.status !== 'done' && isOverdue(task.dueDate)) {
    card.classList.add('task-card--overdue');
  } else if (isToday(task.dueDate)) {
    card.classList.add('task-card--today');
  }

  if (task.status === 'done') {
    card.classList.add('task-card--done');
  }
}

/**
 * Builds a task completion checkbox.
 * @param {Object} task - Task object.
 * @returns {HTMLInputElement} Checkbox element.
 */
function buildTaskCheckbox(task) {
  const checkbox = createEl('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-card__checkbox';
  checkbox.checked = task.status === 'done';
  checkbox.setAttribute('aria-label', `Mark ${task.title} complete`);

  return checkbox;
}

/**
 * Builds the textual body of a task card.
 * @param {Object} task - Task object.
 * @returns {HTMLElement} Task body element.
 */
function buildTaskBody(task) {
  const body = createEl('div', 'task-card__body');

  body.appendChild(createEl('h3', 'task-card__title', task.title));

  if (task.description) {
    body.appendChild(createEl('p', 'task-card__description', task.description));
  }

  body.appendChild(buildTaskMeta(task));

  return body;
}

/**
 * Builds the metadata row for a task card.
 * @param {Object} task - Task object.
 * @returns {HTMLElement} Task metadata element.
 */
function buildTaskMeta(task) {
  const meta = createEl('div', 'task-card__meta');

  meta.appendChild(buildPriorityLabel(task.priority || DEFAULT_PRIORITY));

  if (task.category) {
    meta.appendChild(createEl('span', 'task-card__category', task.category));
  }

  if (task.dueDate) {
    meta.appendChild(createEl('span', 'task-card__due-date', formatDate(task.dueDate)));
  }

  return meta;
}

/**
 * Builds a priority dot plus text label.
 * @param {string} priority - Task priority.
 * @returns {HTMLElement} Priority label element.
 */
function buildPriorityLabel(priority) {
  const safePriority = priority || DEFAULT_PRIORITY;
  const wrap = createEl('span', `priority priority--${safePriority}`);
  const label = safePriority.charAt(0).toUpperCase() + safePriority.slice(1);

  wrap.appendChild(createEl('span', 'priority__dot'));
  wrap.appendChild(createEl('span', 'priority__label', label));

  return wrap;
}

/**
 * Builds task card edit and delete controls.
 * @param {Object} task - Task object.
 * @returns {HTMLElement} Task actions element.
 */
function buildTaskActions(task) {
  const actions = createEl('div', 'task-card__actions');
  const editBtn = createIconButton('task-card__edit', `Edit ${task.title}`, '✎');
  const deleteBtn = createIconButton('task-card__delete', `Delete ${task.title}`, '🗑');

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  return actions;
}

/**
 * Creates an icon-style button.
 * @param {string} className - Button class name.
 * @param {string} label - Accessible label.
 * @param {string} icon - Visible icon text.
 * @returns {HTMLButtonElement} Button element.
 */
function createIconButton(className, label, icon) {
  const button = createEl('button', className, icon);
  button.type = 'button';
  button.setAttribute('aria-label', label);

  return button;
}

/**
 * Renders the full dashboard view from aggregated data.
 * @param {Object} data - Dashboard data grouped by section.
 * @returns {void}
 */
function renderDashboard(data) {
  renderStats(data.stats);
  renderTaskSection('dashboard-overdue', data.overdue, 'no-overdue');
  renderTaskSection('dashboard-today', data.today, 'no-tasks-today');
  renderTaskSection('dashboard-upcoming', data.upcoming, 'no-tasks');
  renderActivityFeed(data.activity);
}

/**
 * Renders a dashboard task section.
 * @param {string} containerId - Target section container ID.
 * @param {Array} tasks - Section task objects.
 * @param {string} emptyType - Empty state type for no tasks.
 * @returns {void}
 */
function renderTaskSection(containerId, tasks, emptyType) {
  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(tasks.length === 0
    ? renderEmptyStateElement(emptyType)
    : buildTaskCardFragment(tasks));
}

/**
 * Renders the four dashboard stat cards.
 * @param {Object} stats - Stats object.
 * @returns {void}
 */
function renderStats(stats) {
  const container = document.getElementById('dashboard-stats');

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(buildStatsFragment(stats));
}

/**
 * Builds stat card elements.
 * @param {Object} stats - Stats object.
 * @returns {DocumentFragment} Fragment containing stat cards.
 */
function buildStatsFragment(stats) {
  const fragment = document.createDocumentFragment();
  const cards = [
    { label: 'Total', value: stats.total, modifier: 'total' },
    { label: 'Completed', value: stats.completed, modifier: 'completed' },
    { label: 'In Progress', value: stats.inProgress, modifier: 'progress' },
    { label: 'Overdue', value: stats.overdue, modifier: 'overdue' },
  ];

  cards.forEach((card) => fragment.appendChild(buildStatCard(card)));

  return fragment;
}

/**
 * Builds a dashboard stat card.
 * @param {Object} card - Stat card configuration.
 * @returns {HTMLElement} Stat card element.
 */
function buildStatCard(card) {
  const cardEl = createEl('div', `stat-card stat-card--${card.modifier}`);

  cardEl.appendChild(createEl('span', 'stat-card__value', String(card.value)));
  cardEl.appendChild(createEl('span', 'stat-card__label', card.label));

  return cardEl;
}

/**
 * Renders placeholder skeleton cards into the task list container.
 * @param {number} count - Number of skeleton cards to render.
 * @returns {void}
 */
function renderSkeletonCards(count) {
  const container = document.getElementById('task-list');

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(buildSkeletonFragment(count));
}

/**
 * Builds skeleton card elements.
 * @param {number} count - Number of skeleton cards to build.
 * @returns {DocumentFragment} Fragment containing skeleton cards.
 */
function buildSkeletonFragment(count) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    fragment.appendChild(buildSkeletonCard());
  }

  return fragment;
}

/**
 * Builds one skeleton task card.
 * @returns {HTMLElement} Skeleton card element.
 */
function buildSkeletonCard() {
  const card = createEl('div', 'task-card task-card--skeleton');

  card.appendChild(createEl('div', 'skeleton-line skeleton-line--title'));
  card.appendChild(createEl('div', 'skeleton-line skeleton-line--meta'));

  return card;
}

/**
 * Builds an empty state element for the given type.
 * @param {string} type - Empty state type.
 * @returns {HTMLElement} Empty state element.
 */
function renderEmptyStateElement(type) {
  const config = getEmptyStateConfig(type);
  const wrapper = createEl('div', 'empty-state');

  wrapper.setAttribute('aria-live', 'polite');
  wrapper.appendChild(createEl('p', 'empty-state__message', config.text));

  if (config.action) {
    wrapper.appendChild(buildEmptyStateAction(type, config.action));
  }

  return wrapper;
}

/**
 * Gets empty state copy for a type.
 * @param {string} type - Empty state type.
 * @returns {Object} Empty state config.
 */
function getEmptyStateConfig(type) {
  const messages = {
    'no-projects': { text: 'Create your first project to get started', action: 'Create Project' },
    'no-tasks': { text: 'No tasks yet. Create your first task', action: 'Add Task' },
    'no-overdue': { text: 'Great job! You have no overdue tasks', action: null },
    'no-tasks-today': { text: 'Nothing due today. Enjoy your day', action: null },
    'no-search-results': { text: 'No tasks match your search', action: null },
  };

  return messages[type] || { text: '', action: null };
}

/**
 * Builds an empty state call-to-action button.
 * @param {string} type - Empty state type.
 * @param {string} action - Button text.
 * @returns {HTMLButtonElement} Empty state button.
 */
function buildEmptyStateAction(type, action) {
  const button = createEl('button', 'btn-primary empty-state__action', action);
  button.type = 'button';
  button.dataset.emptyAction = type;

  return button;
}

/**
 * Renders an empty state into the main task list container.
 * @param {string} type - Empty state type.
 * @returns {void}
 */
function renderEmptyState(type) {
  const container = document.getElementById('task-list');

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(renderEmptyStateElement(type));
}

/**
 * Renders a dismissible error banner into the main task list container.
 * @param {string} message - Human-readable error message.
 * @returns {void}
 */
function renderErrorBanner(message) {
  const container = document.getElementById('task-list');

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(buildErrorBanner(message));
}

/**
 * Builds an error banner element.
 * @param {string} message - Human-readable error message.
 * @returns {HTMLElement} Error banner element.
 */
function buildErrorBanner(message) {
  const banner = createEl('div', 'error-banner');
  const dismissBtn = createEl('button', 'error-banner__dismiss', 'Dismiss');

  banner.setAttribute('role', 'alert');
  banner.appendChild(createEl('p', 'error-banner__message', message));
  dismissBtn.type = 'button';
  dismissBtn.setAttribute('aria-label', 'Dismiss error message');
  banner.appendChild(dismissBtn);

  return banner;
}

/**
 * Renders notifications inside the notification panel.
 * @param {Array} notifications - Notification objects to render.
 * @returns {void}
 */
function renderNotificationPanel(notifications) {
  const container = document.getElementById('notification-panel');

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(notifications.length === 0
    ? createEl('p', 'notification-empty', 'No notifications')
    : buildNotificationFragment(notifications));
}

/**
 * Builds notification item elements.
 * @param {Array} notifications - Notification objects to render.
 * @returns {DocumentFragment} Fragment containing notification items.
 */
function buildNotificationFragment(notifications) {
  const fragment = document.createDocumentFragment();

  notifications.forEach((notification) => {
    fragment.appendChild(buildNotificationItem(notification));
  });

  return fragment;
}

/**
 * Builds a notification item.
 * @param {Object} notification - Notification object.
 * @returns {HTMLElement} Notification item element.
 */
function buildNotificationItem(notification) {
  const item = createEl('div', 'notification-item');

  if (!notification.read) {
    item.classList.add('notification-item--unread');
  }

  item.dataset.notificationId = notification.id;
  item.appendChild(createEl('p', 'notification-item__message', notification.message));
  item.appendChild(createEl('span', 'notification-item__time', formatDate(notification.timestamp)));

  return item;
}

/**
 * Renders the recent activity feed.
 * @param {Array} activities - Activity objects in display order.
 * @returns {void}
 */
function renderActivityFeed(activities) {
  const container = document.getElementById('activity-feed');

  if (!container) {
    return;
  }

  clearContainer(container);
  container.appendChild(activities.length === 0
    ? createEl('p', 'activity-empty', 'No recent activity')
    : buildActivityFragment(activities));
}

/**
 * Builds activity feed item elements.
 * @param {Array} activities - Activity objects in display order.
 * @returns {DocumentFragment} Fragment containing activity items.
 */
function buildActivityFragment(activities) {
  const fragment = document.createDocumentFragment();

  activities.forEach((activity) => {
    fragment.appendChild(buildActivityItem(activity));
  });

  return fragment;
}

/**
 * Builds an activity feed item.
 * @param {Object} activity - Activity object.
 * @returns {HTMLElement} Activity item element.
 */
function buildActivityItem(activity) {
  const labels = {
    task_created: 'created task',
    task_completed: 'completed task',
    task_updated: 'updated task',
    project_created: 'created project',
  };
  const item = createEl('li', 'activity-item');
  const action = labels[activity.type] || 'updated';
  const subject = activity.taskTitle || activity.projectName || '';

  item.appendChild(createEl('span', 'activity-item__text', `${action} "${subject}"`));
  item.appendChild(createEl('span', 'activity-item__time', formatDate(activity.timestamp)));

  return item;
}

/**
 * Hides the modal overlay and clears its content.
 * @returns {void}
 */
function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  const panel = document.getElementById('modal-panel');

  if (!overlay || !panel) {
    return;
  }

  overlay.hidden = true;
  clearContainer(panel);
}

/**
 * Shows the Add Task modal with an empty form.
 * @returns {void}
 */
function showAddTaskModal() {
  showTaskModal('Add Task', {});
}

/**
 * Shows the Edit Task modal pre-filled with task data.
 * @param {Object} task - Task data to pre-fill.
 * @returns {void}
 */
function showEditTaskModal(task) {
  showTaskModal('Edit Task', task || {});
}

/**
 * Shows the Add Project modal with an empty name field.
 * @returns {void}
 */
function showAddProjectModal() {
  showProjectModal('Create Project', {}, 'create');
}

/**
 * Shows the Edit Project modal with the current project name.
 * @param {Object} project - Project data to pre-fill.
 * @returns {void}
 */
function showEditProjectModal(project) {
  showProjectModal('Rename Project', project || {}, 'edit');
}

/**
 * Shows the shared project modal for create and rename flows.
 * @param {string} titleText - Modal title text.
 * @param {Object} project - Project data to pre-fill.
 * @param {string} mode - Project modal mode for app.js wiring.
 * @returns {void}
 */
function showProjectModal(titleText, project, mode) {
  const panel = prepareModalPanel();

  if (!panel) {
    return;
  }

  panel.appendChild(buildModalTitle(titleText));
  panel.appendChild(buildProjectForm(project, mode));
  showModalOverlay();
}

/**
 * Builds the project create or rename form.
 * @param {Object} project - Project data to pre-fill.
 * @param {string} mode - Project modal mode.
 * @returns {HTMLFormElement} Project form.
 */
function buildProjectForm(project, mode) {
  const form = createEl('form', 'project-modal');

  form.dataset.projectMode = mode;

  if (project.id) {
    form.dataset.projectId = project.id;
  }

  appendProjectNameField(form, project.name || '');
  appendProjectError(form);
  form.appendChild(buildProjectFormActions());

  return form;
}

/**
 * Appends the project name field to the project form.
 * @param {HTMLFormElement} form - Project form.
 * @param {string} value - Current project name.
 * @returns {void}
 */
function appendProjectNameField(form, value) {
  const label = createEl('label', 'project-modal__field');
  const labelText = createEl('span', 'form-label', 'Project name');
  const input = createEl('input');

  input.type = 'text';
  input.name = 'projectName';
  input.required = true;
  input.maxLength = 80;
  input.autocomplete = 'off';
  input.value = value;
  label.appendChild(labelText);
  label.appendChild(input);
  form.appendChild(label);
}

/**
 * Appends project form validation message space.
 * @param {HTMLFormElement} form - Project form.
 * @returns {void}
 */
function appendProjectError(form) {
  const error = createEl('p', 'project-modal__error');

  error.dataset.projectError = 'name';
  error.setAttribute('role', 'alert');
  form.appendChild(error);
}

/**
 * Builds project form action buttons.
 * @returns {HTMLElement} Actions wrapper.
 */
function buildProjectFormActions() {
  const actions = createEl('div', 'modal-actions');
  const cancelBtn = createEl('button', 'btn-ghost', 'Cancel');
  const saveBtn = createEl('button', 'btn-primary', 'Save');

  cancelBtn.type = 'button';
  cancelBtn.dataset.modalAction = 'cancel';
  saveBtn.type = 'submit';
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);

  return actions;
}

/**
 * Shows a task modal with a shared task form.
 * @param {string} titleText - Modal title.
 * @param {Object} task - Task data to pre-fill.
 * @returns {void}
 */
function showTaskModal(titleText, task) {
  const panel = prepareModalPanel();

  if (!panel) {
    return;
  }

  panel.appendChild(buildModalTitle(titleText));
  panel.appendChild(buildTaskForm(task));
  showModalOverlay();
}

/**
 * Shows a confirmation modal with the given message.
 * @param {string} message - Confirmation message to display.
 * @param {Function} onConfirm - Callback for app.js to invoke.
 * @returns {void}
 */
function showConfirmModal(message, onConfirm) {
  const panel = prepareModalPanel();

  if (!panel) {
    return;
  }

  panel.appendChild(buildModalTitle('Confirm'));
  panel.appendChild(createEl('p', 'modal-message', message));
  panel.appendChild(buildConfirmActions(onConfirm));
  showModalOverlay();
}

/**
 * Clears and returns the modal panel.
 * @returns {HTMLElement|null} Modal panel or null.
 */
function prepareModalPanel() {
  const panel = document.getElementById('modal-panel');

  if (!panel) {
    return null;
  }

  clearContainer(panel);

  return panel;
}

/**
 * Shows the modal overlay.
 * @returns {void}
 */
function showModalOverlay() {
  const overlay = document.getElementById('modal-overlay');

  if (overlay) {
    overlay.hidden = false;
  }
}

/**
 * Builds a modal title element.
 * @param {string} text - Modal title text.
 * @returns {HTMLElement} Modal title.
 */
function buildModalTitle(text) {
  const title = createEl('h2', 'modal-title', text);
  title.id = 'modal-title';

  return title;
}

/**
 * Builds the task form used by Add and Edit task modals.
 * @param {Object} task - Task data to pre-fill.
 * @returns {HTMLFormElement} Task form.
 */
function buildTaskForm(task) {
  const form = createEl('form', 'task-form');

  appendTextField(form, 'Title', 'task-form-title', 'title', task.title || '', true);
  appendTextareaField(form, task.description || '');
  appendDateField(form, task.dueDate || null);
  appendSelectField(form, 'Priority', 'task-form-priority', 'priority', getPriorityOptions(), task.priority || 'none');
  appendSelectField(form, 'Category', 'task-form-category', 'category', getCategoryOptions(), task.category || '');
  form.appendChild(buildTaskFormActions());

  return form;
}

/**
 * Appends a text input field to a form.
 * @param {HTMLFormElement} form - Form to append to.
 * @param {string} labelText - Label text.
 * @param {string} id - Input ID.
 * @param {string} name - Input name.
 * @param {string} value - Input value.
 * @param {boolean} required - Whether the field is required.
 * @returns {void}
 */
function appendTextField(form, labelText, id, name, value, required) {
  const input = createEl('input');

  input.type = 'text';
  input.id = id;
  input.name = name;
  input.required = required;
  input.maxLength = MAX_TITLE_LENGTH;
  input.value = value;

  appendLabeledControl(form, labelText, id, input);
}

/**
 * Appends a textarea description field.
 * @param {HTMLFormElement} form - Form to append to.
 * @param {string} value - Textarea value.
 * @returns {void}
 */
function appendTextareaField(form, value) {
  const textarea = createEl('textarea');

  textarea.id = 'task-form-description';
  textarea.name = 'description';
  textarea.value = value;

  appendLabeledControl(form, 'Description', textarea.id, textarea);
}

/**
 * Appends a due date input field.
 * @param {HTMLFormElement} form - Form to append to.
 * @param {Object|null} value - Existing due date.
 * @returns {void}
 */
function appendDateField(form, value) {
  const input = createEl('input');

  input.type = 'date';
  input.id = 'task-form-due-date';
  input.name = 'dueDate';
  input.value = formatInputDate(value);

  appendLabeledControl(form, 'Due Date', input.id, input);
}

/**
 * Appends a select field to a form.
 * @param {HTMLFormElement} form - Form to append to.
 * @param {string} labelText - Label text.
 * @param {string} id - Select ID.
 * @param {string} name - Select name.
 * @param {Array} options - Select options.
 * @param {string} selectedValue - Selected value.
 * @returns {void}
 */
function appendSelectField(form, labelText, id, name, options, selectedValue) {
  const select = createEl('select');

  select.id = id;
  select.name = name;
  options.forEach((option) => select.appendChild(buildOption(option, selectedValue)));

  appendLabeledControl(form, labelText, id, select);
}

/**
 * Appends a label and control pair to a form.
 * @param {HTMLFormElement} form - Form to append to.
 * @param {string} labelText - Label text.
 * @param {string} controlId - Associated control ID.
 * @param {HTMLElement} control - Form control.
 * @returns {void}
 */
function appendLabeledControl(form, labelText, controlId, control) {
  const label = createEl('label', 'form-label', labelText);

  label.setAttribute('for', controlId);
  form.appendChild(label);
  form.appendChild(control);
}

/**
 * Builds an option element.
 * @param {Object} optionConfig - Option value and label.
 * @param {string} selectedValue - Selected value.
 * @returns {HTMLOptionElement} Option element.
 */
function buildOption(optionConfig, selectedValue) {
  const option = createEl('option', null, optionConfig.label);

  option.value = optionConfig.value;
  option.selected = optionConfig.value === selectedValue;

  return option;
}

/**
 * Gets priority select options.
 * @returns {Array} Priority options.
 */
function getPriorityOptions() {
  return ['none', 'low', 'medium', 'high'].map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));
}

/**
 * Gets category select options.
 * @returns {Array} Category options.
 */
function getCategoryOptions() {
  const categoryOptions = CATEGORIES.map((value) => ({ value, label: value }));

  categoryOptions.push({ value: 'custom', label: 'Custom…' });

  return categoryOptions;
}

/**
 * Builds Add/Edit task form action buttons.
 * @returns {HTMLElement} Actions wrapper.
 */
function buildTaskFormActions() {
  const actions = createEl('div', 'modal-actions');
  const cancelBtn = createEl('button', 'btn-ghost', 'Cancel');
  const saveBtn = createEl('button', 'btn-primary', 'Save');

  cancelBtn.type = 'button';
  cancelBtn.dataset.modalAction = 'cancel';
  saveBtn.type = 'submit';
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);

  return actions;
}

/**
 * Builds confirmation modal action buttons.
 * @param {Function} onConfirm - Callback for app.js to invoke.
 * @returns {HTMLElement} Actions wrapper.
 */
function buildConfirmActions(onConfirm) {
  const actions = createEl('div', 'modal-actions');
  const cancelBtn = createEl('button', 'btn-ghost', 'Cancel');
  const confirmBtn = createEl('button', 'btn-danger', 'Confirm');

  cancelBtn.type = 'button';
  cancelBtn.dataset.modalAction = 'cancel';
  confirmBtn.type = 'button';
  confirmBtn.dataset.modalAction = 'confirm';
  confirmBtn.onConfirmCallback = onConfirm;
  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);

  return actions;
}

/**
 * Shows the offline mode banner.
 * @returns {void}
 */
function showOfflineBanner() {
  const banner = document.getElementById('offline-banner');

  if (banner) {
    banner.hidden = false;
  }
}

/**
 * Hides the offline mode banner.
 * @returns {void}
 */
function hideOfflineBanner() {
  const banner = document.getElementById('offline-banner');

  if (banner) {
    banner.hidden = true;
  }
}

/**
 * Updates the notification bell unread count badge.
 * @param {number} count - Unread notification count.
 * @returns {void}
 */
function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-count') ||
    document.getElementById('notif-count');

  if (!badge) {
    return;
  }

  badge.hidden = count <= 0;
  badge.textContent = count <= 0 ? '0' : String(count);
}

/**
 * Public UI API for script-tag module loading.
 * @type {Object}
 */
window.ui = {
  renderSidebar,
  renderProjectList,
  renderProjectView,
  renderTaskList,
  renderTaskCard,
  renderDashboard,
  renderStats,
  renderSkeletonCards,
  renderEmptyState,
  renderErrorBanner,
  renderNotificationPanel,
  renderActivityFeed,
  showAddProjectModal,
  showEditProjectModal,
  showAddTaskModal,
  showEditTaskModal,
  showConfirmModal,
  hideModal,
  showOfflineBanner,
  hideOfflineBanner,
  updateNotificationBadge,
};
