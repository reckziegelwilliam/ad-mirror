import { db } from './db';
import { AdRecord, Platform } from '../shared/types';

export interface TopAdvertiser {
  advertiserName: string;
  impressionCount: number;
  adCount: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface PlatformBreakdown {
  platform: Platform;
  adCount: number;
  impressionCount: number;
}

export interface TotalStats {
  totalAds: number;
  totalImpressions: number;
  uniqueAdvertisers: number;
  oldestAd: number;
  newestAd: number;
}

export interface TimelineBucket {
  bucketStart: number;
  impressionCount: number;
  adCount: number;
}

export interface FrequencyBucket {
  range: string;
  count: number;
}

export class AdAnalyticsService {
  /**
   * Get top advertisers by impression count
   */
  async getTopAdvertisers(opts: {
    platform?: Platform;
    limit?: number;
    since?: number;
  }): Promise<TopAdvertiser[]> {
    const { platform, limit = 20, since } = opts;

    let ads: AdRecord[];
    if (platform) {
      ads = await db.adRecords.where('platform').equals(platform).toArray();
    } else {
      ads = await db.adRecords.toArray();
    }

    // Filter by date if specified
    if (since) {
      ads = ads.filter(ad => (ad.lastSeenAt || ad.detectedAt || 0) >= since);
    }

    // Group by advertiser
    const byAdvertiser = new Map<string, TopAdvertiser>();

    for (const ad of ads) {
      const name = ad.advertiserName || 'Unknown Advertiser';
      const existing = byAdvertiser.get(name);

      if (existing) {
        existing.impressionCount += ad.impressionCount;
        existing.adCount += 1;
        existing.firstSeenAt = Math.min(existing.firstSeenAt, ad.firstSeenAt || ad.detectedAt || 0);
        existing.lastSeenAt = Math.max(existing.lastSeenAt, ad.lastSeenAt || ad.detectedAt || 0);
      } else {
        byAdvertiser.set(name, {
          advertiserName: name,
          impressionCount: ad.impressionCount,
          adCount: 1,
          firstSeenAt: ad.firstSeenAt || ad.detectedAt || 0,
          lastSeenAt: ad.lastSeenAt || ad.detectedAt || 0,
        });
      }
    }

    return Array.from(byAdvertiser.values())
      .sort((a, b) => b.impressionCount - a.impressionCount)
      .slice(0, limit);
  }

  /**
   * Get platform breakdown stats
   */
  async getPlatformBreakdown(): Promise<PlatformBreakdown[]> {
    const ads = await db.adRecords.toArray();

    const byPlatform = new Map<Platform, PlatformBreakdown>();

    for (const ad of ads) {
      const existing = byPlatform.get(ad.platform);

      if (existing) {
        existing.adCount += 1;
        existing.impressionCount += ad.impressionCount;
      } else {
        byPlatform.set(ad.platform, {
          platform: ad.platform,
          adCount: 1,
          impressionCount: ad.impressionCount,
        });
      }
    }

    return Array.from(byPlatform.values()).sort((a, b) => b.impressionCount - a.impressionCount);
  }

  /**
   * Get total stats across all ads
   */
  async getTotalStats(): Promise<TotalStats> {
    const ads = await db.adRecords.toArray();

    if (ads.length === 0) {
      return {
        totalAds: 0,
        totalImpressions: 0,
        uniqueAdvertisers: 0,
        oldestAd: 0,
        newestAd: 0,
      };
    }

    const uniqueAdvertisers = new Set(
      ads.map(ad => ad.advertiserName || 'Unknown').filter(Boolean)
    ).size;

    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressionCount, 0);

    const oldestAd = Math.min(...ads.map(ad => ad.firstSeenAt || ad.detectedAt || Date.now()));
    const newestAd = Math.max(...ads.map(ad => ad.lastSeenAt || ad.detectedAt || 0));

    return {
      totalAds: ads.length,
      totalImpressions,
      uniqueAdvertisers,
      oldestAd,
      newestAd,
    };
  }

  /**
   * Get impressions timeline bucketed by time
   */
  async getImpressionsTimeline(opts: {
    start: number;
    end: number;
    bucketMs: number; // e.g., 24 hours = 86400000
  }): Promise<TimelineBucket[]> {
    const { start, end, bucketMs } = opts;

    const impressions = await db.impressions
      .where('seenAt')
      .between(start, end, true, true)
      .toArray();

    // Bucket impressions
    const buckets = new Map<number, TimelineBucket>();

    for (const imp of impressions) {
      const bucketStart = Math.floor((imp.seenAt - start) / bucketMs) * bucketMs + start;
      const bucket = buckets.get(bucketStart);

      if (bucket) {
        bucket.impressionCount += 1;
      } else {
        buckets.set(bucketStart, {
          bucketStart,
          impressionCount: 1,
          adCount: 0, // We'll calculate this separately if needed
        });
      }
    }

    return Array.from(buckets.values()).sort((a, b) => a.bucketStart - b.bucketStart);
  }

  /**
   * Get frequency distribution (how many ads seen X times)
   */
  async getFrequencyDistribution(): Promise<FrequencyBucket[]> {
    const ads = await db.adRecords.toArray();

    const buckets = {
      '1': 0,
      '2': 0,
      '3-5': 0,
      '6-10': 0,
      '11-20': 0,
      '21+': 0,
    };

    for (const ad of ads) {
      const count = ad.impressionCount;
      if (count === 1) buckets['1']++;
      else if (count === 2) buckets['2']++;
      else if (count <= 5) buckets['3-5']++;
      else if (count <= 10) buckets['6-10']++;
      else if (count <= 20) buckets['11-20']++;
      else buckets['21+']++;
    }

    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }

  /**
   * Get detailed stats for a specific advertiser
   */
  async getAdvertiserDetail(advertiserName: string): Promise<{
    ads: AdRecord[];
    totalImpressions: number;
    firstSeen: number;
    lastSeen: number;
    platforms: Platform[];
  }> {
    const ads = await db.adRecords
      .where('advertiserName')
      .equals(advertiserName)
      .toArray();

    if (ads.length === 0) {
      return {
        ads: [],
        totalImpressions: 0,
        firstSeen: 0,
        lastSeen: 0,
        platforms: [],
      };
    }

    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressionCount, 0);
    const firstSeen = Math.min(...ads.map(ad => ad.firstSeenAt || ad.detectedAt || Date.now()));
    const lastSeen = Math.max(...ads.map(ad => ad.lastSeenAt || ad.detectedAt || 0));
    const platforms = [...new Set(ads.map(ad => ad.platform))];

    return {
      ads,
      totalImpressions,
      firstSeen,
      lastSeen,
      platforms,
    };
  }

  /**
   * Get page URL stats (only if capturePageUrl is enabled)
   */
  async getPageUrlStats(): Promise<Array<{ pageUrl: string; adCount: number }>> {
    const impressions = await db.impressions.toArray();

    const byUrl = new Map<string, number>();

    for (const imp of impressions) {
      if (!imp.pageUrl) continue;

      const count = byUrl.get(imp.pageUrl) || 0;
      byUrl.set(imp.pageUrl, count + 1);
    }

    return Array.from(byUrl.entries())
      .map(([pageUrl, adCount]) => ({ pageUrl, adCount }))
      .sort((a, b) => b.adCount - a.adCount)
      .slice(0, 50); // Top 50
  }
}

// Export singleton instance
export const analyticsService = new AdAnalyticsService();

