/**
 * app.js - Orchestrator.
 * Scope: Application state, event listeners, and module wiring.
 * No Firebase SDK calls. Firestore access goes through db.js.
 * See: AGENTS.md sections 5 and 6.
 */

const VALID_FILTER_TYPES = ['status', 'priority', 'category'];
const VALID_PRIORITIES_APP = ['high', 'medium', 'low', DEFAULT_PRIORITY];
const VALID_STATUSES_APP = [STATUS_TODO, STATUS_PROGRESS, STATUS_DONE];
const TRANSIENT_DASHBOARD_ERROR = 'Unable to load data. Please try again.';
const SIGN_OUT_MESSAGE = 'Sign out of Taskly? Unsaved offline changes may still be syncing.';

let hasBoundDomEvents = false;
let activeTaskUnsubscribe = null;
let dashboardUnsubscribe = null;
let searchDebounceId = null;
let currentEditingTaskId = null;
let dashboardTasks = [];
const notifiedTaskKeys = new Set();

/**
 * Application state - single source of truth.
 * Only app.js reads or writes this object.
 */
const state = {
  user: null,
  currentProjectId: null,
  projects: [],
  tasks: [],
  dashboardData: {
    overdue: [],
    today: [],
    upcoming: [],
    activity: [],
    stats: {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0
    }
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

/**
 * Initializes the application after successful authentication.
 * @param {Object} user - Firebase Auth user.
 * @returns {void}
 */
function init(user) {
  detachFirestoreListeners();
  resetSessionState(user);
  bindDomEventsOnce();
  renderAuthenticatedShell();
  initializeOfflineState();
  startProjectsListener();
  startDashboardListener();
  renderSettings();
  renderDashboard();
}

/**
 * Resets app state for a new authenticated session.
 * @param {Object} user - Firebase Auth user.
 * @returns {void}
 */
function resetSessionState(user) {
  state.user = user;
  state.currentProjectId = null;
  state.projects = [];
  state.tasks = [];
  state.dashboardData = buildEmptyDashboardData();
  state.filters = { status: 'all', priority: 'all', category: 'all' };
  state.searchQuery = '';
  state.notifications = [];
  state.unreadCount = 0;
  dashboardTasks = [];
  currentEditingTaskId = null;
  notifiedTaskKeys.clear();
}

/**
 * Builds empty dashboard render data.
 * @returns {Object} Empty dashboard data.
 */
function buildEmptyDashboardData() {
  return {
    overdue: [],
    today: [],
    upcoming: [],
    activity: [],
    stats: { total: 0, completed: 0, inProgress: 0, overdue: 0 }
  };
}

/**
 * Binds all DOM and browser event listeners once.
 * @returns {void}
 */
function bindDomEventsOnce() {
  if (hasBoundDomEvents) {
    return;
  }

  bindStaticButtonEvents();
  bindDelegatedClickEvents();
  bindInputEvents();
  bindNetworkEvents();
  hasBoundDomEvents = true;
}

/**
 * Binds static button events.
 * @returns {void}
 */
function bindStaticButtonEvents() {
  bindClick('btn-google-signin', handleGoogleSignIn);
  bindClick('btn-signout', requestSignOutConfirmation);
  bindClick('btn-new-project', showAddProjectModal);
  bindClick('btn-add-task', showAddTaskModal);
  bindClick('fab-add-task', showAddTaskModal);
  bindClick('btn-edit-project', showEditProjectModal);
  bindClick('btn-delete-project', requestProjectDeleteConfirmation);
  bindClick('notification-bell', toggleNotificationPanel);
}

/**
 * Binds a click handler to an element by ID when present.
 * @param {string} id - Element ID.
 * @param {Function} handler - Click handler.
 * @returns {void}
 */
function bindClick(id, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener('click', handler);
  }
}

/**
 * Binds delegated click and change handlers.
 * @returns {void}
 */
function bindDelegatedClickEvents() {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('change', handleDocumentChange);
  document.addEventListener('submit', handleDocumentSubmit);
  document.addEventListener('keydown', handleDocumentKeydown);
}

/**
 * Binds input events for search.
 * @returns {void}
 */
function bindInputEvents() {
  const searchInput = document.getElementById('search-input');

  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }
}

/**
 * Binds browser online and offline events.
 * @returns {void}
 */
function bindNetworkEvents() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

/**
 * Renders app chrome after sign-in.
 * @returns {void}
 */
function renderAuthenticatedShell() {
  router.showView('dashboard');
  updateSidebarUser();
  ui.renderSidebar(enrichProjects(state.projects), state.currentProjectId);
  ui.renderNotificationPanel(state.notifications);
  ui.updateNotificationBadge(state.unreadCount);
}

/**
 * Updates the sidebar user profile fields.
 * @returns {void}
 */
function updateSidebarUser() {
  const photo = document.getElementById('user-photo');
  const name = document.getElementById('user-name');
  const user = state.user || {};

  if (photo) {
    photo.src = user.photoURL || '';
    photo.alt = `${user.displayName || 'Taskly user'} profile photo`;
  }

  if (name) {
    name.textContent = user.displayName || 'Taskly user';
  }
}

