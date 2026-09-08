const QRCode = require('qrcode');
const { getStatus } = require('../whatsappClient');
const { sanitizeUserId } = require('../sessionManager');
const {
  renderConnectedPage,
  renderInitializingPage,
  renderQRPage,
} = require('../views/qrTemplate');

function getUserIdFromReq(req) {
  return req.query?.userId || req.headers?.['x-user-id'] || 'default';
}

/**
 * Render browser HTML QR page
 */
async function getQRHandler(req, res) {
  const userId = sanitizeUserId(getUserIdFromReq(req));
  const { connectionStatus, clientPhone, currentQR } = getStatus(userId);

  if (connectionStatus === 'connected') {
    return res.send(renderConnectedPage(clientPhone || 'Linked User'));
  }

  if (!currentQR) {
    return res.send(renderInitializingPage());
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(currentQR, { width: 320, margin: 2 });
    res.send(renderQRPage(qrDataUrl));
  } catch (err) {
    res.status(500).send('Error rendering QR code: ' + err.message);
  }
}

/**
 * Return raw QR code string and session state as JSON
 * Used directly by the React Native mobile app to display QR on device
 */
async function getQRDataHandler(req, res) {
  const userId = sanitizeUserId(getUserIdFromReq(req));
  const { connectionStatus, clientPhone, currentQR } = getStatus(userId);

  let qrDataUrl = null;
  if (currentQR) {
    try {
      qrDataUrl = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
    } catch (e) {}
  }

  res.json({
    userId,
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    user: clientPhone ? `+${clientPhone}` : null,
    qrRaw: currentQR,
    qrDataUrl,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getQRHandler,
  getQRDataHandler,
};
