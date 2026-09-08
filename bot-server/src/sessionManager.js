const path = require('path');
const fs = require('fs');
const qrcodeTerminal = require('qrcode-terminal');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { AUTH_DATA_PATH, PORT } = require('./config');

// In-memory registry of active multi-user sessions
// Map<userId, SessionData>
const sessions = new Map();

// Helper to sanitize userId for safe folder names
function sanitizeUserId(userId = 'default') {
  if (!userId || typeof userId !== 'string') return 'default';
  return userId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'default';
}

/**
 * Get or create a session for a given user
 */
function getSession(rawUserId = 'default', autoCreate = true) {
  const userId = sanitizeUserId(rawUserId);
  let session = sessions.get(userId);

  if (!session && autoCreate) {
    session = createSessionState(userId);
    sessions.set(userId, session);
    initSession(userId).catch((err) => {
      console.error(`[SessionManager] Failed to init session "${userId}":`, err);
    });
  }

  return session;
}

function createSessionState(userId) {
  return {
    userId,
    sock: null,
    connectionStatus: 'initializing', // 'initializing' | 'qr_ready' | 'connecting' | 'connected' | 'disconnected'
    currentQR: null,
    clientPhone: null,
    userJid: null,
    chats: new Map(),       // Map<jid, chatData>
    contacts: new Map(),    // Map<jid, contactData>
    lastUpdated: Date.now(),
  };
}

/**
 * Initialize Baileys socket for a user
 */
