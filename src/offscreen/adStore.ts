import { db } from './db';
import { AdRecord, Impression, Platform } from '../shared/types';
import { getCurrentSettings } from '../shared/settings';

export interface CreateOrUpdateAdInput {
  platform: Platform;
  platformAdId: string;  // Unique ID from the platform (e.g., tweet ID, post ID)
  advertiserName?: string;
  advertiserHandle?: string;
  labelText?: string;
  creativeText?: string;
  destinationUrl?: string;
  mediaUrls?: string[];
  pageUrl?: string;
  placement?: 'feed' | 'search' | 'other';
  seenAt?: number;
}

export class AdStore {
  /**
   * Record a new impression of an ad.
   * Creates a new AdRecord if this is the first time seeing it,
   * or updates existing record and adds new impression.
   */
  async recordImpression(input: CreateOrUpdateAdInput): Promise<{ adId: string; isNew: boolean }> {
    const seenAt = input.seenAt ?? Date.now();
    const adId = this.computeAdId(input);
    const settings = await getCurrentSettings();
    let existingAd: AdRecord | undefined;

    await db.transaction('readwrite', db.adRecords, db.impressions, async () => {
      existingAd = await db.adRecords.get(adId);
      
      if (existingAd) {
        // Update existing ad record
        await db.adRecords.update(adId, {
          lastSeenAt: seenAt,
          impressionCount: existingAd.impressionCount + 1,
          // Update fields that might have changed
          advertiserName: input.advertiserName ?? existingAd.advertiserName,
          advertiserHandle: input.advertiserHandle ?? existingAd.advertiserHandle,
          creativeText: input.creativeText ?? existingAd.creativeText,
          labelText: input.labelText ?? existingAd.labelText,
        });
      } else {
        // Create new ad record
        const ad: AdRecord = {
          id: adId,
          platform: input.platform,
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
          impressionCount: 1,
          placement: input.placement || 'other',
          advertiserName: input.advertiserName,
          advertiserHandle: input.advertiserHandle,
          labelText: input.labelText,
          creativeText: input.creativeText,
          destinationUrl: input.destinationUrl,
          mediaUrls: settings.storeMediaUrls ? input.mediaUrls : undefined,
          pageUrl: settings.capturePageUrl ? input.pageUrl : undefined,
          tags: [],
        };
        await db.adRecords.add(ad);
      }

      // Always create a new impression
      const impression: Impression = {
        id: crypto.randomUUID(),
        adId,
        seenAt,
        pageUrl: settings.capturePageUrl ? input.pageUrl : undefined,
      };
      await db.impressions.add(impression);
    });

    return { adId, isNew: !existingAd };
  }

  /**
   * Compute a stable hash ID for an ad based on platform, unique ID, and destination.
   * This allows us to recognize the same ad across multiple impressions.
   */
  private computeAdId(input: CreateOrUpdateAdInput): string {
    const parts = [
      input.platform,
      input.platformAdId,
      input.destinationUrl || '',
      input.advertiserName || '',
    ];
    
    // Simple hash function (FNV-1a)
    const key = parts.join('|');
    let hash = 2166136261;
    
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    
    return `ad_${(hash >>> 0).toString(36)}`;
  }

  /**
   * Get a single ad by ID
   */
  async getAd(adId: string): Promise<AdRecord | undefined> {
    return await db.adRecords.get(adId);
  }

  /**
   * Get all impressions for an ad
   */
  async getImpressions(adId: string): Promise<Impression[]> {
    return await db.impressions
      .where('adId')
      .equals(adId)
      .sortBy('seenAt');
  }

  /**
   * Delete an ad and all its impressions
   */
  async deleteAd(adId: string): Promise<void> {
    await db.transaction('readwrite', db.adRecords, db.impressions, async () => {
      await db.adRecords.delete(adId);
      await db.impressions.where('adId').equals(adId).delete();
    });
  }

  /**
   * Delete all ads and impressions
   */
  async deleteAll(): Promise<void> {
    await db.transaction('readwrite', db.adRecords, db.impressions, async () => {
      await db.adRecords.clear();
      await db.impressions.clear();
    });
  }
}

// Export singleton instance
export const adStore = new AdStore();

