/**
 * Reddit Detection Plugin - v2.0
 * Uses the layered detection pipeline
 */

import { DetectionPlugin } from '../../shared/types/platform';
import { PlatformSelectorConfig, AdCandidate, AdDetectionPayload } from '../../shared/types/detection';
import { detectAds } from '../engine/detector';

const seenContainers = new WeakSet<HTMLElement>();
let observer: MutationObserver | null = null;
let config: PlatformSelectorConfig | null = null;
let detectTimeout: number | null = null;

export function createRedditPlugin(): DetectionPlugin {
  return {
    id: 'reddit',
    
    matchHostname(hostname: string): boolean {
      return hostname.includes('reddit.com');
    },
    
    init(platformConfig: any): void {
      config = platformConfig as PlatformSelectorConfig;
      console.log('[Reddit Plugin v2] Initializing with layered detection pipeline');
      
      if (config.debug) {
        console.log('[Reddit Plugin v2] Config:', config);
      }
      
      // Start observing DOM changes
      observer = new MutationObserver(throttledDetect);
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Initial detection
      detectRedditAds();
    },
    
    teardown(): void {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      
      if (detectTimeout) {
        clearTimeout(detectTimeout);
        detectTimeout = null;
      }
      
      config = null;
      console.log('[Reddit Plugin v2] Teardown complete');
    },
  };
}

/**
 * Throttled detection to avoid excessive processing
 */
function throttledDetect() {
  if (detectTimeout) return;
  
  detectTimeout = window.setTimeout(() => {
    detectRedditAds();
    detectTimeout = null;
  }, 500);
}

/**
 * Main detection function using the layered pipeline
 */
function detectRedditAds() {
  if (!config) {
    console.warn('[Reddit Plugin v2] No config available');
    return;
  }
  
  try {
    // Run the three-phase detection pipeline
    const candidates = detectAds(config, seenContainers);
    
    console.log(`[Reddit Plugin v2] Detected ${candidates.length} new ads`);
    
    // Send each valid candidate to background
    for (const candidate of candidates) {
      sendAdCandidate(candidate);
    }
    
  } catch (error) {
    console.error('[Reddit Plugin v2] Detection error:', error);
  }
}

/**
 * Convert AdCandidate to payload and send to background
 */
function sendAdCandidate(candidate: AdCandidate) {
  const { fields, validation, platform, detectedAt, pageUrl, placement, containerMatch } = candidate;
  
  const payload: AdDetectionPayload = {
    platform,
    pageUrl,
    placement,
    advertiserName: fields.advertiser,
    advertiserHandle: fields.advertiserHandle,
    labelText: fields.label || 'Promoted',
    creativeText: buildCreativeText(fields),
    destinationUrl: fields.destinationUrl,
    mediaUrls: [...(fields.images || []), ...(fields.videos || [])].slice(0, 3),
    confidence: validation.confidence,
    containerRuleId: containerMatch.ruleId,
    detectedAt,
  };
  
  if (config?.debug) {
    console.log('[Reddit Plugin v2] Sending ad candidate:', payload);
  }
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'AD_CANDIDATE',
    payload: convertToLegacyPayload(payload),
  });
}

/**
 * Build creative text from headline and body
 */
function buildCreativeText(fields: { headline?: string; body?: string; cta?: string }): string {
  const parts: string[] = [];
  
  if (fields.headline) parts.push(fields.headline);
  if (fields.body) parts.push(fields.body);
  if (fields.cta) parts.push(`[${fields.cta}]`);
  
  return parts.join(' • ').substring(0, 2000); // Max 2000 chars
}

/**
 * Convert new payload format to legacy format for background script
 * TODO: Update background script to accept new format
 */
function convertToLegacyPayload(payload: AdDetectionPayload) {
  return {
    platform: payload.platform,
    pageUrl: payload.pageUrl,
    placement: payload.placement,
    advertiserName: payload.advertiserName,
    advertiserHandle: payload.advertiserHandle,
    text: payload.creativeText,
    mediaUrls: payload.mediaUrls,
    destUrl: payload.destinationUrl,
    sponsoredLabel: payload.labelText,
  };
}