/**
 * Initializes offline UI from navigator state.
 * @returns {void}
 */
function initializeOfflineState() {
  state.isOffline = navigator.onLine === false;

  if (state.isOffline) {
    ui.showOfflineBanner();
    return;
  }

  ui.hideOfflineBanner();
}

/**
 * Starts the realtime projects listener.
 * @returns {void}
 */
function startProjectsListener() {
  const unsubscribe = db.listenToProjects(state.user.uid, handleProjectsSnapshot);
  state.listeners.push(unsubscribe);
}

/**
 * Handles realtime project snapshots.
 * @param {Array} projects - Project records.
 * @param {string} [error] - Optional mapped error message.
 * @returns {void}
 */
function handleProjectsSnapshot(projects, error) {
  if (error) {
    ui.renderErrorBanner(error);
    return;
  }

  state.projects = projects || [];
  ui.renderSidebar(enrichProjects(state.projects), state.currentProjectId);
  reconcileActiveProject();
}

/**
 * Starts or restarts the dashboard task listener.
 * @returns {void}
 */
function startDashboardListener() {
  const unsubscribe = db.listenToDashboardTasks(state.user.uid, handleDashboardSnapshot);
  dashboardUnsubscribe = unsubscribe;
  state.listeners.push(unsubscribe);
}

/**
 * Handles dashboard collection group task updates.
 * @param {Array} tasks - Dashboard tasks.
 * @param {string} [error] - Optional mapped error message.
 * @returns {void}
 */
function handleDashboardSnapshot(tasks, error) {
  if (error === TRANSIENT_DASHBOARD_ERROR) {
    resubscribeDashboardTasks();
    return;
  }

  if (error) {
    ui.renderErrorBanner(error);
    return;
  }

  dashboardTasks = tasks || [];
  state.dashboardData = buildDashboardData(dashboardTasks);
  ui.renderSidebar(enrichProjects(state.projects), state.currentProjectId);
  renderDashboard();
  syncNotifications(dashboardTasks);
}

/**
 * Re-subscribes after a transient dashboard listener failure.
 * @returns {void}
 */
function resubscribeDashboardTasks() {
  removeTrackedListener(dashboardUnsubscribe);
  safeUnsubscribe(dashboardUnsubscribe);
  dashboardUnsubscribe = null;
  startDashboardListener();
}

/**
 * Builds dashboard data groups and stats.
 * @param {Array} tasks - All dashboard tasks.
 * @returns {Object} Dashboard render data.
 */
function buildDashboardData(tasks) {
  const openTasks = (tasks || []).filter((task) => task.status !== STATUS_DONE);
  const overdue = openTasks.filter((task) => isBeforeToday(task.dueDate));
  const today = openTasks.filter((task) => isToday(task.dueDate));
  const upcoming = openTasks.filter((task) => isAfterToday(task.dueDate));

  return {
    overdue,
    today,
    upcoming,
    activity: state.dashboardData.activity || [],
    stats: buildStats(tasks || [], overdue)
  };
}

/**
 * Builds dashboard statistic values.
 * @param {Array} tasks - All dashboard tasks.
 * @param {Array} overdue - Overdue open tasks.
 * @returns {Object} Stats object.
 */
function buildStats(tasks, overdue) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === STATUS_DONE).length,
    inProgress: tasks.filter((task) => task.status === STATUS_PROGRESS).length,
    overdue: overdue.length
  };
}

/**
 * Renders the dashboard view through ui.js.
 * @returns {void}
 */
function renderDashboard() {
  ui.renderDashboard(state.dashboardData);
  renderNotificationAlerts();
}

/**
 * Keeps project selection valid after project updates.
 * @returns {void}
 */
function reconcileActiveProject() {
  if (!state.currentProjectId) {
    return;
  }

  const project = findProject(state.currentProjectId);

  if (!project) {
    clearProjectSelection();
    return;
  }

  ui.renderProjectView(enrichProject(project));
}

/**
 * Clears an invalid active project selection.
 * @returns {void}
 */
function clearProjectSelection() {
  detachProjectTaskListener();
  state.currentProjectId = null;
  state.tasks = [];
  router.showView('dashboard');
  router.setTopbarTitle('Dashboard');
  ui.renderSidebar(enrichProjects(state.projects), null);
}

/**
 * Handles switching to a project.
 * @param {string} projectId - Project document ID.
 * @returns {void}
 */
function handleProjectSwitch(projectId) {
  const project = findProject(projectId);

  if (!project) {
    ui.renderErrorBanner('This project no longer exists.');
    return;
  }

  state.currentProjectId = projectId;
  state.tasks = [];
  router.showView('project');
  router.setTopbarTitle(project.name || 'Project');
  ui.renderProjectView(enrichProject(project));
  ui.renderTaskFilters(state.filters, getTaskCategories([]));
  ui.renderTaskList([], state.filters, state.searchQuery);
  ui.renderSidebar(enrichProjects(state.projects), projectId);
  startProjectTaskListener(projectId);
}

