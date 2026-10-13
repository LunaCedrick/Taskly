/**
 * router.js - View switching only.
 * Scope: Show or hide views based on auth state and navigation.
 * No business logic. No Firestore operations.
 * See: AGENTS.md section 5.
 */

/**
 * Shows the named view and hides all others.
 * Updates the topbar title and FAB visibility.
 * @param {string} viewName - One of login, dashboard, project, or settings.
 * @returns {void}
 */
function showView(viewName) {
  const loginEl = document.getElementById('view-login');
  const appEl = document.getElementById('view-app');
  const isAppView = viewName !== 'login';

  if (loginEl) {
    loginEl.hidden = isAppView;
  }

  if (appEl) {
    appEl.hidden = !isAppView;
  }

  if (!isAppView) {
    updateFabVisibility(viewName);
    return;
  }

  hideInactiveContentViews(viewName);
  setTopbarTitle(getTitleForView(viewName));
  updateFabVisibility(viewName);
}

/**
 * Sets the topbar title text.
 * Called by showView() and by app.js when a project name changes.
 * @param {string} title - Display title for the current view.
 * @returns {void}
 */
function setTopbarTitle(title) {
  const el = document.getElementById('topbar-title');

  if (el) {
    el.textContent = title;
  }
}

/**
 * Initialises the router on page load.
 * Reads the current Firebase auth state and shows the correct view immediately.
 * @returns {void}
 */
function initRouter() {
  const hasFirebaseAuth = window.firebase && firebase.auth;
  const user = hasFirebaseAuth ? firebase.auth().currentUser : null;

  showView(user ? 'dashboard' : 'login');
}

/**
 * Hides inactive app content sections and shows the requested section.
 * @param {string} viewName - Active app view name.
 * @returns {void}
 */
function hideInactiveContentViews(viewName) {
  const viewNames = ['dashboard', 'project', 'settings'];

  viewNames.forEach((name) => {
    const el = document.getElementById(`view-${name}`);

    if (el) {
      el.hidden = name !== viewName;
    }
  });
}

/**
 * Updates floating action button visibility for the active view.
 * @param {string} viewName - Active view name.
 * @returns {void}
 */
function updateFabVisibility(viewName) {
  const fab = document.getElementById('fab-add-task');

  if (fab) {
    fab.hidden = viewName !== 'dashboard' && viewName !== 'project';
  }
}

/**
 * Returns the default topbar title for a given view name.
 * Project view returns a placeholder until app.js sets the project name.
 * @param {string} viewName - Active view name.
 * @returns {string} Default title for the active view.
 */
function getTitleForView(viewName) {
  const titles = {
    dashboard: 'Dashboard',
    project: 'Project',
    settings: 'Settings'
  };

  return titles[viewName] || '';
}

/**
 * Public router API for script-tag module loading.
 * @type {{showView: Function, setTopbarTitle: Function, initRouter: Function}}
 */
window.router = {
  showView,
  setTopbarTitle,
  initRouter
};
