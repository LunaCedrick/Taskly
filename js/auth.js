/**
 * auth.js - Authentication only.
 * Scope: Google Sign-In, sign-out, session persistence, and FCM permission.
 * No DOM manipulation. No Firestore read queries. No application state.
 * See: AGENTS.md section 5.
 */

/**
 * Initialises the Firebase auth state listener.
 * Calls onSignIn(user) when a user is authenticated.
 * Calls onSignOut() when no user is present.
 * @param {Function} onSignIn - Receives the Firebase user object.
 * @param {Function} onSignOut - Called when the user is null.
 * @returns {Function} Firebase unsubscribe function.
 */
function initAuthListener(onSignIn, onSignOut) {
  return firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      onSignIn(user);
      return;
    }

    onSignOut();
  });
}

/**
 * Opens the Google Sign-In popup and authenticates the user.
 * Saves the user profile and requests notification permission on first login.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
 */
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    await saveAuthenticatedProfile(user);
    await requestFirstLoginNotificationPermission(user.uid);
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Signs the current user out of Firebase Auth.
 * App.js must detach all Firestore listeners before calling this function.
 * @returns {Promise<void>}
 * @throws {string} Human-readable error message on failure.
 */
async function signOut() {
  try {
    await firebase.auth().signOut();
  } catch (err) {
    throw mapAuthError(err);
  }
}

/**
 * Saves the authenticated user's Google profile through db.js.
 * @param {Object} user - Firebase Auth user.
 * @returns {Promise<void>}
 */
async function saveAuthenticatedProfile(user) {
  const saveProfile = getDbFunction('saveUserProfile');

  if (!saveProfile) {
    throw new Error('db/save-user-profile-unavailable');
  }

  await saveProfile(user.uid, {
    name: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || ''
  });
}

/**
 * Requests notification permission once per browser after first login.
 * @param {string} userId - The authenticated user's UID.
 * @returns {Promise<void>}
 */
async function requestFirstLoginNotificationPermission(userId) {
  if (localStorage.getItem('taskly_first_login')) {
    return;
  }

  await requestNotificationPermission(userId);
  localStorage.setItem('taskly_first_login', '1');
}

/**
 * Requests browser push notification permission and saves the FCM token.
 * FCM failures never block sign-in.
 * @param {string} userId - The authenticated user's UID.
 * @returns {Promise<void>}
 */
async function requestNotificationPermission(userId) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'default') {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    await retrieveAndSaveFcmToken(userId);
  } catch (err) {
    return;
  }
}

/**
 * Retrieves the FCM token and saves it through db.js.
 * @param {string} userId - The authenticated user's UID.
 * @returns {Promise<void>}
 */
async function retrieveAndSaveFcmToken(userId) {
  const messaging = firebase.messaging();
  const token = await messaging.getToken({
    vapidKey: firebaseConfig.vapidKey
  });

  if (!token) {
    return;
  }

  await saveFcmTokenToProfile(userId, token);
}

/**
 * Saves the FCM token using the available db.js profile writer.
 * @param {string} userId - The authenticated user's UID.
 * @param {string} token - Firebase Cloud Messaging token.
 * @returns {Promise<void>}
 */
async function saveFcmTokenToProfile(userId, token) {
  const saveToken = getDbFunction('saveFcmToken') || getDbFunction('saveFCMToken');
  const saveProfile = getDbFunction('saveUserProfile');

  if (saveToken) {
    await saveToken(userId, token);
    return;
  }

  if (saveProfile) {
    await saveProfile(userId, { fcmToken: token });
  }
}

/**
 * Gets a db.js function from a future namespace or the current script global.
 * @param {string} functionName - Name of the db.js function to find.
 * @returns {Function|null} Matching db.js function or null.
 */
function getDbFunction(functionName) {
  const dbModule = window.db || {};
  return dbModule[functionName] || window[functionName] || null;
}

/**
 * Maps a Firebase Auth error to a human-readable string.
 * @param {Error} err - Firebase Auth error object.
 * @returns {string} Human-readable error message.
 */
function mapAuthError(err) {
  const code = err && err.code ? err.code : '';

  if (code === 'auth/popup-blocked') {
    return 'Google login popup was blocked. Allow popups for this site.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return '';
  }

  if (code === 'auth/network-request-failed') {
    return 'Connection lost. Check your internet.';
  }

  if (code.startsWith('auth/')) {
    return 'Sign-in failed. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Public auth API for script-tag module loading.
 * @type {{initAuthListener: Function, signInWithGoogle: Function, signOut: Function}}
 */
window.auth = {
  initAuthListener,
  signInWithGoogle,
  signOut
};
