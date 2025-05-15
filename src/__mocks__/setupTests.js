// Мокаем window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Мокаем ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Мокаем fetch
global.fetch = jest.fn();

// Мокаем URL
global.URL = jest.fn().mockImplementation((url) => ({
  protocol: url.startsWith('vless:') ? 'vless:' : 'http:',
  username: 'test-uuid',
  hostname: 'test.com',
  port: '443',
  search: '?encryption=none&security=tls&type=ws&host=test.com&path=/vless',
  hash: '#TestVPN',
}));

// Мокаем URLSearchParams
global.URLSearchParams = jest.fn().mockImplementation(() => ({
  has: jest.fn().mockReturnValue(true),
  get: jest.fn().mockImplementation((param) => {
    const params = {
      encryption: 'none',
      security: 'tls',
      type: 'ws',
      host: 'test.com',
      path: '/vless'
    };
    return params[param];
  })
})); 