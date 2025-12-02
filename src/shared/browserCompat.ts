/**
 * Browser API polyfill for cross-browser compatibility
 * Provides a unified `browser` API that works in Chrome, Firefox, and Edge
 */

// @ts-ignore - globalThis.browser may not exist in Chrome
export const browser = globalThis.browser || globalThis.chrome;

/**
 * Send a message and wait for response (works across browsers)
 */
export async function sendMessage(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(message, (response: any) => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Get from storage (works across browsers)
 */
export async function getStorage(keys: string | string[] | null): Promise<any> {
  return new Promise((resolve, reject) => {
    browser.storage.local.get(keys, (result: any) => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Set storage (works across browsers)
 */
export async function setStorage(items: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    browser.storage.local.set(items, () => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Check if running in Firefox
 */
export function isFirefox(): boolean {
  return typeof browser !== 'undefined' && browser.runtime.getURL('').startsWith('moz-extension://');
}

/**
 * Check if running in Chrome/Edge
 */
export function isChrome(): boolean {
  return typeof chrome !== 'undefined' && chrome.runtime.getURL('').startsWith('chrome-extension://');
}

/**
 * Get browser name
 */
export function getBrowserName(): 'firefox' | 'chrome' | 'edge' | 'unknown' {
  if (isFirefox()) return 'firefox';
  if (isChrome()) {
    // Detect Edge
    // @ts-ignore
    if (navigator.userAgent.includes('Edg/')) return 'edge';
    return 'chrome';
  }
  return 'unknown';
}

console.log(`[Ad Mirror] Running on ${getBrowserName()}`);

