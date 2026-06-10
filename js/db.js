/**
 * db.js - Firestore operations only.
 * Scope: All reads, writes, and real-time listeners.
 * No DOM access. No UI rendering. No application state.
 * See: AGENTS.md sections 5 and 6.
 */

/**
 * Creates a new project document in Firestore.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} name - Project name.
 * @returns {Promise<string>} New project document ID.
 */
async function createProject(userId, name) {
  // TODO: Session 4.
}

/**
 * Listens to the user's projects collection in real time.
 * @param {string} userId - Firebase Auth UID.
 * @param {Function} callback - Called with project data on every change.
 * @returns {Function|null} Unsubscribe function to store in state.listeners.
 */
function getProjects(userId, callback) {
  // TODO: Session 4.
  return null;
}

/**
 * Updates an existing project document.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Project document ID.
 * @param {Object} data - Fields to update.
 * @returns {Promise<void>}
 */
async function updateProject(userId, projectId, data) {
  // TODO: Session 4.
}

/**
 * Deletes an existing project document.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Project document ID.
 * @returns {Promise<void>}
 */
async function deleteProject(userId, projectId) {
  // TODO: Session 4.
}

/**
 * Creates a new task document under a project.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Parent project document ID.
 * @param {Object} taskData - Task fields to write.
 * @returns {Promise<string>} New task document ID.
 */
async function createTask(userId, projectId, taskData) {
  // TODO: Session 4. Every task must include userId.
}

/**
 * Listens to a project's tasks collection in real time.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Parent project document ID.
 * @param {Function} callback - Called with task data on every change.
 * @returns {Function|null} Unsubscribe function to store in state.listeners.
 */
function getTasks(userId, projectId, callback) {
  // TODO: Session 4.
  return null;
}

/**
 * Listens to all user tasks with a collection group query.
 * @param {string} userId - Firebase Auth UID.
 * @param {Function} callback - Called with dashboard task data.
 * @returns {Function|null} Unsubscribe function to store in state.listeners.
 */
function getDashboardTasks(userId, callback) {
  // TODO: Session 4.
  return null;
}

/**
 * Updates an existing task document.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Parent project document ID.
 * @param {string} taskId - Task document ID.
 * @param {Object} data - Fields to update.
 * @returns {Promise<void>}
 */
async function updateTask(userId, projectId, taskId, data) {
  // TODO: Session 4.
}

/**
 * Deletes an existing task document.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Parent project document ID.
 * @param {string} taskId - Task document ID.
 * @returns {Promise<void>}
 */
async function deleteTask(userId, projectId, taskId) {
  // TODO: Session 4.
}

/**
 * Updates a task completion state.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} projectId - Parent project document ID.
 * @param {string} taskId - Task document ID.
 * @param {boolean} isDone - Whether the task is complete.
 * @returns {Promise<void>}
 */
async function completeTask(userId, projectId, taskId, isDone) {
  // TODO: Session 4.
}

/**
 * Writes an activity log event.
 * @param {string} userId - Firebase Auth UID.
 * @param {Object} event - Activity event payload.
 * @returns {Promise<void>}
 */
async function writeActivityLog(userId, event) {
  // TODO: Session 4.
}

/**
 * Gets a user's profile document.
 * @param {string} userId - Firebase Auth UID.
 * @returns {Promise<Object|null>} User profile data or null.
 */
async function getUserProfile(userId) {
  // TODO: Session 4.
  return null;
}

/**
 * Saves profile data to the user's profile document.
 * @param {string} userId - Firebase Auth UID.
 * @param {Object} profileData - Profile fields to save.
 * @returns {Promise<void>}
 */
async function saveUserProfile(userId, profileData) {
  // TODO: Session 4.
}

/**
 * Enables Firestore offline persistence.
 * @returns {Promise<void>}
 */
async function enableOfflinePersistence() {
  // TODO: Session 4.
}