/**
 * Starts the active project task listener.
 * @param {string} projectId - Active project ID.
 * @returns {void}
 */
function startProjectTaskListener(projectId) {
  detachProjectTaskListener();
  activeTaskUnsubscribe = db.listenToTasks(state.user.uid, projectId, handleProjectTasksSnapshot);
  state.listeners.push(activeTaskUnsubscribe);
}

/**
 * Handles task snapshots for the active project.
 * @param {Array} tasks - Project tasks.
 * @param {string} [error] - Optional mapped error.
 * @returns {void}
 */
function handleProjectTasksSnapshot(tasks, error) {
  if (error) {
    ui.renderErrorBanner(error);
    return;
  }

  state.tasks = tasks || [];
  renderProjectTasks();
}

/**
 * Renders the active project task filters and list.
 * @returns {void}
 */
function renderProjectTasks() {
  const categories = getTaskCategories(state.tasks);
  const filteredTasks = filterTasks(state.tasks);

  ui.renderTaskFilters(state.filters, categories);
  ui.renderTaskList(filteredTasks, state.filters, state.searchQuery);
}

/**
 * Handles task search input changes.
 * @param {string} query - Search query.
 * @returns {void}
 */
function handleSearch(query) {
  clearTimeout(searchDebounceId);
  searchDebounceId = setTimeout(() => {
    state.searchQuery = String(query || '').trim();
    renderProjectTasks();
  }, getSearchDebounceMs());
}

/**
 * Gets the configured search debounce interval.
 * @returns {number} Debounce interval in milliseconds.
 */
function getSearchDebounceMs() {
  const input = document.getElementById('search-input');
  return Number(input && input.dataset.debounceMs) || 150;
}

/**
 * Handles filter changes.
 * @param {string} type - Filter type.
 * @param {string} value - Filter value.
 * @returns {void}
 */
function handleFilter(type, value) {
  if (!VALID_FILTER_TYPES.includes(type)) {
    return;
  }

  state.filters[type] = value || 'all';
  ui.updateActiveFilters(state.filters);
  renderProjectTasks();
}

/**
 * Filters active project tasks by state.
 * @param {Array} tasks - Tasks to filter.
 * @returns {Array} Filtered tasks.
 */
function filterTasks(tasks) {
  return (tasks || []).filter((task) => {
    return matchesStatus(task) && matchesPriority(task) &&
      matchesCategory(task) && matchesSearch(task);
  });
}

/**
 * Checks task status filter.
 * @param {Object} task - Task object.
 * @returns {boolean} Whether the task matches.
 */
function matchesStatus(task) {
  return state.filters.status === 'all' || task.status === state.filters.status;
}

/**
 * Checks task priority filter.
 * @param {Object} task - Task object.
 * @returns {boolean} Whether the task matches.
 */
function matchesPriority(task) {
  return state.filters.priority === 'all' || task.priority === state.filters.priority;
}

/**
 * Checks task category filter.
 * @param {Object} task - Task object.
 * @returns {boolean} Whether the task matches.
 */
function matchesCategory(task) {
  return state.filters.category === 'all' || task.category === state.filters.category;
}

/**
 * Checks task search query.
 * @param {Object} task - Task object.
 * @returns {boolean} Whether the task matches.
 */
function matchesSearch(task) {
  const query = state.searchQuery.toLowerCase();

  if (!query) {
    return true;
  }

  return [task.title, task.description, task.category]
    .some((value) => String(value || '').toLowerCase().includes(query));
}

/**
 * Gets task categories from a task list.
 * @param {Array} tasks - Task objects.
 * @returns {Array} Category labels.
 */
function getTaskCategories(tasks) {
  return [...new Set((tasks || []).map((task) => task.category).filter(Boolean))];
}

/**
 * Handles sign-out cleanup.
 * @returns {Promise<void>}
 */
async function handleSignOut() {
  detachFirestoreListeners();
  resetSignedOutState();

  try {
    await auth.signOut();
  } catch (err) {
    ui.renderErrorBanner(normalizeError(err, 'Sign-out failed. Please try again.'));
  }
}

/**
 * Resets app state after sign-out starts.
 * @returns {void}
 */
function resetSignedOutState() {
  state.user = null;
  state.currentProjectId = null;
  state.projects = [];
  state.tasks = [];
  state.dashboardData = buildEmptyDashboardData();
  state.notifications = [];
  state.unreadCount = 0;
  state.listeners = [];
  activeTaskUnsubscribe = null;
  dashboardUnsubscribe = null;
  dashboardTasks = [];
  currentEditingTaskId = null;
}

/**
 * Detaches all Firestore listeners.
 * @returns {void}
 */
function detachFirestoreListeners() {
  state.listeners.forEach((unsubscribe) => safeUnsubscribe(unsubscribe));
  state.listeners = [];
  activeTaskUnsubscribe = null;
  dashboardUnsubscribe = null;
}

/**
 * Detaches the active project task listener.
 * @returns {void}
 */
