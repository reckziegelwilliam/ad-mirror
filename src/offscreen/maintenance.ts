import { db } from './db';
import { getCurrentSettings } from '../shared/settings';

export interface RetentionPolicyOptions {
  maxRecords?: number;
  maxAgeMs?: number;
}

export class MaintenanceService {
  /**
   * Enforce retention policy by deleting old ads and orphaned impressions
   */
  async enforceRetentionPolicy(opts?: RetentionPolicyOptions): Promise<{
    deletedAds: number;
    deletedImpressions: number;
  }> {
    const settings = await getCurrentSettings();
    const { maxRecords = 10000, maxAgeMs } = opts || {};

    // Determine max age from settings if not provided
    const effectiveMaxAgeMs = maxAgeMs ?? (
      settings.retentionDays
        ? settings.retentionDays * 24 * 60 * 60 * 1000
        : null
    );

    const now = Date.now();
    let deletedAds = 0;
    let deletedImpressions = 0;

    await db.transaction('readwrite', db.adRecords, db.impressions, async () => {
      // 1) Delete ads that are too old
      if (effectiveMaxAgeMs !== null) {
        const minAllowed = now - effectiveMaxAgeMs;
        const oldAds = await db.adRecords
          .where('lastSeenAt')
          .below(minAllowed)
          .toArray();

        for (const ad of oldAds) {
          await db.adRecords.delete(ad.id);
          const imps = await db.impressions.where('adId').equals(ad.id).delete();
          deletedAds++;
          deletedImpressions += imps;
        }
      }

      // 2) Delete excess ads if count exceeds maxRecords
      const count = await db.adRecords.count();
      if (count > maxRecords) {
        const toDelete = count - maxRecords;
        const oldest = await db.adRecords
          .orderBy('lastSeenAt')
          .limit(toDelete)
          .toArray();

        for (const ad of oldest) {
          await db.adRecords.delete(ad.id);
          const imps = await db.impressions.where('adId').equals(ad.id).delete();
          deletedAds++;
          deletedImpressions += imps;
        }
      }

      // 3) Delete orphaned impressions (impressions without a matching ad)
      const allImpressions = await db.impressions.toArray();
      for (const imp of allImpressions) {
        const adExists = await db.adRecords.get(imp.adId);
        if (!adExists) {
          await db.impressions.delete(imp.id);
          deletedImpressions++;
        }
      }
    });

    console.log(`[AdMirror] Retention policy: deleted ${deletedAds} ads, ${deletedImpressions} impressions`);

    return { deletedAds, deletedImpressions };
  }

  /**
   * Get storage usage stats
   */
  async getStorageStats(): Promise<{
    totalAds: number;
    totalImpressions: number;
    oldestAd: number;
    newestAd: number;
    estimatedSizeBytes: number;
  }> {
    const ads = await db.adRecords.toArray();
    const impressions = await db.impressions.toArray();

    const oldestAd = ads.length > 0
      ? Math.min(...ads.map(ad => ad.firstSeenAt || ad.detectedAt || Date.now()))
      : 0;

    const newestAd = ads.length > 0
      ? Math.max(...ads.map(ad => ad.lastSeenAt || ad.detectedAt || 0))
      : 0;

    // Rough estimate of storage size
    // JSON.stringify gives us a reasonable approximation
    const adDataSize = JSON.stringify(ads).length;
    const impressionDataSize = JSON.stringify(impressions).length;
    const estimatedSizeBytes = adDataSize + impressionDataSize;

    return {
      totalAds: ads.length,
      totalImpressions: impressions.length,
      oldestAd,
      newestAd,
      estimatedSizeBytes,
    };
  }

  /**
   * Compact the database by removing deleted records and rebuilding indexes
   */
  async compactDatabase(): Promise<void> {
    // Dexie doesn't have a native compact operation, but we can:
    // 1. Export all data
    // 2. Delete database
    // 3. Re-import data
    // This is expensive, so only do it when needed

    console.log('[AdMirror] Database compaction not implemented (rarely needed with IndexedDB)');
  }

  /**
   * Backup all data to JSON
   */
  async backupToJSON(): Promise<string> {
    const ads = await db.adRecords.toArray();
    const impressions = await db.impressions.toArray();
    const tags = await db.tags.toArray();
    const adTags = await db.adTags.toArray();

    const backup = {
      version: 2,
      exportedAt: Date.now(),
      data: {
        adRecords: ads,
        impressions,
        tags,
        adTags,
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Restore from JSON backup
   */
  async restoreFromJSON(backupJSON: string): Promise<void> {
    try {
      const backup = JSON.parse(backupJSON);

      if (!backup.data) {
        throw new Error('Invalid backup format');
      }

      await db.transaction('readwrite', db.adRecords, db.impressions, db.tags, db.adTags, async () => {
        // Clear existing data
        await db.adRecords.clear();
        await db.impressions.clear();
        await db.tags.clear();
        await db.adTags.clear();

        // Restore data
        if (backup.data.adRecords) {
          await db.adRecords.bulkAdd(backup.data.adRecords);
        }
        if (backup.data.impressions) {
          await db.impressions.bulkAdd(backup.data.impressions);
        }
        if (backup.data.tags) {
          await db.tags.bulkAdd(backup.data.tags);
        }
        if (backup.data.adTags) {
          await db.adTags.bulkAdd(backup.data.adTags);
        }
      });

      console.log('[AdMirror] Restored from backup');
    } catch (error) {
      console.error('[AdMirror] Restore failed:', error);
      throw new Error('Failed to restore from backup');
    }
  }
}

// Export singleton instance
export const maintenanceService = new MaintenanceService();

