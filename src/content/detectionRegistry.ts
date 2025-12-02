import { DetectionPlugin, PlatformDetectionConfig } from '../shared/types/platform';
import redditConfig from './configs/reddit.json';
import googleConfig from './configs/google.json';
import twitterConfig from './configs/twitter.json';
import facebookConfig from './configs/facebook.json';

// Import platform plugins (will be created next)
import { createRedditPlugin } from './platforms/reddit';
import { createGooglePlugin } from './platforms/google';
import { createTwitterPlugin } from './platforms/twitter';
import { createFacebookPlugin } from './platforms/facebook';

// Store active plugin instance
let activePlugin: DetectionPlugin | null = null;

/**
 * Load configuration for a platform
 */
export function loadConfig(platformId: string): PlatformDetectionConfig | null {
  switch (platformId) {
    case 'reddit':
      return redditConfig as PlatformDetectionConfig;
    case 'google':
      return googleConfig as PlatformDetectionConfig;
    case 'twitter':
      return twitterConfig as PlatformDetectionConfig;
    case 'facebook':
      return facebookConfig as PlatformDetectionConfig;
    default:
      return null;
  }
}

/**
 * Create a plugin instance for a platform
 */
function createPlugin(platformId: string): DetectionPlugin | null {
  switch (platformId) {
    case 'reddit':
      return createRedditPlugin();
    case 'google':
      return createGooglePlugin();
    case 'twitter':
      return createTwitterPlugin();
    case 'facebook':
      return createFacebookPlugin();
    default:
      return null;
  }
}

/**
 * Start detection for the current page
 */
export function startDetection() {
  const hostname = location.hostname;
  console.log(`[Ad Mirror] Starting detection for ${hostname}`);

  // Find matching plugin
  const plugins = [
    { id: 'reddit', hostnames: ['reddit.com'] },
    { id: 'google', hostnames: ['google.com'] },
    { id: 'twitter', hostnames: ['twitter.com', 'x.com'] },
    { id: 'facebook', hostnames: ['facebook.com'] },
  ];

  const match = plugins.find(p =>
    p.hostnames.some(h => hostname.includes(h))
  );

  if (!match) {
    console.log(`[Ad Mirror] No plugin for ${hostname}`);
    return;
  }

  // Load config
  const config = loadConfig(match.id);
  if (!config) {
    console.error(`[Ad Mirror] No config for ${match.id}`);
    return;
  }

  // Create and initialize plugin
  const plugin = createPlugin(match.id);
  if (!plugin) {
    console.error(`[Ad Mirror] Failed to create plugin for ${match.id}`);
    return;
  }

  plugin.init(config);
  activePlugin = plugin;

  console.log(`[Ad Mirror] Initialized ${match.id} plugin`);
}

/**
 * Stop detection (cleanup)
 */
export function stopDetection() {
  if (activePlugin) {
    activePlugin.teardown();
    activePlugin = null;
  }
}

// Auto-start on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDetection);
} else {
  startDetection();
}

// Cleanup on page unload
window.addEventListener('beforeunload', stopDetection);

