const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:8080',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx http-server . -a 127.0.0.1 -p 8080 -c-1',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
  },
});