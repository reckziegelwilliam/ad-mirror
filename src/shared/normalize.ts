import { AdRecord, AdCandidatePayload } from './types';
import { getCurrentSettings } from '../shared/settings';
import { CreateOrUpdateAdInput } from '../offscreen/adStore';

/**
 * Convert AdCandidatePayload to CreateOrUpdateAdInput for AdStore
 */
export async function normalizeCandidate(
  payload: AdCandidatePayload
): Promise<CreateOrUpdateAdInput> {
  return {
    platform: payload.platform,
    platformAdId: await hashId(
      payload.platform,
      payload.advertiserName || '',
      (payload.text || '').substring(0, 160),
      extractOrigin(payload.destUrl)
    ),
    advertiserName: payload.advertiserName,
    advertiserHandle: payload.advertiserHandle,
    labelText: payload.sponsoredLabel,
    creativeText: payload.text?.substring(0, 2000),
    destinationUrl: payload.destUrl ? sanitizeUrl(payload.destUrl) : undefined,
    mediaUrls: payload.mediaUrls,
    pageUrl: payload.pageUrl,
    placement: payload.placement,
    seenAt: Date.now(),
  };
}

/**
 * Legacy function for backward compatibility
 * Converts to old AdRecord format
 */
export async function normalizeCandidateLegacy(
  payload: AdCandidatePayload
): Promise<AdRecord> {
  const settings = await getCurrentSettings();
  
  return {
    id: await hashId(
      payload.platform,
      payload.advertiserName || '',
      (payload.text || '').substring(0, 160),
      extractOrigin(payload.destUrl)
    ),
    platform: payload.platform,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
    impressionCount: 1,
    placement: payload.placement,
    pageUrl: settings.capturePageUrl ? payload.pageUrl : undefined,
    advertiserName: payload.advertiserName,
    advertiserHandle: payload.advertiserHandle,
    creativeText: payload.text?.substring(0, 2000),
    labelText: payload.sponsoredLabel,
    mediaUrls: settings.storeMediaUrls ? payload.mediaUrls : undefined,
    destinationUrl: payload.destUrl ? sanitizeUrl(payload.destUrl) : undefined,
    tags: [],
    // Legacy fields
    detectedAt: Date.now(),
    text: payload.text,
    destUrl: payload.destUrl,
    sponsoredLabel: payload.sponsoredLabel,
  };
}

export async function hashId(...parts: string[]): Promise<string> {
  const text = parts.join('|');
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove common tracking params
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', '_ga', 'mc_cid', 'mc_eid'
    ];
    trackingParams.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

function extractOrigin(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

