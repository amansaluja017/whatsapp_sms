const { client, getStatus } = require('../whatsappClient');
const { PORT } = require('../config');

async function getChatsHandler(req, res) {
  const { connectionStatus } = getStatus();

  if (connectionStatus !== 'connected') {
    return res.status(503).json({
      error: `WhatsApp Bot is not connected (current status: "${connectionStatus}"). Please scan QR code first at http://localhost:${PORT}/qr`,
      status: connectionStatus,
      chats: [],
    });
  }

  try {
    console.log('📋 Fetching chats and groups from WhatsApp...');

    let formatted = [];

    // Method 1: Direct in-memory extraction from WhatsApp Web collections
    // Bypasses groupMetadata.update which can fail or timeout
    if (client.pupPage) {
      try {
        formatted = await client.pupPage.evaluate(() => {
          const results = [];
          const seenIds = new Set();

          try {
            const collections = window.require('WAWebCollections');
            const chatModels = collections?.Chat?.getModelsArray ? collections.Chat.getModelsArray() : [];

            for (const chat of chatModels) {
              if (!chat || !chat.id) continue;
              const id = chat.id._serialized || '';
              if (!id || seenIds.has(id)) continue;
              seenIds.add(id);

              const isGroup = !!(chat.isGroup || chat.id.server === 'g.us');
              const isChannel = !!(chat.isChannel || chat.id.server === 'newsletter');
              if (isChannel) continue;

              const user = chat.id.user || '';
              const name = chat.formattedTitle || chat.name || (isGroup ? 'WhatsApp Group' : (user ? `+${user}` : 'Contact'));

              results.push({
                id,
                name,
                isGroup,
                phone: isGroup ? null : (user ? `+${user}` : null),
                unreadCount: chat.unreadCount || 0,
                timestamp: chat.t || chat.timestamp || 0,
                lastMessage: '',
              });
            }

            // Also include saved contacts from phonebook / WhatsApp
            const contactModels = collections?.Contact?.getModelsArray ? collections.Contact.getModelsArray() : [];
            for (const contact of contactModels) {
              if (!contact || !contact.id) continue;
              const id = contact.id._serialized || '';
              if (!id || seenIds.has(id)) continue;
              if (contact.isMe || contact.isGroup || contact.id.server === 'newsletter' || contact.id.server === 'lid') continue;
              const user = contact.id.user || '';
              const name = contact.name || contact.pushname || contact.formattedName || (user ? `+${user}` : '');
              if (!name) continue;

              seenIds.add(id);
              results.push({
                id,
                name,
                isGroup: false,
                phone: user ? `+${user}` : null,
                unreadCount: 0,
                timestamp: 0,
                lastMessage: '',
              });
            }
          } catch (e) {
            console.warn('In-page chat evaluation error:', e);
          }

          return results;
        });
      } catch (pageErr) {
        console.warn('pupPage evaluate error:', pageErr.message);
      }
    }

    // Method 2: Fallback to client.getChats() if direct extraction returned empty
    if (!formatted || formatted.length === 0) {
      console.log('🔄 Falling back to client.getChats()...');
      const rawChats = await client.getChats();
      formatted = (rawChats || []).map((chat) => {
        const isGroup = !!chat.isGroup;
        const id = chat.id?._serialized || '';
        const user = chat.id?.user || '';
        const name = chat.name || chat.formattedTitle || (isGroup ? 'WhatsApp Group' : (user ? `+${user}` : 'Contact'));

        return {
          id,
          name,
          isGroup,
          phone: isGroup ? null : (user ? `+${user}` : null),
          unreadCount: chat.unreadCount || 0,
          timestamp: chat.timestamp || 0,
          lastMessage: chat.lastMessage?.body ? chat.lastMessage.body.slice(0, 60) : '',
        };
      });
    }

    // Sort by most recent activity
    formatted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    console.log(`✅ Successfully loaded ${formatted.length} WhatsApp chats/groups!`);

    res.json({
      success: true,
      count: formatted.length,
      chats: formatted,
    });
  } catch (err) {
    console.error('❌ Error fetching chats from WhatsApp client:', err);
    res.status(500).json({
      error: 'Failed to fetch WhatsApp chats: ' + (err.message || String(err)),
      chats: [],
    });
  }
}

module.exports = {
  getChatsHandler,
};
