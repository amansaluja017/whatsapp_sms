const path = require('path');

const PORT = process.env.PORT || 3001;

const AUTH_DATA_PATH = path.join(__dirname, '..', '.wwebjs_auth');

const PUPPETEER_CONFIG = {
  executablePath: '/usr/bin/google-chrome',
  headless: true,
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