function detachProjectTaskListener() {
  if (!activeTaskUnsubscribe) {
    return;
  }

  removeTrackedListener(activeTaskUnsubscribe);
  safeUnsubscribe(activeTaskUnsubscribe);
  activeTaskUnsubscribe = null;
}

/**
 * Removes a listener from state tracking.
 * @param {Function|null} unsubscribe - Unsubscribe function.
 * @returns {void}
 */
function removeTrackedListener(unsubscribe) {
  state.listeners = state.listeners.filter((listener) => listener !== unsubscribe);
}

/**
 * Safely calls a Firestore unsubscribe function.
 * @param {Function|null} unsubscribe - Unsubscribe function.
 * @returns {void}
 */
function safeUnsubscribe(unsubscribe) {
  if (typeof unsubscribe === 'function') {
    unsubscribe();
  }
}

/**
 * Handles global click events.
 * @param {MouseEvent} event - Click event.
 * @returns {void}
 */
function handleDocumentClick(event) {
  const target = event.target.closest('button, a');

  if (!target) {
    return;
  }

  routeClickTarget(event, target);
}

/**
 * Routes one delegated click target.
 * @param {MouseEvent} event - Click event.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function routeClickTarget(event, target) {
  handleNavigationClick(event, target);
  handleProjectClick(event, target);
  handleTaskClick(target);
  handleFilterClick(target);
  handleEmptyActionClick(target);
  handleNotificationClick(target);
  handleSettingsClick(target);
  handleModalClick(target);
}

/**
 * Handles sidebar view navigation clicks.
 * @param {MouseEvent} event - Click event.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleNavigationClick(event, target) {
  const view = target.dataset.view;

  if (!view) {
    return;
  }

  event.preventDefault();
  navigateToView(view);
}

/**
 * Navigates to an app view.
 * @param {string} view - View name.
 * @returns {void}
 */
function navigateToView(view) {
  if (view === 'tasks') {
    navigateToTasksView();
    return;
  }

  if (view === 'settings') {
    renderSettings();
  }

  router.showView(view);
}

/**
 * Navigates to the task/project area.
 * @returns {void}
 */
function navigateToTasksView() {
  if (state.currentProjectId) {
    handleProjectSwitch(state.currentProjectId);
    return;
  }

  router.showView('project');
  ui.renderProjectView(null);
  ui.renderTaskFilters(state.filters, []);
  ui.renderEmptyState('no-projects');
}

/**
 * Handles project-specific click actions.
 * @param {MouseEvent} event - Click event.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleProjectClick(event, target) {
  if (target.dataset.projectId && target.dataset.view === 'project') {
    event.preventDefault();
    handleProjectSwitch(target.dataset.projectId);
  }
}

/**
 * Handles task action clicks.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleTaskClick(target) {
  const action = target.dataset.taskAction;

  if (!action || action === 'toggle-status') {
    return;
  }

  handleTaskAction(action, target.dataset.taskId, target.dataset.projectId);
}

/**
 * Handles task action routing.
 * @param {string} action - Task action.
 * @param {string} taskId - Task ID.
 * @param {string} projectId - Project ID.
 * @returns {void}
 */
function handleTaskAction(action, taskId, projectId) {
  const task = findTask(taskId, projectId);

  if (!task) {
    ui.renderErrorBanner('Something went wrong. Please try again.');
    return;
  }

  if (action === 'edit') {
    currentEditingTaskId = task.id;
    ui.showEditTaskModal(task);
  } else if (action === 'delete') {
    requestTaskDeleteConfirmation(task);
  }
}

/**
 * Handles filter button clicks.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleFilterClick(target) {
  if (target.dataset.filterType) {
    handleFilter(target.dataset.filterType, target.dataset.filterValue);
  }
}

/**
 * Handles empty-state action buttons.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleEmptyActionClick(target) {
  const action = target.dataset.emptyAction;

  if (action === 'no-projects') {
    ui.showAddProjectModal();
  } else if (action === 'no-tasks') {
    showAddTaskModal();
  }
}

/**
 * Handles notification action hooks.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleNotificationClick(target) {
  const action = target.dataset.notificationAction;

  if (action === 'mark-read') {
    markNotificationRead(target.dataset.notificationId);
  } else if (action === 'dismiss-alert') {
    dismissNotification(target.dataset.notificationId);
  } else if (action === 'clear-all') {
    clearNotifications();
  }
}

/**
 * Handles settings action hooks.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleSettingsClick(target) {
  const action = target.dataset.settingsAction;

  if (action === 'notifications') {
    handleNotificationSettingsAction();
  } else if (action === 'theme') {
    ui.renderErrorBanner('Something went wrong. Please try again.');
  } else if (action === 'sign-out') {
    requestSignOutConfirmation();
  }
}

/**
 * Handles modal action buttons.
 * @param {HTMLElement} target - Click target.
 * @returns {void}
 */
