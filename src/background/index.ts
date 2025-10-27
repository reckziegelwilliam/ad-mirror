import { BackgroundMessage } from '../shared/types';
import { normalizeCandidate } from '../shared/normalize';

const OFFSCREEN_DOCUMENT_PATH = 'offscreen/db.html';
let offscreenReady = false;

// LRU deduplication cache (prevent duplicate processing within 5 min)
const recentAdIds = new Set<string>();
const MAX_CACHE_SIZE = 500;
const CACHE_TTL = 5 * 60 * 1000;

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

// Message router
chrome.runtime.onMessage.addListener((msg: BackgroundMessage, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'AD_CANDIDATE': {
        const record = await normalizeCandidate(msg.payload);
        
        // Dedupe check
        if (recentAdIds.has(record.id)) {
          sendResponse({ skipped: true, reason: 'duplicate' });
          return;
        }
        
        // Add to cache
        recentAdIds.add(record.id);
        if (recentAdIds.size > MAX_CACHE_SIZE) {
          const firstId = recentAdIds.values().next().value;
          if (firstId) recentAdIds.delete(firstId);
        }
        setTimeout(() => recentAdIds.delete(record.id), CACHE_TTL);
        
        // Save to DB
        await ensureOffscreenDocument();
        await chrome.runtime.sendMessage({
          type: 'DB_SAVE',
          record,
        });
        
        // Broadcast to popup for live updates
        chrome.runtime.sendMessage({ type: 'RECORD_SAVED', record }).catch(() => {});
        
        sendResponse({ success: true, id: record.id });
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
        const { records } = await chrome.runtime.sendMessage({ type: 'DB_LIST' });
        
        let blob: Blob;
        let filename: string;
        
        if (msg.format === 'json') {
          blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
          filename = `ad-mirror-${Date.now()}.json`;
        } else {
          const csv = recordsToCSV(records);
          blob = new Blob([csv], { type: 'text/csv' });
          filename = `ad-mirror-${Date.now()}.csv`;
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
  
  const headers = ['id', 'platform', 'detectedAt', 'advertiserName', 'text', 'destUrl'];
  const rows = records.map(r => headers.map(h => {
    const val = r[h];
    if (val === undefined) return '';
    if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
    return val;
  }).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

console.log('[AdMirror] Background service worker ready');

