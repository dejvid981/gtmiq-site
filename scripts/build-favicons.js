// Generates favicon.png (64x64) + apple-touch-icon.png (180x180) from favicon-template.html
// Run: node scripts/build-favicons.js

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIZES = [
  { width: 64, height: 64, out: 'favicon.png' },
  { width: 180, height: 180, out: 'apple-touch-icon.png' },
];

async function main() {
  const browser = await chromium.launch();
  const htmlPath = path.join(__dirname, 'favicon-template.html').replace(/\\/g, '/');

  for (const { width, height, out } of SIZES) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2, // retina
    });
    const page = await context.newPage();
    await page.goto(`file:///${htmlPath}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const outputPath = path.join(__dirname, '..', out);
    await page.screenshot({ path: outputPath, fullPage: false, type: 'png' });
    console.log(`Generated ${out} (${width}x${height})`);
    await context.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
