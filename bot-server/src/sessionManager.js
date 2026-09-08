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
 * Clean and normalize a JID by removing device identifiers (:0, :1, etc.)
 * e.g. "919306234357:2@s.whatsapp.net" -> "919306234357@s.whatsapp.net"
 */
function normalizeJid(jid = '') {
  if (!jid || typeof jid !== 'string') return '';
  if (jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid === 'status@broadcast') {
    return jid;
  }
  const [userPart, serverPart] = jid.split('@');
  if (!serverPart) return jid;
  const cleanUser = userPart.split(':')[0];
  return `${cleanUser}@${serverPart}`;
}

/**
 * Extract clean international phone number from a JID
 * e.g. "919306234357:2@s.whatsapp.net" -> "+919306234357"
 */
function extractPhoneNumber(jid = '') {
  if (!jid || typeof jid !== 'string') return null;
  if (jid.endsWith('@g.us') || jid.endsWith('@newsletter') || jid.endsWith('@lid') || jid === 'status@broadcast') {
    return null;
  }
  const userPart = jid.split('@')[0];
  const digits = userPart.split(':')[0].replace(/[^\d]/g, '');
  return digits && digits.length >= 7 ? `+${digits}` : null;
}

/**
 * Record or update a contact in session state
 */
function recordContact(session, contact) {
  if (!contact || !contact.id) return;
  const rawJid = contact.id;
  if (rawJid === 'status@broadcast' || rawJid.endsWith('@newsletter')) return;

  const jid = normalizeJid(rawJid);
  const isGroup = jid.endsWith('@g.us');
  const extractedPhone = isGroup ? null : extractPhoneNumber(jid);
  const phone = contact.phoneNumber ? `+${contact.phoneNumber.replace(/[^\d]/g, '')}` : extractedPhone;
  const name = (contact.name || contact.notify || contact.verifiedName || '').trim();

  const existing = session.contacts.get(jid) || {};
  session.contacts.set(jid, {
    ...existing,
    id: jid,
    name: name || existing.name || '',
    notify: (contact.notify || existing.notify || '').trim(),
    phone: phone || existing.phone || null,
  });

  // Track LID to real JID mapping if provided
  if (contact.lid) {
    session.lidMap.set(normalizeJid(contact.lid), jid);
  }
}

/**
 * Record or update a chat in session state
 */
function recordChat(session, chat) {
  if (!chat || !chat.id) return;
  const rawJid = chat.id;
  if (rawJid === 'status@broadcast' || rawJid.endsWith('@newsletter')) return;

  const jid = normalizeJid(rawJid);
  const isGroup = jid.endsWith('@g.us');
  const chatName = (chat.name || chat.subject || '').trim();
  const timestamp = chat.conversationTimestamp ? Number(chat.conversationTimestamp) * 1000 : 0;

  const existing = session.chats.get(jid) || {};
  session.chats.set(jid, {
    ...existing,
    id: jid,
    name: chatName || existing.name || '',
    isGroup,
    unreadCount: chat.unreadCount || existing.unreadCount || 0,
    timestamp: Math.max(timestamp, existing.timestamp || 0),
    lastMessage: existing.lastMessage || '',
  });
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
    lidMap: new Map(),      // Map<lidJid, phoneJid>
    lastUpdated: Date.now(),
  };
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
    syncFullHistory: true, // Sync full contact and chat history from WhatsApp
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

      // Pre-warm groups and contacts in background
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

  // Handle Initial History Sync (This is where WhatsApp transmits all past contacts & chats!)
  sock.ev.on('messaging-history.set', ({ chats: histChats, contacts: histContacts, messages: histMessages }) => {
    console.log(`📋 [User: ${userId}] Received WhatsApp history sync: ${histContacts?.length || 0} contacts, ${histChats?.length || 0} chats`);

    for (const c of histContacts || []) {
      recordContact(session, c);
    }
    for (const ch of histChats || []) {
      recordChat(session, ch);
    }
    for (const m of histMessages || []) {
      handleIncomingMessage(session, m);
    }
  });

  // Handle live contact updates
  sock.ev.on('contacts.set', (contactsList) => {
    for (const c of contactsList || []) {
      recordContact(session, c);
    }
  });

  sock.ev.on('contacts.upsert', (contactsList) => {
    for (const c of contactsList || []) {
      recordContact(session, c);
    }
  });

  sock.ev.on('contacts.update', (updates) => {
    for (const u of updates || []) {
      recordContact(session, u);
    }
  });

  // Handle live chat updates
  sock.ev.on('chats.set', (chatsList) => {
    for (const ch of chatsList || []) {
      recordChat(session, ch);
    }
  });

  sock.ev.on('chats.upsert', (chatsList) => {
    for (const ch of chatsList || []) {
      recordChat(session, ch);
    }
  });

  sock.ev.on('chats.update', (updates) => {
    for (const u of updates || []) {
      recordChat(session, u);
    }
  });

  // Handle privacy LID to Phone mapping
  sock.ev.on('chats.phoneNumberShare', ({ lid, jid }) => {
    if (lid && jid) {
      session.lidMap.set(normalizeJid(lid), normalizeJid(jid));
    }
  });

  // Track incoming / outgoing messages for recent activity & pushNames
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages || []) {
      handleIncomingMessage(session, m);
    }
  });

  return session;
}

