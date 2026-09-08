const { getStatus } = require('../whatsappClient');
const { listAllSessions, sanitizeUserId } = require('../sessionManager');
const { PORT } = require('../config');

function getUserIdFromReq(req) {
  return req.query?.userId || req.headers?.['x-user-id'] || req.body?.userId || 'default';
}

function getStatusHandler(req, res) {
  const userId = getUserIdFromReq(req);
  const { connectionStatus, clientPhone } = getStatus(userId);

  res.json({
    userId: sanitizeUserId(userId),
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    user: clientPhone ? `+${clientPhone}` : null,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
}

function getHealthHandler(req, res) {
  const userId = getUserIdFromReq(req);
  const { connectionStatus } = getStatus(userId);
  res.json({ ok: true, userId: sanitizeUserId(userId), status: connectionStatus });
}

function getSessionsHandler(req, res) {
  const allSessions = listAllSessions();
  res.json({
    ok: true,
    count: allSessions.length,
    sessions: allSessions,
  });
}

module.exports = {
  getStatusHandler,
  getHealthHandler,
  getSessionsHandler,
};