function handleModalClick(target) {
  const action = target.dataset.modalAction;

  if (action === 'cancel') {
    currentEditingTaskId = null;
    ui.hideModal();
  } else if (action === 'confirm') {
    handleModalConfirm(target);
  }
}

/**
 * Handles modal confirm buttons.
 * @param {HTMLElement} target - Confirm button.
 * @returns {void}
 */
function handleModalConfirm(target) {
  if (typeof target.onConfirmCallback === 'function') {
    target.onConfirmCallback();
  }
}

/**
 * Handles delegated change events.
 * @param {Event} event - Change event.
 * @returns {void}
 */
function handleDocumentChange(event) {
  const target = event.target;

  if (target.dataset.taskAction === 'toggle-status') {
    handleTaskCompleteToggle(target);
  }
}

/**
 * Handles form submissions.
 * @param {SubmitEvent} event - Submit event.
 * @returns {void}
 */
function handleDocumentSubmit(event) {
  const form = event.target;

  if (form.classList.contains('task-form')) {
    event.preventDefault();
    handleTaskFormSubmit(form);
  } else if (form.classList.contains('project-modal')) {
    event.preventDefault();
    handleProjectFormSubmit(form);
  }
}

/**
 * Handles Escape key modal closure.
 * @param {KeyboardEvent} event - Keydown event.
 * @returns {void}
 */
function handleDocumentKeydown(event) {
  if (event.key === 'Escape') {
    ui.hideModal();
  }
}

/**
 * Handles search input events.
 * @param {InputEvent} event - Input event.
 * @returns {void}
 */
function handleSearchInput(event) {
  handleSearch(event.target.value);
}

/**
 * Shows the add task modal when a project is selected.
 * @returns {void}
 */
function showAddTaskModal() {
  if (!state.currentProjectId) {
    ui.renderErrorBanner('This project no longer exists.');
    return;
  }

  currentEditingTaskId = null;
  ui.showAddTaskModal();
}

/**
 * Shows the add project modal.
 * @returns {void}
 */
function showAddProjectModal() {
  ui.showAddProjectModal();
}

/**
 * Shows the active project edit modal.
 * @returns {void}
 */
function showEditProjectModal() {
  const project = findProject(state.currentProjectId);

  if (project) {
    ui.showEditProjectModal(project);
  }
}

/**
 * Handles project form submission.
 * @param {HTMLFormElement} form - Project form.
 * @returns {Promise<void>}
 */
async function handleProjectFormSubmit(form) {
  const name = getProjectFormName(form);

  if (!name) {
    setProjectFormError(form, 'Please enter a project name.');
    return;
  }

  await saveProjectForm(form, name);
}

/**
 * Saves a project form submission.
 * @param {HTMLFormElement} form - Project form.
 * @param {string} name - Trimmed project name.
 * @returns {Promise<void>}
 */
async function saveProjectForm(form, name) {
  try {
    if (form.dataset.projectMode === 'edit') {
      await db.updateProject(state.user.uid, form.dataset.projectId, { name });
      await writeActivitySafely({ type: 'project_updated', projectId: form.dataset.projectId, projectName: name });
    } else {
      const projectId = await db.createProject(state.user.uid, name);
      await writeActivitySafely({ type: 'project_created', projectId, projectName: name });
    }

    ui.hideModal();
  } catch (err) {
    setProjectFormError(form, normalizeError(err, 'Something went wrong. Please try again.'));
  }
}

/**
 * Handles task form submission.
 * @param {HTMLFormElement} form - Task form.
 * @returns {Promise<void>}
 */
async function handleTaskFormSubmit(form) {
  const taskData = buildTaskDataFromForm(form);

  if (!taskData.title) {
    setTaskFormError(form, 'Please enter a task title.');
    return;
  }

  await saveTaskForm(form, taskData);
}

/**
 * Saves task form data.
 * @param {HTMLFormElement} form - Task form.
 * @param {Object} taskData - Normalized task data.
 * @returns {Promise<void>}
 */
async function saveTaskForm(form, taskData) {
  const existingTask = getEditingTask(form);

  try {
    validateTaskData(taskData);
    if (existingTask) {
      await updateTask(existingTask, taskData);
    } else {
      await createTask(taskData);
    }

    currentEditingTaskId = null;
    ui.hideModal();
  } catch (err) {
    setTaskFormError(form, normalizeError(err, 'Something went wrong. Please try again.'));
  }
}

/**
 * Creates a task through db.js.
 * @param {Object} taskData - Task fields.
 * @returns {Promise<void>}
 */
async function createTask(taskData) {
  const projectId = state.currentProjectId;

  try {
    const taskId = await db.createTask(state.user.uid, projectId, taskData);

    await writeActivitySafely({
      type: 'task_created',
      taskId,
      taskTitle: taskData.title,
      projectId
    });
  } catch (err) {
    throw normalizeError(err, 'Something went wrong. Please try again.');
  }
}

/**
 * Updates a task through db.js.
 * @param {Object} task - Existing task.
 * @param {Object} taskData - Updated task fields.
 * @returns {Promise<void>}
 */
