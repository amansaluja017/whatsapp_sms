# WhatsApp Bot Server

Self-hosted WhatsApp Bot server for automated messaging, built with [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) and Express.js.

## Features
- **No Meta Cloud API Needed**: Directly links to any WhatsApp account via multi-device QR code.
- **Persistent Session**: Log in once; session credentials are saved in `auth_info_baileys/`.
- **Browser & Terminal QR Code**: View the pairing QR code directly in the terminal or visit `http://localhost:3001/qr`.
- **REST Endpoints**: Simple JSON API to check status and send WhatsApp messages.

---

## Getting Started

### 1. Start the Bot Server
From the root directory:
```bash
npm run bot
```
Or directly from this folder:
```bash
cd bot-server
npm start
```

### 2. Link WhatsApp
- Open WhatsApp on your phone.
- Go to **Settings** (iOS) or **Menu ⋮** (Android) -> **Linked Devices** -> **Link a Device**.
- Scan the QR code displayed in the terminal, or open **http://localhost:3001/qr** in your browser.
- Once connected, you will see `✅ WhatsApp Bot successfully connected! Logged in as: +...`.

---

## API Reference

### 1. `GET /status`
Check the connection status of the bot.
```bash
curl http://localhost:3001/status
```
Response:
```json
{
  "status": "connected",
  "connected": true,
  "user": "+1234567890",
  "port": 3001,
  "timestamp": "2026-09-06T07:20:00.000Z"
}
```

### 2. `POST /send-message`
Send a WhatsApp text message to any phone number.
```bash
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Hello from automation!"
  }'
```
Response:
```json
{
  "success": true,
  "messageId": "BAE5F92E38B23789",
  "to": "1234567890@c.us",
  "message": "Hello from automation!",
  "timestamp": "2026-09-06T07:20:05.000Z"
}
```

### 3. `GET /qr`
View the web QR code in your browser to easily scan with your phone screen.
