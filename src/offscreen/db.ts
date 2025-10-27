import Dexie, { Table } from 'dexie';
import { AdRecord, Impression, Tag, AdTag } from '../shared/types';

class AdMirrorDB extends Dexie {
  adRecords!: Table<AdRecord, string>;
  // v1+ tables (defined now for schema migration readiness)
  impressions!: Table<Impression, string>;
  tags!: Table<Tag, string>;
  adTags!: Table<AdTag, string>;

  constructor() {
    super('AdMirrorDB');
    
    this.version(1).stores({
      adRecords: 'id, platform, detectedAt, advertiserName',
      // v1+ (not used in MVP but schema reserved)
      impressions: 'id, adId, seenAt',
      tags: 'id, name',
      adTags: '[adId+tagId], adId, tagId',
    });
  }
}

const db = new AdMirrorDB();

// Message handling from background/popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'DB_SAVE': {
        await db.adRecords.put(msg.record);
        sendResponse({ success: true });
        break;
      }
      case 'DB_LIST': {
        let query = db.adRecords.orderBy('detectedAt').reverse();
        
        if (msg.filters?.platforms?.length) {
          query = query.filter(r => msg.filters.platforms.includes(r.platform));
        }
        if (msg.filters?.startDate) {
          query = query.filter(r => r.detectedAt >= msg.filters.startDate);
        }
        if (msg.filters?.endDate) {
          query = query.filter(r => r.detectedAt <= msg.filters.endDate);
        }
        
        let records = await query.toArray();
        
        if (msg.filters?.searchText) {
          const search = msg.filters.searchText.toLowerCase();
          records = records.filter(r =>
            r.advertiserName?.toLowerCase().includes(search) ||
            r.text?.toLowerCase().includes(search)
          );
        }
        
        sendResponse({ records });
        break;
      }
      case 'DB_DELETE': {
        await db.adRecords.delete(msg.id);
        sendResponse({ success: true });
        break;
      }
      case 'DB_DELETE_ALL': {
        await db.adRecords.clear();
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

