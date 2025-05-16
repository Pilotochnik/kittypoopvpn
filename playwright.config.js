module.exports = {
  use: {
    baseURL: 'https://kittypoopvpn.ru',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'Desktop Chrome', use: { browserName: 'chromium' } },
    { name: 'Mobile Safari', use: { browserName: 'webkit', viewport: { width: 375, height: 667 } } }
  ]
}; 