async function updateTask(task, taskData) {
  const projectId = task.projectId || state.currentProjectId;

  try {
    await db.updateTask(state.user.uid, projectId, task.id, taskData);
    await writeActivitySafely({
      type: 'task_updated',
      taskId: task.id,
      taskTitle: taskData.title,
      projectId
    });
  } catch (err) {
    throw normalizeError(err, 'Something went wrong. Please try again.');
  }
}

/**
 * Handles task completion checkbox toggles.
 * @param {HTMLInputElement} target - Checkbox input.
 * @returns {Promise<void>}
 */
async function handleTaskCompleteToggle(target) {
  const task = findTask(target.dataset.taskId, target.dataset.projectId);

  if (!task) {
    return;
  }

  await updateTaskStatus(task, target.checked ? STATUS_DONE : STATUS_TODO);
}

/**
 * Updates task status through db.js.
 * @param {Object} task - Task object.
 * @param {string} status - Next status.
 * @returns {Promise<void>}
 */
async function updateTaskStatus(task, status) {
  try {
    const projectId = task.projectId || state.currentProjectId;
    await db.updateTask(state.user.uid, projectId, task.id, { status });

    if (status === STATUS_DONE) {
      await writeActivitySafely({ type: 'task_completed', taskId: task.id, taskTitle: task.title, projectId });
    }
  } catch (err) {
    ui.renderErrorBanner(normalizeError(err, 'Something went wrong. Please try again.'));
  }
}

/**
 * Requests task delete confirmation.
 * @param {Object} task - Task to delete.
 * @returns {void}
 */
function requestTaskDeleteConfirmation(task) {
  ui.showConfirmModal('Delete this task?', () => deleteTask(task));
}

/**
 * Deletes a task through db.js.
 * @param {Object} task - Task object.
 * @returns {Promise<void>}
 */
async function deleteTask(task) {
  try {
    const projectId = task.projectId || state.currentProjectId;
    await db.deleteTask(state.user.uid, projectId, task.id);
    await writeActivitySafely({ type: 'task_deleted', taskId: task.id, taskTitle: task.title, projectId });
    currentEditingTaskId = null;
    ui.hideModal();
  } catch (err) {
    ui.renderErrorBanner(normalizeError(err, 'Something went wrong. Please try again.'));
  }
}

/**
 * Requests project delete confirmation.
 * @returns {void}
 */
function requestProjectDeleteConfirmation() {
  const project = findProject(state.currentProjectId);

  if (project) {
    ui.showConfirmModal('Delete this project and all of its tasks?', () => deleteProject(project));
  }
}

/**
 * Deletes a project through db.js.
 * @param {Object} project - Project to delete.
 * @returns {Promise<void>}
 */
async function deleteProject(project) {
  try {
    await db.deleteProject(state.user.uid, project.id);
    await writeActivitySafely({ type: 'project_deleted', projectId: project.id, projectName: project.name });
    ui.hideModal();
  } catch (err) {
    ui.renderErrorBanner(normalizeError(err, 'Something went wrong. Please try again.'));
  }
}

/**
 * Writes an activity event without blocking primary actions.
 * @param {Object} eventData - Activity event.
 * @returns {Promise<void>}
 */
async function writeActivitySafely(eventData) {
  try {
    state.dashboardData.activity = buildLocalActivity(eventData);
    await db.writeActivityLog(state.user.uid, eventData);
  } catch (err) {
    return;
  }
}

/**
 * Builds local activity entries for the dashboard.
 * @param {Object} eventData - Activity event.
 * @returns {Array} Updated activity list.
 */
function buildLocalActivity(eventData) {
  const activity = { ...eventData, timestamp: new Date() };
  return [activity, ...(state.dashboardData.activity || [])].slice(0, 8);
}

/**
 * Builds task data from a modal form.
 * @param {HTMLFormElement} form - Task form.
 * @returns {Object} Task data.
 */
function buildTaskDataFromForm(form) {
  return {
    title: getFormValue(form, 'title'),
    description: getFormValue(form, 'description'),
    dueDate: parseDueDate(getFormValue(form, 'dueDate')),
    priority: getFormValue(form, 'priority') || DEFAULT_PRIORITY,
    category: getFormValue(form, 'category'),
    status: getFormValue(form, 'status') || STATUS_TODO
  };
}

/**
 * Gets a named form control value.
 * @param {HTMLFormElement} form - Form element.
 * @param {string} name - Control name.
 * @returns {string} Trimmed value.
 */
function getFormValue(form, name) {
  const field = form.elements[name];
  return field ? String(field.value || '').trim() : '';
}

/**
 * Parses a date input value.
 * @param {string} value - Date input value.
 * @returns {Date|null} Date object or null.
 */
function parseDueDate(value) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
}

/**
 * Validates task data before db writes.
 * @param {Object} taskData - Task data.
 * @returns {void}
 * @throws {string} Human-readable validation error.
 */
function validateTaskData(taskData) {
  if (!taskData.title) {
    throw 'Please enter a task title.';
  }

  if (!VALID_PRIORITIES_APP.includes(taskData.priority) || !VALID_STATUSES_APP.includes(taskData.status)) {
    throw 'Something went wrong. Please try again.';
  }
}

