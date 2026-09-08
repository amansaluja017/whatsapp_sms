const { sendSessionMessage, sanitizeUserId } = require('../sessionManager');

function getUserIdFromReq(req) {
  return req.body?.userId || req.query?.userId || req.headers?.['x-user-id'] || 'default';
}

async function sendMessageHandler(req, res) {
  const { phone, chatId, message } = req.body || {};
  const userId = sanitizeUserId(getUserIdFromReq(req));

  if ((!phone && !chatId) || !message) {
    return res.status(400).json({
      error: 'Missing required parameters: ("chatId" or "phone") and "message" are required.',
    });
  }

  try {
    const result = await sendSessionMessage(userId, { phone, chatId, message });
    res.json({
      success: true,
      userId,
      messageId: result.messageId,
      to: result.to,
      message: result.message,
      timestamp: result.timestamp,
    });
  } catch (err) {
    console.error(`❌ [User: ${userId}] Message delivery error:`, err.message);
    res.status(500).json({
      error: 'Failed to send WhatsApp message: ' + (err.message || String(err)),
      userId,
    });
  }
}

module.exports = {
  sendMessageHandler,
};
