import { BackgroundMessage } from '../shared/types';
import { normalizeCandidate } from '../shared/normalize';

const OFFSCREEN_DOCUMENT_PATH = 'offscreen/db.html';
let offscreenReady = false;

// Ensure offscreen document exists
async function ensureOffscreenDocument() {
  if (offscreenReady) return;
  
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
  });
  
  if (existing && existing.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['BLOBS' as chrome.offscreen.Reason],
      justification: 'Stable IndexedDB access across service worker restarts',
    });
  }
  
  offscreenReady = true;
}

// Set up daily retention policy enforcement
chrome.alarms.create('retention-policy', { periodInMinutes: 24 * 60 }); // Daily

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'retention-policy') {
    console.log('[AdMirror] Running daily retention policy');
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type: 'MAINTENANCE_ENFORCE_RETENTION' });
  }
});

// Run retention policy on startup
(async () => {
  await ensureOffscreenDocument();
  await chrome.runtime.sendMessage({ type: 'MAINTENANCE_ENFORCE_RETENTION' });
})();

// Message router
chrome.runtime.onMessage.addListener((msg: BackgroundMessage, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'AD_CANDIDATE': {
        const input = await normalizeCandidate(msg.payload);
        
        // Send to offscreen document for storage via AdStore
        await ensureOffscreenDocument();
        const result = await chrome.runtime.sendMessage({
          type: 'DB_RECORD_IMPRESSION',
          input,
        });
        
        // Broadcast to popup for live updates
        if (result.isNew) {
          chrome.runtime.sendMessage({ type: 'RECORD_SAVED', adId: result.adId }).catch(() => {});
        }
        
        sendResponse({ success: true, ...result });
        break;
      }
      
      case 'LIST_RECORDS': {
        await ensureOffscreenDocument();
        const response = await chrome.runtime.sendMessage({ type: 'DB_LIST', filters: msg.filters });
        sendResponse(response);
        break;
      }
      
      case 'DELETE_RECORD': {
        await ensureOffscreenDocument();
        const response = await chrome.runtime.sendMessage({ type: 'DB_DELETE', id: msg.id });
        sendResponse(response);
        break;
      }
      
      case 'DELETE_ALL': {
        await ensureOffscreenDocument();
        const response = await chrome.runtime.sendMessage({ type: 'DB_DELETE_ALL' });
        sendResponse(response);
        break;
      }
      
      case 'EXPORT': {
        await ensureOffscreenDocument();
        
        // Apply filters if provided
        const filters = msg.filters || {};
        const { records } = await chrome.runtime.sendMessage({ type: 'DB_LIST', filters });
        
        let blob: Blob;
        let filename: string;
        const timestamp = new Date().toISOString().split('T')[0];
        
        if (msg.format === 'json') {
          blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
          filename = `ad-mirror-${timestamp}.json`;
        } else if (msg.format === 'csv') {
          const csv = recordsToCSV(records);
          blob = new Blob([csv], { type: 'text/csv' });
          filename = `ad-mirror-${timestamp}.csv`;
        } else if (msg.format === 'csv-summary') {
          // Get analytics data for summary
          const { advertisers } = await chrome.runtime.sendMessage({
            type: 'ANALYTICS_GET_TOP_ADVERTISERS',
            opts: { limit: 50 },
          });
          const csv = advertiserSummaryToCSV(advertisers, records.length);
          blob = new Blob([csv], { type: 'text/csv' });
          filename = `ad-mirror-summary-${timestamp}.csv`;
        } else {
          sendResponse({ success: false, error: 'Unknown format' });
          return;
        }
        
        const url = URL.createObjectURL(blob);
        await chrome.downloads.download({ url, filename, saveAs: true });
        
        sendResponse({ success: true });
        break;
      }
    }
  })();
  return true;
});

function recordsToCSV(records: any[]): string {
  if (!records.length) return 'No records';
  
  const headers = ['id', 'platform', 'firstSeenAt', 'lastSeenAt', 'impressionCount', 'advertiserName', 'creativeText', 'destinationUrl', 'labelText'];
  const rows = records.map(r => headers.map(h => {
    const val = r[h] || r[h.replace('creativeText', 'text').replace('destinationUrl', 'destUrl').replace('labelText', 'sponsoredLabel')];
    if (val === undefined || val === null) return '';
    if (h === 'firstSeenAt' || h === 'lastSeenAt') {
      return new Date(val).toISOString();
    }
    if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
    return val;
  }).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

function advertiserSummaryToCSV(advertisers: any[], totalAds: number): string {
  const headers = ['Rank', 'Advertiser', 'Total Impressions', 'Unique Ads', 'First Seen', 'Last Seen', '% of Total Ads'];
  const rows = advertisers.map((adv, index) => [
    index + 1,
    `"${adv.advertiserName.replace(/"/g, '""')}"`,
    adv.impressionCount,
    adv.adCount,
    new Date(adv.firstSeenAt).toLocaleDateString(),
    new Date(adv.lastSeenAt).toLocaleDateString(),
    `${((adv.adCount / totalAds) * 100).toFixed(2)}%`,
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

console.log('[AdMirror] Background service worker ready');