/**
 * Gets the project form name value.
 * @param {HTMLFormElement} form - Project form.
 * @returns {string} Project name.
 */
function getProjectFormName(form) {
  return getFormValue(form, 'projectName');
}

/**
 * Gets the task being edited from current state.
 * @param {HTMLFormElement} form - Task form.
 * @returns {Object|null} Existing task or null.
 */
function getEditingTask(form) {
  if (!currentEditingTaskId) {
    return null;
  }

  return state.tasks.find((task) => task.id === currentEditingTaskId) || null;
}

/**
 * Sets a task form validation message.
 * @param {HTMLFormElement} form - Task form.
 * @param {string} message - Validation message.
 * @returns {void}
 */
function setTaskFormError(form, message) {
  const error = form.querySelector('[data-task-error="title"]');

  if (error) {
    error.textContent = message;
  }
}

/**
 * Sets a project form validation message.
 * @param {HTMLFormElement} form - Project form.
 * @param {string} message - Validation message.
 * @returns {void}
 */
function setProjectFormError(form, message) {
  const error = form.querySelector('[data-project-error="name"]');

  if (error) {
    error.textContent = message;
  }
}

/**
 * Finds a project by ID.
 * @param {string} projectId - Project ID.
 * @returns {Object|null} Matching project or null.
 */
function findProject(projectId) {
  return state.projects.find((project) => project.id === projectId) || null;
}

/**
 * Finds a task by ID in active and dashboard task state.
 * @param {string} taskId - Task ID.
 * @param {string} [projectId] - Optional project ID.
 * @returns {Object|null} Matching task or null.
 */
function findTask(taskId, projectId) {
  const allTasks = [...state.tasks, ...dashboardTasks];
  return allTasks.find((task) => {
    const matchesTask = task.id === taskId;
    const matchesProject = !projectId || task.projectId === projectId || state.currentProjectId === projectId;
    return matchesTask && matchesProject;
  }) || null;
}

/**
 * Enriches all projects with dashboard task counts.
 * @param {Array} projects - Project records.
 * @returns {Array} Enriched project records.
 */
function enrichProjects(projects) {
  return (projects || []).map((project) => enrichProject(project));
}

/**
 * Enriches one project with dashboard task counts.
 * @param {Object} project - Project record.
 * @returns {Object} Enriched project record.
 */
function enrichProject(project) {
  const tasks = dashboardTasks.filter((task) => task.projectId === project.id);

  return {
    ...project,
    taskCount: tasks.length,
    completedCount: tasks.filter((task) => task.status === STATUS_DONE).length
  };
}

/**
 * Synchronizes in-app notification state from tasks.
 * @param {Array} tasks - Dashboard tasks.
 * @returns {void}
 */
function syncNotifications(tasks) {
  const newNotifications = buildTaskNotifications(tasks || []);

  newNotifications.forEach((notification) => {
    state.notifications.unshift(notification);
    notifyBrowser(notification);
  });

  state.notifications = state.notifications.slice(0, 20);
  updateNotificationUi();
}

/**
 * Builds newly detected due task notifications.
 * @param {Array} tasks - Dashboard tasks.
 * @returns {Array} New notifications.
 */
function buildTaskNotifications(tasks) {
  return tasks
    .filter((task) => task.status !== STATUS_DONE && (isBeforeToday(task.dueDate) || isToday(task.dueDate)))
    .map((task) => buildTaskNotification(task))
    .filter(Boolean);
}

/**
 * Builds a notification for a task if it has not been emitted.
 * @param {Object} task - Task object.
 * @returns {Object|null} Notification object or null.
 */
function buildTaskNotification(task) {
  const type = isBeforeToday(task.dueDate) ? 'overdue' : 'today';
  const key = `${type}:${task.projectId || ''}:${task.id}`;

  if (notifiedTaskKeys.has(key)) {
    return null;
  }

  notifiedTaskKeys.add(key);

  return {
    id: key,
    type,
    message: type === 'overdue' ? `${task.title} is overdue` : `${task.title} is due today`,
    timestamp: new Date(),
    read: false,
    taskId: task.id,
    projectId: task.projectId
  };
}

/**
 * Updates all notification UI surfaces.
 * @returns {void}
 */
function updateNotificationUi() {
  state.unreadCount = state.notifications.filter((notification) => !notification.read).length;
  ui.renderNotificationPanel(state.notifications);
  ui.updateNotificationBadge(state.unreadCount);
  renderNotificationAlerts();
}

/**
 * Renders unread notification alert banners.
 * @returns {void}
 */
function renderNotificationAlerts() {
  ui.renderNotificationAlerts(state.notifications.filter((notification) => !notification.read).slice(0, 3));
}

/**
 * Marks one notification as read.
 * @param {string} notificationId - Notification ID.
 * @returns {void}
 */
