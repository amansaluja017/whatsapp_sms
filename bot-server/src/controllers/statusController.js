const { getStatus } = require('../whatsappClient');
const { PORT } = require('../config');

function getStatusHandler(req, res) {
  const { connectionStatus, clientPhone } = getStatus();

  res.json({
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    user: clientPhone ? `+${clientPhone}` : null,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
}

function getHealthHandler(req, res) {
  const { connectionStatus } = getStatus();
  res.json({ ok: true, status: connectionStatus });
}

module.exports = {
  getStatusHandler,
  getHealthHandler,
};
