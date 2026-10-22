const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: 'smoke.spec.js', retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', {open:'never'}]],
  use: {baseURL: process.env.SMOKE_URL || 'http://127.0.0.1:8080/', trace:'retain-on-failure', screenshot:'only-on-failure'},
  webServer: process.env.SMOKE_URL ? undefined : {command:'npx http-server dist -a 127.0.0.1 -p 8080 -c-1',url:'http://127.0.0.1:8080',reuseExistingServer:false},
});
