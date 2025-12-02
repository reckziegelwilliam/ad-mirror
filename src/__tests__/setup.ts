/**
 * Vitest test setup
 * Runs before all tests
 */

import { vi } from 'vitest';

// Mock Chrome API with proper typing
global.chrome = {
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve()),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
      hasListeners: vi.fn(),
      getRules: vi.fn(),
      removeRules: vi.fn(),
      addRules: vi.fn(),
    },
    getURL: vi.fn((path) => `chrome-extension://mock/${path}`),
    openOptionsPage: vi.fn(() => Promise.resolve()),
  },
  storage: {
    local: {
      get: vi.fn((keys?: any) => Promise.resolve({})),
      set: vi.fn((items: any) => Promise.resolve()),
      remove: vi.fn((keys: any) => Promise.resolve()),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(() => Promise.resolve()),
  },
  permissions: {
    request: vi.fn(() => Promise.resolve(true)),
    contains: vi.fn(() => Promise.resolve(true)),
    getAll: vi.fn(() => Promise.resolve({ permissions: [], origins: [] })),
    remove: vi.fn(() => Promise.resolve(true)),
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
    onAdded: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
  },
} as any;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com',
    hostname: 'example.com',
  },
  writable: true,
});

// Suppress console logs in tests (optional)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as any;

