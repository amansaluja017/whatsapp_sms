const path = require('path');
const fs = require('fs');

// Try loading from bot-server/.env and parent .env
try {
  const dotenv = require('dotenv');
  const parentEnv = path.join(__dirname, '..', '..', '.env');
  const localEnv = path.join(__dirname, '..', '.env');

  if (fs.existsSync(parentEnv)) {
    dotenv.config({ path: parentEnv });
  }
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  }
} catch (e) {
  // dotenv optional, system env still works
}

const PORT = parseInt(process.env.PORT || '3001', 10);
const AUTH_DATA_PATH = process.env.AUTH_DATA_PATH || path.join(__dirname, '..', 'auth_info_baileys');

// Ensure base auth directory exists
if (!fs.existsSync(AUTH_DATA_PATH)) {
  try {
    fs.mkdirSync(AUTH_DATA_PATH, { recursive: true });
  } catch (err) {
    console.error('Failed to create AUTH_DATA_PATH:', err);
  }
}

module.exports = {
  PORT,
  AUTH_DATA_PATH,
};
