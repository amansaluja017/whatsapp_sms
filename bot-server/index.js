const express = require('express');
const cors = require('cors');
const { PORT } = require('./src/config');
const { client, initClient } = require('./src/whatsappClient');
const routes = require('./src/routes');

// Global process error handlers to prevent unexpected exits
process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ Intercepted unhandledRejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.warn('⚠️ Intercepted uncaughtException:', err?.message || err);
});

// Graceful cleanup on exit
const cleanExit = async () => {
  console.log('🛑 Shutting down WhatsApp client cleanly...');
  try {
    if (client) await client.destroy();
  } catch (e) {}
  process.exit(0);
};
process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

const app = express();
app.use(cors());
app.use(express.json());

// Mount modular API routes
app.use('/', routes);

// Initialize WhatsApp Client (Puppeteer & LocalAuth)
initClient();

// Start HTTP Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 WhatsApp Bot HTTP Server listening on port ${PORT} (0.0.0.0:${PORT})`);
});
