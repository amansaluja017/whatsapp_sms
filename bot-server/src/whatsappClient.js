const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { AUTH_DATA_PATH, PUPPETEER_CONFIG, PORT } = require('./config');

let currentQR = null;
let connectionStatus = 'initializing'; // 'initializing', 'qr_ready', 'connecting', 'connected', 'disconnected'
let botUser = null;

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: AUTH_DATA_PATH,
  }),
  puppeteer: PUPPETEER_CONFIG,
});

// Event: QR code received
client.on('qr', (qr) => {
  currentQR = qr;
  connectionStatus = 'qr_ready';
  console.log('\n📱 Scan this QR code with WhatsApp on your phone:');
  console.log('(Open WhatsApp > Linked Devices > Link a Device)\n');
  qrcodeTerminal.generate(qr, { small: true });
  console.log(`\n💡 Or view QR code in browser: http://localhost:${PORT}/qr\n`);
});

// Event: Client is ready to send messages
client.on('ready', async () => {
  connectionStatus = 'connected';
  currentQR = null;
  botUser = client.info;
  const userPhone = client.info?.wid?.user || 'Unknown';
  console.log(`\n✅ WhatsApp Bot successfully connected! Logged in as: +${userPhone}\n`);
});

// Event: Authenticated successfully
client.on('authenticated', () => {
  console.log('🔑 WhatsApp authentication successful! Initializing chat sync...');
  connectionStatus = 'connecting';
  currentQR = null;
});

// Event: Authentication failed
client.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp authentication failure:', msg);
  connectionStatus = 'disconnected';
});

// Event: Disconnected
client.on('disconnected', (reason) => {
  console.warn('⚠️ WhatsApp client disconnected:', reason);
  connectionStatus = 'disconnected';
  currentQR = null;
  setTimeout(() => {
    console.log('🔄 Reconnecting WhatsApp client...');
    client.initialize().catch(console.error);
  }, 5000);
});

function initClient() {
  console.log('\n=============================================');
  console.log('  🚀 Starting WhatsApp Bot Service (whatsapp-web.js)...');
  console.log('=============================================\n');

  client.initialize().catch((err) => {
    console.error('Failed to initialize WhatsApp client:', err);
    connectionStatus = 'disconnected';
  });
}

function getStatus() {
  return {
    connectionStatus,
    currentQR,
    botUser: botUser || client.info,
    clientPhone: client.info?.wid?.user || botUser?.wid?.user || null,
  };
}

module.exports = {
  client,
  initClient,
  getStatus,
};
