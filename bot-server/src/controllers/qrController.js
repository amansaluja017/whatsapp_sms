const QRCode = require('qrcode');
const { getStatus } = require('../whatsappClient');
const {
  renderConnectedPage,
  renderInitializingPage,
  renderQRPage,
} = require('../views/qrTemplate');

async function getQRHandler(req, res) {
  const { connectionStatus, clientPhone, currentQR } = getStatus();

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

module.exports = {
  getQRHandler,
};