function handleIncomingMessage(session, m) {
  const rawJid = m.key?.remoteJid;
  if (!rawJid || rawJid === 'status@broadcast' || rawJid.endsWith('@newsletter')) return;

  const jid = normalizeJid(rawJid);
  const isGroup = jid.endsWith('@g.us');
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const timestamp = m.messageTimestamp ? Number(m.messageTimestamp) * 1000 : Date.now();

  // If this message has a pushName, save it for contact name resolution!
  if (m.pushName && !isGroup) {
    const existingContact = session.contacts.get(jid) || {};
    const hasRealName = existingContact.name && existingContact.name !== existingContact.phone;
    session.contacts.set(jid, {
      ...existingContact,
      id: jid,
      name: hasRealName ? existingContact.name : m.pushName,
      notify: m.pushName,
      phone: existingContact.phone || extractPhoneNumber(jid),
    });
  }

  const existingChat = session.chats.get(jid) || {};
  session.chats.set(jid, {
    ...existingChat,
    id: jid,
    isGroup,
    lastMessage: text ? text.slice(0, 80) : existingChat.lastMessage || '',
    timestamp: Math.max(timestamp, existingChat.timestamp || 0),
  });
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
    // 1. Fetch all participating groups from WhatsApp
    const groups = await session.sock.groupFetchAllParticipating();
    for (const [gid, gdata] of Object.entries(groups || {})) {
      const normalizedGid = normalizeJid(gid);
      session.chats.set(normalizedGid, {
        id: normalizedGid,
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

  // Merge all unique JIDs from both chats and contacts
  const allJids = new Set([
    ...session.chats.keys(),
    ...session.contacts.keys(),
  ]);

  for (const rawJid of allJids) {
    let jid = normalizeJid(rawJid);
    if (!jid || seenIds.has(jid)) continue;
    if (jid.endsWith('@newsletter') || jid === 'status@broadcast') continue;

    // Resolve LID privacy JID to real phone JID if mapped
    if (jid.endsWith('@lid') && session.lidMap.has(jid)) {
      jid = session.lidMap.get(jid);
      if (seenIds.has(jid)) continue;
    }

    seenIds.add(jid);

    const isGroup = jid.endsWith('@g.us');
    const chat = session.chats.get(jid) || {};
    const contact = session.contacts.get(jid) || {};

    // Extract exact phone number without device suffixes
    const phone = isGroup ? null : (contact.phone || extractPhoneNumber(jid));

    // Choose the best human-readable name:
    // 1) Saved contact name (from address book)
    // 2) Group subject
    // 3) WhatsApp notify / pushName
    // 4) Clean formatted phone number e.g. +919876543210
    // 5) Fallback 'Contact'
    let name = '';
    if (isGroup) {
      name = chat.name || contact.name || 'WhatsApp Group';
    } else {
      const candidateName = contact.name || contact.notify || chat.name;
      name = candidateName && candidateName.trim() ? candidateName.trim() : (phone || 'Contact');
    }

    results.push({
      id: jid,
      name,
      isGroup,
      phone,
      unreadCount: chat.unreadCount || 0,
      timestamp: chat.timestamp || contact.timestamp || 0,
      lastMessage: chat.lastMessage || '',
    });
  }

  // Sort by most recent activity
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

  // Normalize target JID (remove device suffix, fix legacy @c.us format)
  targetJid = normalizeJid(targetJid);
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
      contactsCount: s.contacts?.size || 0,
      chatsCount: s.chats?.size || 0,
    });
  }
  return list;
}

/**
 * Automatically discover and initialize all saved user sessions on disk,
 * as well as the 'default' session if nothing exists yet.
 */
async function initAllSavedSessions() {
  try {
    if (!fs.existsSync(AUTH_DATA_PATH)) {
      fs.mkdirSync(AUTH_DATA_PATH, { recursive: true });
    }

    const entries = fs.readdirSync(AUTH_DATA_PATH, { withFileTypes: true });
    const userDirs = entries
      .filter((ent) => ent.isDirectory())
      .map((ent) => sanitizeUserId(ent.name))
      .filter(Boolean);

    // Always include 'default' session
    if (!userDirs.includes('default')) {
      userDirs.push('default');
    }

    console.log(`🔍 [SessionManager] Initializing ${userDirs.length} user session(s): [${userDirs.join(', ')}]`);

    for (const uId of userDirs) {
      initSession(uId).catch((err) => {
        console.error(`[SessionManager] Failed to init session "${uId}":`, err.message);
      });
    }
  } catch (err) {
    console.error('[SessionManager] Error discovering saved sessions:', err);
    initSession('default').catch(() => {});
  }
}

module.exports = {
  getSession,
  initSession,
  initAllSavedSessions,
  syncSessionChats,
  getFormattedChats,
  sendSessionMessage,
  listAllSessions,
  sanitizeUserId,
  normalizeJid,
  extractPhoneNumber,
};
