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

function getPuppeteerExecutablePath() {
  // 1. Explicit environment variable override
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    if (fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    console.warn(`[Config] PUPPETEER_EXECUTABLE_PATH "${process.env.PUPPETEER_EXECUTABLE_PATH}" not found. Deleting from process.env to prevent Puppeteer launcher crash.`);
    // IMPORTANT: Puppeteer internally reads process.env.PUPPETEER_EXECUTABLE_PATH even if not passed in options.
    // If it does not exist on disk, we must delete it so Puppeteer falls back to its bundled/cached binary!
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2. Check for installed system Chrome/Chromium (local Linux, Mac, Windows)
  const candidatePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 3. Resolve bundled/cached Puppeteer browser (Render / Cloud container)
  try {
    const puppeteer = require('puppeteer');
    const autoPath = puppeteer.executablePath();
    if (autoPath && fs.existsSync(autoPath)) {
      console.log(`[Config] Using bundled Puppeteer Chrome at: ${autoPath}`);
      return autoPath;
    }
  } catch (e) {
    console.warn('[Config] Puppeteer auto executablePath resolution error:', e.message);
  }

  return undefined;
}

const resolvedExecutable = getPuppeteerExecutablePath();

const PUPPETEER_CONFIG = {
  ...(resolvedExecutable ? { executablePath: resolvedExecutable } : {}),
  headless: process.env.PUPPETEER_HEADLESS !== 'false',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--single-process',
  ],
};

module.exports = {
  PORT,
  AUTH_DATA_PATH,
  PUPPETEER_CONFIG,
};
