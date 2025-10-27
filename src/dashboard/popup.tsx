import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AdRecord, Platform } from '../shared/types';
import './styles.css';

function Popup() {
  const [records, setRecords] = useState<AdRecord[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>(['reddit', 'google', 'twitter']);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadRecords();
    
    // Live updates
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'RECORD_SAVED') {
        loadRecords();
      }
    });
  }, [platforms, timeRange, searchText]);

  async function loadRecords() {
    const now = Date.now();
    const filters: any = { platforms };
    
    if (timeRange === '24h') filters.startDate = now - 24 * 60 * 60 * 1000;
    if (timeRange === '7d') filters.startDate = now - 7 * 24 * 60 * 60 * 1000;
    if (searchText) filters.searchText = searchText;
    
    const response = await chrome.runtime.sendMessage({ type: 'LIST_RECORDS', filters });
    setRecords(response.records || []);
  }

  async function exportData(format: 'json' | 'csv') {
    await chrome.runtime.sendMessage({ type: 'EXPORT', format });
  }

  async function eraseAll() {
    if (!confirm('Erase all ad data? This cannot be undone.')) return;
    await chrome.runtime.sendMessage({ type: 'DELETE_ALL' });
    setRecords([]);
  }

  return (
    <div className="w-[600px] h-[500px] flex flex-col p-4 bg-gray-50">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Ad Mirror</h1>
        <p className="text-sm text-gray-600">{records.length} ads captured</p>
      </header>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          title="Platforms"
          multiple
          className="border rounded px-2 py-1 text-sm"
          value={platforms}
          onChange={(e) => setPlatforms(Array.from(e.target.selectedOptions, o => o.value as Platform))}
        >
          <option value="reddit">Reddit</option>
          <option value="google">Google</option>
          <option value="twitter">Twitter/X</option>
        </select>

        <select title="Time Range" value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
          <option value="all">All time</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border rounded px-2 py-1 text-sm flex-1"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {records.map(record => (
          <div key={record.id} className="bg-white rounded shadow p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-600 uppercase">{record.platform}</span>
                  <span className="text-xs text-gray-500">{record.sponsoredLabel}</span>
                </div>
                <h3 className="font-semibold text-sm">{record.advertiserName || 'Unknown Advertiser'}</h3>
                {record.text && <p className="text-xs text-gray-700 mt-1 line-clamp-2">{record.text}</p>}
                {record.destUrl && (
                  <a href={record.destUrl} target="_blank" className="text-xs text-blue-500 hover:underline mt-1 block">
                    {new URL(record.destUrl).hostname}
                  </a>
                )}
              </div>
              <span className="text-xs text-gray-400">{new Date(record.detectedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-4 flex gap-2">
        <button onClick={() => exportData('json')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Export JSON
        </button>
        <button onClick={() => exportData('csv')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Export CSV
        </button>
        <button onClick={eraseAll} className="px-3 py-1 bg-red-600 text-white rounded text-sm ml-auto">
          Erase All
        </button>
        <button onClick={() => chrome.runtime.openOptionsPage()} className="px-3 py-1 bg-gray-600 text-white rounded text-sm">
          Settings
        </button>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />);

