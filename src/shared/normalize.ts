import { AdRecord, AdCandidatePayload } from './types';
import { getCurrentSettings } from '../shared/settings';

export async function normalizeCandidate(
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
    detectedAt: Date.now(),
    placement: payload.placement,
    pageUrl: settings.capturePageUrl ? payload.pageUrl : undefined,
    advertiserName: payload.advertiserName,
    advertiserHandle: payload.advertiserHandle,
    text: payload.text?.substring(0, 2000),
    mediaUrls: settings.storeMediaUrls ? payload.mediaUrls : undefined,
    destUrl: payload.destUrl ? sanitizeUrl(payload.destUrl) : undefined,
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

