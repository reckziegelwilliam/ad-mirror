/**
 * Google Detection Plugin - v2.0
 * Uses the layered detection pipeline
 */

import { DetectionPlugin } from '../../shared/types/platform';
import { PlatformSelectorConfig, AdCandidate, AdDetectionPayload } from '../../shared/types/detection';
import { detectAds } from '../engine/detector';

const seenContainers = new WeakSet<HTMLElement>();
let observer: MutationObserver | null = null;
let config: PlatformSelectorConfig | null = null;
let detectTimeout: number | null = null;

export function createGooglePlugin(): DetectionPlugin {
  return {
    id: 'google',
    
    matchHostname(hostname: string): boolean {
      return hostname.includes('google.com');
    },
    
    init(platformConfig: any): void {
      config = platformConfig as PlatformSelectorConfig;
      console.log('[Google Plugin v2] Initializing with layered detection pipeline');
      
      if (config.debug) {
        console.log('[Google Plugin v2] Config:', config);
      }
      
      // Start observing DOM changes
      observer = new MutationObserver(throttledDetect);
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Initial detection
      detectGoogleAds();
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
      console.log('[Google Plugin v2] Teardown complete');
    },
  };
}

function throttledDetect() {
  if (detectTimeout) return;
  
  detectTimeout = window.setTimeout(() => {
    detectGoogleAds();
    detectTimeout = null;
  }, 500);
}

function detectGoogleAds() {
  if (!config) {
    console.warn('[Google Plugin v2] No config available');
    return;
  }
  
  try {
    const candidates = detectAds(config, seenContainers);
    
    console.log(`[Google Plugin v2] Detected ${candidates.length} new ads`);
    
    for (const candidate of candidates) {
      sendAdCandidate(candidate);
    }
    
  } catch (error) {
    console.error('[Google Plugin v2] Detection error:', error);
  }
}

function sendAdCandidate(candidate: AdCandidate) {
  const { fields, validation, platform, detectedAt, pageUrl, placement, containerMatch } = candidate;
  
  const payload: AdDetectionPayload = {
    platform,
    pageUrl,
    placement,
    advertiserName: fields.advertiser,
    advertiserHandle: fields.advertiserHandle,
    labelText: fields.label || 'Sponsored',
    creativeText: buildCreativeText(fields),
    destinationUrl: fields.destinationUrl,
    mediaUrls: [...(fields.images || []), ...(fields.videos || [])].slice(0, 3),
    confidence: validation.confidence,
    containerRuleId: containerMatch.ruleId,
    detectedAt,
  };
  
  if (config?.debug) {
    console.log('[Google Plugin v2] Sending ad candidate:', payload);
  }
  
  chrome.runtime.sendMessage({
    type: 'AD_CANDIDATE',
    payload: convertToLegacyPayload(payload),
  });
}

function buildCreativeText(fields: { headline?: string; body?: string; cta?: string }): string {
  const parts: string[] = [];
  
  if (fields.headline) parts.push(fields.headline);
  if (fields.body) parts.push(fields.body);
  if (fields.cta) parts.push(`[${fields.cta}]`);
  
  return parts.join(' • ').substring(0, 2000);
}

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
