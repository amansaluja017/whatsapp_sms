const {
  getSession,
  syncSessionChats,
  getFormattedChats,
  sanitizeUserId,
} = require('../sessionManager');

function getUserIdFromReq(req) {
  return req.query?.userId || req.headers?.['x-user-id'] || 'default';
}

async function getChatsHandler(req, res) {
  const userId = sanitizeUserId(getUserIdFromReq(req));
  const session = getSession(userId, true);

  if (!session || session.connectionStatus !== 'connected') {
    return res.status(503).json({
      error: `WhatsApp Bot for "${userId}" is not connected (current status: "${session?.connectionStatus || 'offline'}"). Scan QR code first.`,
      status: session?.connectionStatus || 'offline',
      userId,
      chats: [],
    });
  }

  try {
    console.log(`📋 [User: ${userId}] Fetching WhatsApp chats and groups...`);
    const chats = await syncSessionChats(userId);

    res.json({
      success: true,
      userId,
      count: chats.length,
      chats,
    });
  } catch (err) {
    console.error(`❌ [User: ${userId}] Error fetching chats:`, err.message);
    const cached = getFormattedChats(userId);
    res.json({
      success: true,
      userId,
      count: cached.length,
      chats: cached,
      warning: 'Live sync had partial error: ' + err.message,
    });
  }
}

module.exports = {
  getChatsHandler,
};
