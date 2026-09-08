const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to project folder
  // so cloud providers like Render persist it across build & runtime.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
