import Dexie, { Table } from 'dexie';
import { AdRecord, Impression, Tag, AdTag } from '../shared/types';

class AdMirrorDB extends Dexie {
  adRecords!: Table<AdRecord, string>;
  impressions!: Table<Impression, string>;
  tags!: Table<Tag, string>;
  adTags!: Table<AdTag, string>;

  constructor() {
    super('AdMirrorDB');
    
    // v1 schema (original)
    this.version(1).stores({
      adRecords: 'id, platform, detectedAt, advertiserName',
      impressions: 'id, adId, seenAt',
      tags: 'id, name',
      adTags: '[adId+tagId], adId, tagId',
    });

    // v2 schema with impression tracking
    this.version(2).stores({
      adRecords: 'id, platform, firstSeenAt, lastSeenAt, advertiserName, [platform+lastSeenAt]',
      impressions: 'id, adId, seenAt, [adId+seenAt]',
      tags: 'id, name',
      adTags: '[adId+tagId], adId, tagId',
    }).upgrade(async tx => {
      // Migration: convert v1 records to v2 schema
      const v1Records = await tx.table('adRecords').toArray();
      
      for (const record of v1Records) {
        // Add new fields
        const updatedRecord = {
          ...record,
          firstSeenAt: record.detectedAt || Date.now(),
          lastSeenAt: record.detectedAt || Date.now(),
          impressionCount: 1,
          labelText: record.sponsoredLabel,
          creativeText: record.text,
          destinationUrl: record.destUrl,
        };

        // Update the record
        await tx.table('adRecords').put(updatedRecord);

        // Create initial impression
        const impression: Impression = {
          id: crypto.randomUUID(),
          adId: record.id,
          seenAt: record.detectedAt || Date.now(),
          pageUrl: record.pageUrl,
        };
        await tx.table('impressions').add(impression);
      }

      console.log(`[AdMirror] Migrated ${v1Records.length} records to v2 schema`);
    });
  }
}

const db = new AdMirrorDB();

// Export db instance for use by other modules
export { db };

// Import AdStore for message handling
import { adStore } from './adStore';
import { analyticsService } from './analytics';
import { maintenanceService } from './maintenance';

// Message handling from background/popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'DB_RECORD_IMPRESSION': {
        const result = await adStore.recordImpression(msg.input);
        sendResponse(result);
        break;
      }
      case 'DB_GET_AD': {
        const ad = await adStore.getAd(msg.adId);
        sendResponse({ ad });
        break;
      }
      case 'DB_GET_IMPRESSIONS': {
        const impressions = await adStore.getImpressions(msg.adId);
        sendResponse({ impressions });
        break;
      }
      case 'DB_SAVE': {
        await db.adRecords.put(msg.record);
        sendResponse({ success: true });
        break;
      }
      case 'DB_LIST': {
        let query = db.adRecords.orderBy('lastSeenAt').reverse();
        
        if (msg.filters?.platforms?.length) {
          query = query.filter(r => msg.filters.platforms.includes(r.platform));
        }
        if (msg.filters?.startDate) {
          query = query.filter(r => (r.lastSeenAt || r.detectedAt || 0) >= msg.filters.startDate);
        }
        if (msg.filters?.endDate) {
          query = query.filter(r => (r.lastSeenAt || r.detectedAt || 0) <= msg.filters.endDate);
        }
        
        let records = await query.toArray();
        
        if (msg.filters?.searchText) {
          const search = msg.filters.searchText.toLowerCase();
          records = records.filter(r =>
            r.advertiserName?.toLowerCase().includes(search) ||
            r.creativeText?.toLowerCase().includes(search) ||
            r.text?.toLowerCase().includes(search)
          );
        }
        
        sendResponse({ records });
        break;
      }
      case 'DB_DELETE': {
        await adStore.deleteAd(msg.id);
        sendResponse({ success: true });
        break;
      }
      case 'DB_DELETE_ALL': {
        await adStore.deleteAll();
        sendResponse({ success: true });
        break;
      }
      case 'ANALYTICS_GET_TOP_ADVERTISERS': {
        const result = await analyticsService.getTopAdvertisers(msg.opts || {});
        sendResponse({ advertisers: result });
        break;
      }
      case 'ANALYTICS_GET_PLATFORM_BREAKDOWN': {
        const result = await analyticsService.getPlatformBreakdown();
        sendResponse({ breakdown: result });
        break;
      }
      case 'ANALYTICS_GET_TOTAL_STATS': {
        const result = await analyticsService.getTotalStats();
        sendResponse({ stats: result });
        break;
      }
      case 'ANALYTICS_GET_TIMELINE': {
        const result = await analyticsService.getImpressionsTimeline(msg.opts);
        sendResponse({ timeline: result });
        break;
      }
      case 'ANALYTICS_GET_FREQUENCY': {
        const result = await analyticsService.getFrequencyDistribution();
        sendResponse({ frequency: result });
        break;
      }
      case 'ANALYTICS_GET_ADVERTISER_DETAIL': {
        const result = await analyticsService.getAdvertiserDetail(msg.advertiserName);
        sendResponse({ detail: result });
        break;
      }
      case 'MAINTENANCE_ENFORCE_RETENTION': {
        const result = await maintenanceService.enforceRetentionPolicy(msg.opts);
        sendResponse(result);
        break;
      }
      case 'MAINTENANCE_GET_STORAGE_STATS': {
        const result = await maintenanceService.getStorageStats();
        sendResponse(result);
        break;
      }
      case 'MAINTENANCE_BACKUP': {
        const result = await maintenanceService.backupToJSON();
        sendResponse({ backup: result });
        break;
      }
      case 'MAINTENANCE_RESTORE': {
        await maintenanceService.restoreFromJSON(msg.backup);
        sendResponse({ success: true });
        break;
      }
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  return true; // Async response
});

console.log('[AdMirror] Offscreen DB ready');

