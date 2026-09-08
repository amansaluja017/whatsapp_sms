const { client, getStatus } = require('../whatsappClient');
const { PORT } = require('../config');

async function sendMessageHandler(req, res) {
  const { phone, chatId: reqChatId, message } = req.body;

  if ((!phone && !reqChatId) || !message) {
    return res.status(400).json({
      error: 'Missing required parameters: ("chatId" or "phone") and "message" are required.',
    });
  }

  const { connectionStatus } = getStatus();

  if (connectionStatus !== 'connected') {
    return res.status(503).json({
      error: `WhatsApp Bot is not connected yet (current status: "${connectionStatus}"). Please scan the QR code first at http://localhost:${PORT}/qr`,
      status: connectionStatus,
    });
  }

  let targetChatId = reqChatId;
  if (!targetChatId && phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({
        error: `Invalid phone number format: "${phone}". Must include country code (e.g. +1234567890 or +919876543210).`,
      });
    }
    targetChatId = `${cleanPhone}@c.us`;
  }

  try {
    console.log(`📨 Sending WhatsApp message to ${targetChatId}: "${message}"`);
    const sentMsg = await client.sendMessage(targetChatId, message);
    const messageId = sentMsg?.id?._serialized || sentMsg?.id?.id || 'SENT';
    console.log(`✅ WhatsApp message delivered successfully! ID: ${messageId}`);

    res.json({
      success: true,
      messageId,
      to: targetChatId,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Failed to send WhatsApp message:', err);
    res.status(500).json({
      error: 'Failed to send WhatsApp message: ' + (err.message || String(err)),
    });
  }
}

module.exports = {
  sendMessageHandler,
};
