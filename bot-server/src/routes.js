const express = require('express');
const {
  getStatusHandler,
  getHealthHandler,
  getSessionsHandler,
} = require('./controllers/statusController');
const {
  getQRHandler,
  getQRDataHandler,
} = require('./controllers/qrController');
const { getChatsHandler } = require('./controllers/chatsController');
const { sendMessageHandler } = require('./controllers/messageController');

const router = express.Router();

router.get('/status', getStatusHandler);
router.get('/health', getHealthHandler);
router.get('/sessions', getSessionsHandler);
router.get('/qr', getQRHandler);
router.get('/qr-data', getQRDataHandler);
router.get('/chats', getChatsHandler);
router.post('/send-message', sendMessageHandler);

module.exports = router;
