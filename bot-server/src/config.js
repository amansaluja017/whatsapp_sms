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
const AUTH_DATA_PATH = process.env.AUTH_DATA_PATH || path.join(__dirname, '..', '.wwebjs_auth');

const PUPPETEER_CONFIG = {
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
  headless: process.env.PUPPETEER_HEADLESS !== 'false',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ],
};

module.exports = {
  PORT,
  AUTH_DATA_PATH,
  PUPPETEER_CONFIG,
};
