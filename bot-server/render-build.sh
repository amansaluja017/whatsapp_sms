#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
npm install

# Ensure Chrome is downloaded into the persisted project cache
npx puppeteer browsers install chrome
