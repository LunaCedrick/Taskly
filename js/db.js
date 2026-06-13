/**
 * db.js - Firestore operations only.
 * Scope: CRUD writes, real-time listeners, collection group queries,
 * profile persistence, and activity logging. No DOM, UI, or state access.
 */

const VALID_PRIORITIES = ['high', 'medium', 'low', 'none'];
const VALID_STATUSES = ['todo', 'inprogress', 'done'];

/**
 * Maps a Firestore error to a human-readable message.
 * See AGENTS.md error handling rules for the database layer.
 * @param {Error} err - Firestore error object.
 * @returns {string} Human-readable error message.
 */
function mapDbError(err) {
  const code = err && err.code ? err.code : '';

  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Connection lost. Check your internet.';
  }

  if (code === 'permission-denied' || code === 'failed-precondition') {
    return 'Unable to load data. Please try again.';
  }

  if (code === 'not-found') {
    return 'This project no longer exists.';
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Sorts task objects by dueDate ascending, with undated tasks last.
 * @param {Array} tasks - Array of task objects.
 * @returns {Array} New sorted task array.
 */
function sortTasksByDueDate(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) {
      return 0;
    }

    if (!a.dueDate) {
      return 1;
    }

    if (!b.dueDate) {
      return -1;
    }

    return a.dueDate.toMillis() - b.dueDate.toMillis();
  });
}

/**
 * Creates a new project document under the user's projects collection.
 * Validates the name is non-empty and not a duplicate before writing.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} name - The project name.
 * @returns {Promise<string>} The new project document ID.
 * @throws {string} Human-readable error message on failure.
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
    const existing = await projectsRef.where('name', '==', trimmedName).get();

    if (!existing.empty) {
      throw 'A project with this name already exists.';
    }

    const docRef = await projectsRef.add({
      name: trimmedName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (err) {
    if (typeof err === 'string') {
      throw err;
    }

    throw mapDbError(err);
  }
}

/**
 * Updates fields on an existing project document.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} projectId - The project document ID.
 * @param {Object} data - Fields to update.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
 */
async function updateProject(userId, projectId, data) {
  let updates = { ...data };

  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    if (!trimmedName) {
      throw 'Please enter a project name.';
    }

    updates = { ...updates, name: trimmedName };
  }

  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId)
      .update(updates);
  } catch (err) {
    throw mapDbError(err);
  }
}

/**
 * Deletes a project and all of its tasks in one batch.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} projectId - The project document ID.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
 */
async function deleteProject(userId, projectId) {
  try {
    const projectRef = db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId);
    const tasksSnapshot = await projectRef.collection('tasks').get();
    const batch = db_firestore.batch();

    tasksSnapshot.forEach((doc) => batch.delete(doc.ref));
    batch.delete(projectRef);

    await batch.commit();
  } catch (err) {
    throw mapDbError(err);
  }
}

/**
 * Listens to the user's projects collection in real time.
 * @param {string} userId - The authenticated user's UID.
 * @param {Function} callback - Called with projects and optional error.
 * @returns {Function} Unsubscribe function for app.js listener cleanup.
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
        callback([], mapDbError(err));
      }
    );
}

/**
 * Creates a new task document under the given project.
 * Always stamps userId for the dashboard collection group query.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} projectId - The parent project document ID.
 * @param {Object} taskData - Task fields to write.
 * @returns {Promise<string>} The new task document ID.
 * @throws {string} Human-readable error message on failure.
 */
async function createTask(userId, projectId, taskData) {
  const title = (taskData.title || '').trim();
  const priority = taskData.priority || DEFAULT_PRIORITY;
  const status = taskData.status || STATUS_TODO;

  if (!title) {
    throw 'Please enter a task title.';
  }

  if (!VALID_PRIORITIES.includes(priority) || !VALID_STATUSES.includes(status)) {
    throw 'Something went wrong. Please try again.';
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
        userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return docRef.id;
  } catch (err) {
    if (typeof err === 'string') {
      throw err;
    }

    throw mapDbError(err);
  }
}

/**
 * Updates fields on an existing task document.
 * Preserves userId by removing it from caller-provided partial updates.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} projectId - The parent project document ID.
 * @param {string} taskId - The task document ID.
 * @param {Object} data - Fields to update.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
 */
async function updateTask(userId, projectId, taskId, data) {
  const updates = { ...data };

  delete updates.userId;
  normalizeTaskUpdates(updates);
  updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

  try {
    await db_firestore
      .collection('users').doc(userId)
      .collection('projects').doc(projectId)
      .collection('tasks').doc(taskId)
      .update(updates);
  } catch (err) {
    if (typeof err === 'string') {
      throw err;
    }

    throw mapDbError(err);
  }
}

/**
 * Normalizes and validates mutable task fields before writes.
 * @param {Object} updates - Task fields being updated.
 * @returns {void}
 * @throws {string} Human-readable validation message on failure.
 */
function normalizeTaskUpdates(updates) {
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

  if (updates.priority !== undefined && !VALID_PRIORITIES.includes(updates.priority)) {
    throw 'Something went wrong. Please try again.';
  }

  if (updates.status !== undefined && !VALID_STATUSES.includes(updates.status)) {
    throw 'Something went wrong. Please try again.';
  }
}

/**
 * Deletes a single task document.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} projectId - The parent project document ID.
 * @param {string} taskId - The task document ID.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
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

/**
 * Listens to all tasks within a single project in real time.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} projectId - The project document ID.
 * @param {Function} callback - Called with tasks and optional error.
 * @returns {Function} Unsubscribe function for app.js listener cleanup.
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

/**
 * Listens to tasks across all projects for the current user.
 * Sorting is intentionally client-side so null dueDate values sort last.
 * @param {string} userId - The authenticated user's UID.
 * @param {Function} callback - Called with dashboard tasks and optional error.
 * @returns {Function} Unsubscribe function for app.js listener cleanup.
 */
function listenToDashboardTasks(userId, callback) {
  return db_firestore
    .collectionGroup('tasks')
    .where('userId', '==', userId)
    .onSnapshot(
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => {
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

/**
 * Saves or updates the user's profile document.
 * Uses merge so repeat logins preserve existing profile fields.
 * @param {string} userId - The authenticated user's UID.
 * @param {Object} profileData - Profile fields to save.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
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

/**
 * Saves the FCM push notification token to the user's profile.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} token - The FCM registration token.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
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

/**
 * Writes an activity log entry for the dashboard recent activity feed.
 * @param {string} userId - The authenticated user's UID.
 * @param {Object} eventData - Activity event fields.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
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

/**
 * Public database API for script-tag module loading.
 * @type {Object}
 */
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
