/**
 * auth.js - Authentication only.
 * Scope: Google Sign-In, sign-out, session, and FCM permission.
 * No DOM manipulation. No Firestore read queries.
 * See: AGENTS.md section 5.
 */

/**
 * Signs the user in with Google via Firebase Auth popup.
 * @returns {Promise<void>}
 */
async function signInWithGoogle() {
  // TODO: Session 2.
}

/**
 * Signs the current user out.
 * @returns {Promise<void>}
 */
async function signOut() {
  // TODO: Session 2.
}

/**
 * Returns the current authenticated Firebase user.
 * @returns {Object|null} Current Firebase Auth user or null.
 */
function getCurrentUser() {
  // TODO: Session 2.
  return null;
}

/**
 * Registers an auth state listener for router.js.
 * @param {Function} callback - Receives the current user or null.
 * @returns {Function|null} Firebase unsubscribe function when implemented.
 */
function listenToAuthState(callback) {
  // TODO: Session 2.
  return null;
}

/**
 * Requests browser notification permission on first login.
 * @returns {Promise<void>}
 */
async function requestNotificationPermission() {
  // TODO: Session 2.
}

/**
 * Saves the FCM token to the current user's profile document.
 * @param {string} userId - Firebase Auth UID.
 * @param {string} token - Firebase Cloud Messaging token.
 * @returns {Promise<void>}
 */
async function saveFCMToken(userId, token) {
  // TODO: Session 2.
}