function markNotificationRead(notificationId) {
  state.notifications = state.notifications.map((notification) => {
    return notification.id === notificationId ? { ...notification, read: true } : notification;
  });
  updateNotificationUi();
}

/**
 * Dismisses one notification.
 * @param {string} notificationId - Notification ID.
 * @returns {void}
 */
function dismissNotification(notificationId) {
  state.notifications = state.notifications.filter((notification) => notification.id !== notificationId);
  updateNotificationUi();
}

/**
 * Clears all notifications.
 * @returns {void}
 */
function clearNotifications() {
  state.notifications = [];
  updateNotificationUi();
}

/**
 * Toggles the notification panel visibility.
 * @returns {void}
 */
function toggleNotificationPanel() {
  const panel = document.getElementById('notification-panel');

  if (panel && panel.hidden) {
    ui.showNotificationPanel();
    return;
  }

  ui.hideNotificationPanel();
}

/**
 * Sends an event-triggered browser notification when allowed.
 * @param {Object} notification - Notification object.
 * @returns {void}
 */
function notifyBrowser(notification) {
  if (!supportsGrantedNotifications()) {
    return;
  }

  try {
    new Notification('Taskly', { body: notification.message });
  } catch (err) {
    return;
  }
}

/**
 * Checks whether browser notifications are available and granted.
 * @returns {boolean} Whether notifications can be shown.
 */
function supportsGrantedNotifications() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Gets the current browser notification status.
 * @returns {string} Notification status.
 */
function getNotificationStatus() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission || 'unknown';
}

/**
 * Renders the settings view.
 * @returns {void}
 */
function renderSettings() {
  ui.renderSettingsView(state.user || {}, getNotificationStatus());
}

/**
 * Handles notification settings action.
 * @returns {void}
 */
function handleNotificationSettingsAction() {
  const status = getNotificationStatus();

  if (status === 'denied') {
    ui.renderErrorBanner('Notifications disabled. You can enable them in browser settings.');
  } else {
    ui.renderErrorBanner('Something went wrong. Please try again.');
  }
}

/**
 * Requests sign-out confirmation.
 * @returns {void}
 */
function requestSignOutConfirmation() {
  if (ui.showSignOutConfirmModal) {
    ui.showSignOutConfirmModal(handleSignOut);
    return;
  }

  ui.showConfirmModal(SIGN_OUT_MESSAGE, handleSignOut);
}

/**
 * Handles a browser offline transition.
 * @returns {void}
 */
function handleOffline() {
  state.isOffline = true;
  ui.showOfflineBanner();
}

/**
 * Handles a browser online transition.
 * @returns {void}
 */
function handleOnline() {
  state.isOffline = false;
  ui.hideOfflineBanner();
}

/**
 * Handles Google sign-in clicks.
 * @returns {Promise<void>}
 */
async function handleGoogleSignIn() {
  try {
    await auth.signInWithGoogle();
  } catch (err) {
    ui.renderErrorBanner(normalizeError(err, 'Sign-in failed. Please try again.'));
  }
}

/**
 * Handles auth sign-out state from auth listener.
 * @returns {void}
 */
function handleAuthSignedOut() {
  detachFirestoreListeners();
  resetSignedOutState();
  router.showView('login');
}

/**
 * Converts unknown errors to user-safe messages.
 * @param {unknown} err - Error value.
 * @param {string} fallback - Fallback message.
 * @returns {string} Safe message.
 */
function normalizeError(err, fallback) {
  return typeof err === 'string' && err ? err : fallback;
}

/**
 * Returns true if due date is before today.
 * @param {Object|null} dueDate - Date-like value.
 * @returns {boolean} Whether date is before today.
 */
function isBeforeToday(dueDate) {
  const date = toDate(dueDate);
  const today = getTodayStart();

  return date ? date < today : false;
}

/**
 * Returns true if due date is today.
 * @param {Object|null} dueDate - Date-like value.
 * @returns {boolean} Whether date is today.
 */
function isToday(dueDate) {
  const date = toDate(dueDate);

  return date ? date.toDateString() === getTodayStart().toDateString() : false;
}

/**
 * Returns true if due date is after today.
 * @param {Object|null} dueDate - Date-like value.
 * @returns {boolean} Whether date is after today.
 */
function isAfterToday(dueDate) {
  const date = toDate(dueDate);
  const tomorrow = getTodayStart();

  tomorrow.setDate(tomorrow.getDate() + 1);
  return date ? date >= tomorrow : false;
}

/**
 * Converts timestamp-like values to Date.
 * @param {Object|null} value - Timestamp, Date, string, or null.
 * @returns {Date|null} Date value or null.
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  return value.toDate ? value.toDate() : new Date(value);
}

/**
 * Gets today's start time.
 * @returns {Date} Today at midnight.
 */
function getTodayStart() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Boots the app auth and router listeners.
 * @returns {void}
 */
function boot() {
  auth.initAuthListener(init, handleAuthSignedOut);
  router.initRouter();
}

window.app = {
  init,
  handleSearch,
  handleFilter,
  handleProjectSwitch,
  handleSignOut
};

boot();