async function initSession(rawUserId = 'default') {
  const userId = sanitizeUserId(rawUserId);
  let session = sessions.get(userId);
  if (!session) {
    session = createSessionState(userId);
    sessions.set(userId, session);
  }

  const userAuthDir = path.join(AUTH_DATA_PATH, userId);
  if (!fs.existsSync(userAuthDir)) {
    fs.mkdirSync(userAuthDir, { recursive: true });
  }

  console.log(`\n=============================================`);
  console.log(`  🚀 Starting Baileys WhatsApp Session for "${userId}"...`);
  console.log(`=============================================\n`);

  const { state, saveCreds } = await useMultiFileAuthState(userAuthDir);
  let version = [2, 3000, 1015901307];
  try {
    const latest = await fetchLatestBaileysVersion();
    if (latest?.version) version = latest.version;
  } catch (e) {
    // Fallback to default version if offline
  }

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    browser: ['WhatsApp Automated', 'Chrome', '1.0.0'],
  });

  session.sock = sock;

  // Persist credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Monitor connection updates and QR code generation
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.currentQR = qr;
      session.connectionStatus = 'qr_ready';
      console.log(`\n📱 [User: ${userId}] WhatsApp QR code ready:`);
      console.log(`(Scan with WhatsApp > Linked Devices > Link a Device)`);
      if (userId === 'default') {
        qrcodeTerminal.generate(qr, { small: true });
      }
      console.log(`💡 View QR in browser: http://localhost:${PORT}/qr?userId=${userId}\n`);
    }

    if (connection === 'connecting') {
      session.connectionStatus = 'connecting';
    }

    if (connection === 'open') {
      session.connectionStatus = 'connected';
      session.currentQR = null;

      const userJid = sock.user?.id || '';
      session.userJid = userJid;
      session.clientPhone = userJid ? userJid.split(':')[0].replace(/@.*/, '') : null;

      console.log(`\n✅ [User: ${userId}] WhatsApp successfully connected! Logged in as: +${session.clientPhone}\n`);

      // Pre-warm groups and chats in background
      syncSessionChats(userId).catch(() => {});
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      session.connectionStatus = 'disconnected';
      session.currentQR = null;

      console.warn(`⚠️ [User: ${userId}] Connection closed (statusCode: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => {
          initSession(userId).catch((err) => {
            console.error(`[User: ${userId}] Reconnection error:`, err);
          });
        }, 4000);
      } else {
        console.log(`🗑️ [User: ${userId}] Session logged out. Cleaning up credentials...`);
        try {
          fs.rmSync(userAuthDir, { recursive: true, force: true });
        } catch (e) {}
        sessions.delete(userId);
      }
    }
  });

  // Track contacts
  sock.ev.on('contacts.upsert', (contactsList) => {
    for (const c of contactsList || []) {
      if (c && c.id) {
        session.contacts.set(c.id, {
          id: c.id,
          name: c.name || c.notify || c.verifiedName || '',
          phone: c.id.includes('@s.whatsapp.net') ? `+${c.id.replace('@s.whatsapp.net', '')}` : null,
        });
      }
    }
  });

  // Track incoming / outgoing messages for recent activity
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages || []) {
      const remoteJid = m.key?.remoteJid;
      if (!remoteJid || remoteJid === 'status@broadcast') continue;

      const isGroup = remoteJid.endsWith('@g.us');
      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';

      const existing = session.chats.get(remoteJid) || {};
      session.chats.set(remoteJid, {
        ...existing,
        id: remoteJid,
        isGroup,
        lastMessage: text.slice(0, 80),
        timestamp: m.messageTimestamp ? Number(m.messageTimestamp) * 1000 : Date.now(),
      });
    }
  });

  return session;
}

/**
 * Fetch and sync all groups and known contacts for a user
 */
async function syncSessionChats(rawUserId = 'default') {
  const userId = sanitizeUserId(rawUserId);
  const session = sessions.get(userId);
  if (!session || !session.sock || session.connectionStatus !== 'connected') {
    return [];
  }

  try {
    // 1. Fetch all participating groups
    const groups = await session.sock.groupFetchAllParticipating();
    for (const [gid, gdata] of Object.entries(groups || {})) {
      session.chats.set(gid, {
        id: gid,
        name: gdata.subject || 'WhatsApp Group',
        isGroup: true,
        phone: null,
        timestamp: gdata.creation ? gdata.creation * 1000 : Date.now(),
        unreadCount: 0,
        lastMessage: '',
      });
    }
  } catch (err) {
    console.warn(`[User: ${userId}] Group fetch warning:`, err.message);
  }

  return getFormattedChats(userId);
}

/**
 * Format chats and contacts for API consumption
 */
function getFormattedChats(rawUserId = 'default') {
  const userId = sanitizeUserId(rawUserId);
  const session = sessions.get(userId);
  if (!session) return [];

  const results = [];
  const seenIds = new Set();

  // Add recorded chats (groups and active conversations)
  for (const [jid, chat] of session.chats.entries()) {
    if (seenIds.has(jid)) continue;
    seenIds.add(jid);

    const isGroup = !!chat.isGroup || jid.endsWith('@g.us');
    const userPhone = jid.includes('@s.whatsapp.net') ? `+${jid.replace('@s.whatsapp.net', '')}` : null;
    const name = chat.name || (isGroup ? 'WhatsApp Group' : (userPhone || 'Contact'));

    results.push({
      id: jid,
      name,
      isGroup,
      phone: isGroup ? null : userPhone,
      unreadCount: chat.unreadCount || 0,
      timestamp: chat.timestamp || 0,
      lastMessage: chat.lastMessage || '',
    });
  }

  // Add saved contacts
  for (const [jid, contact] of session.contacts.entries()) {
    if (seenIds.has(jid)) continue;
    if (jid.endsWith('@newsletter') || jid.endsWith('@lid') || jid === 'status@broadcast') continue;
    seenIds.add(jid);

    const isGroup = jid.endsWith('@g.us');
    const userPhone = jid.includes('@s.whatsapp.net') ? `+${jid.replace('@s.whatsapp.net', '')}` : null;
    const name = contact.name || userPhone || 'Contact';

    results.push({
      id: jid,
      name,
      isGroup,
      phone: isGroup ? null : userPhone,
      unreadCount: 0,
      timestamp: 0,
      lastMessage: '',
    });
  }

  // Sort by recent activity
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return results;
}

/**
 * Send a WhatsApp text message through a user's session
 */
async function sendSessionMessage(rawUserId = 'default', { phone, chatId, message }) {
  const userId = sanitizeUserId(rawUserId);
  const session = sessions.get(userId);

  if (!session || !session.sock || session.connectionStatus !== 'connected') {
    throw new Error(`WhatsApp Bot for "${userId}" is not connected (status: "${session?.connectionStatus || 'offline'}"). Scan QR code first.`);
  }

  let targetJid = chatId;
  if (!targetJid && phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 7) {
      throw new Error(`Invalid phone number: "${phone}". Include country code (e.g. +919876543210).`);
    }
    targetJid = `${cleanPhone}@s.whatsapp.net`;
  }

  // Normalize legacy format e.g. "xxx@c.us" -> "xxx@s.whatsapp.net"
  if (targetJid.endsWith('@c.us')) {
    targetJid = targetJid.replace('@c.us', '@s.whatsapp.net');
  }

  console.log(`📨 [User: ${userId}] Sending WhatsApp message to ${targetJid}: "${message}"`);
  const result = await session.sock.sendMessage(targetJid, { text: message });
  const messageId = result?.key?.id || 'SENT';
  console.log(`✅ [User: ${userId}] WhatsApp message sent successfully! ID: ${messageId}`);

  return {
    messageId,
    to: targetJid,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * List all active sessions and their current statuses
 */
function listAllSessions() {
  const list = [];
  for (const [userId, s] of sessions.entries()) {
    list.push({
      userId,
      status: s.connectionStatus,
      connected: s.connectionStatus === 'connected',
      user: s.clientPhone ? `+${s.clientPhone}` : null,
      hasQR: !!s.currentQR,
    });
  }
  return list;
}

module.exports = {
  getSession,
  initSession,
  syncSessionChats,
  getFormattedChats,
  sendSessionMessage,
  listAllSessions,
  sanitizeUserId,
};
