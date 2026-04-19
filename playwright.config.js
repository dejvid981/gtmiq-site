const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3999',
    headless: true,
    screenshot: 'off',
  },
  webServer: {
    command: 'npx serve . -l 3999 -s',
    port: 3999,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'Desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'Mobile', use: { viewport: { width: 375, height: 812 } } },
  ],
});
