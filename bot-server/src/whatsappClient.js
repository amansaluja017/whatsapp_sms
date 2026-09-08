const {
  getSession,
  initSession,
  sanitizeUserId,
} = require('./sessionManager');

/**
 * Initialize the default session on server boot
 */
function initClient(userId = 'default') {
  return initSession(userId);
}

/**
 * Get status of a specific user session (defaults to 'default')
 */
function getStatus(rawUserId = 'default') {
  const userId = sanitizeUserId(rawUserId);
  const session = getSession(userId, true);

  return {
    userId,
    connectionStatus: session?.connectionStatus || 'initializing',
    currentQR: session?.currentQR || null,
    clientPhone: session?.clientPhone || null,
    userJid: session?.userJid || null,
  };
}

module.exports = {
  initClient,
  getStatus,
};
