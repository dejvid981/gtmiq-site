// Generates og-image.png from scripts/og-template.html using Playwright.
// Run: node scripts/build-og.js

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Launching Chromium...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const htmlPath = path.join(__dirname, 'og-template.html').replace(/\\/g, '/');
  console.log(`Loading ${htmlPath}`);
  await page.goto(`file:///${htmlPath}`);

  // Wait for fonts to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const outputPath = path.join(__dirname, '..', 'og-image.png');
  console.log(`Screenshotting to ${outputPath}`);
  await page.screenshot({
    path: outputPath,
    fullPage: false,
    type: 'png',
  });

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
