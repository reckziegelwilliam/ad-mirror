import { useState, useEffect } from 'react';
import { AdRecord, Platform } from '../../shared/types';

type SortField = 'lastSeenAt' | 'firstSeenAt' | 'impressionCount' | 'advertiserName';
type SortDirection = 'asc' | 'desc';

export function AdsTable() {
  const [records, setRecords] = useState<AdRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AdRecord[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>(['reddit', 'google', 'twitter']);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastSeenAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterHasMedia, setFilterHasMedia] = useState<boolean | null>(null);
  const [filterHasDestUrl, setFilterHasDestUrl] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
    
    // Live updates
    const listener = (msg: any) => {
      if (msg.type === 'RECORD_SAVED') {
        loadRecords();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [records, platforms, timeRange, searchText, sortField, sortDirection, filterHasMedia, filterHasDestUrl]);

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'LIST_RECORDS', filters: {} });
      setRecords(response.records || []);
    } catch (error) {
      console.error('[AdsTable] Error loading records:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...records];

    // Filter by platform
    filtered = filtered.filter(r => platforms.includes(r.platform));

    // Filter by time range
    if (timeRange !== 'all') {
      const now = Date.now();
      const ranges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - ranges[timeRange];
      filtered = filtered.filter(r => (r.lastSeenAt || r.detectedAt || 0) >= cutoff);
    }

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        r.advertiserName?.toLowerCase().includes(search) ||
        r.creativeText?.toLowerCase().includes(search) ||
        r.text?.toLowerCase().includes(search)
      );
    }

    // Filter by has media
    if (filterHasMedia !== null) {
      filtered = filtered.filter(r =>
        filterHasMedia ? (r.mediaUrls && r.mediaUrls.length > 0) : (!r.mediaUrls || r.mediaUrls.length === 0)
      );
    }

    // Filter by has destination URL
    if (filterHasDestUrl !== null) {
      filtered = filtered.filter(r =>
        filterHasDestUrl ? !!(r.destinationUrl || r.destUrl) : !(r.destinationUrl || r.destUrl)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'lastSeenAt':
          aVal = a.lastSeenAt || a.detectedAt || 0;
          bVal = b.lastSeenAt || b.detectedAt || 0;
          break;
        case 'firstSeenAt':
          aVal = a.firstSeenAt || a.detectedAt || 0;
          bVal = b.firstSeenAt || b.detectedAt || 0;
          break;
        case 'impressionCount':
          aVal = a.impressionCount || 1;
          bVal = b.impressionCount || 1;
          break;
        case 'advertiserName':
          aVal = (a.advertiserName || '').toLowerCase();
          bVal = (b.advertiserName || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRecords(filtered);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function togglePlatform(platform: Platform) {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading ads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm font-medium text-gray-700">Platforms:</span>
          {(['reddit', 'google', 'twitter'] as Platform[]).map(platform => (
            <label key={platform} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={platforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="rounded"
              />
              <span className="text-sm capitalize">{platform}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            title="Time Range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All time</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <select
            title="Has Media"
            value={filterHasMedia === null ? 'all' : filterHasMedia ? 'yes' : 'no'}
            onChange={(e) => setFilterHasMedia(e.target.value === 'all' ? null : e.target.value === 'yes')}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">Any media</option>
            <option value="yes">Has media</option>
            <option value="no">No media</option>
          </select>

          <select
            title="Has URL"
            value={filterHasDestUrl === null ? 'all' : filterHasDestUrl ? 'yes' : 'no'}
            onChange={(e) => setFilterHasDestUrl(e.target.value === 'all' ? null : e.target.value === 'yes')}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">Any URL</option>
            <option value="yes">Has URL</option>
            <option value="no">No URL</option>
          </select>

          <input
            type="text"
            placeholder="Search advertiser or text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="border rounded px-3 py-1 text-sm flex-1 min-w-[200px]"
          />
        </div>

        <div className="flex gap-2 items-center text-xs text-gray-600">
          <span>Sort by:</span>
          <SortButton
            label="Last Seen"
            active={sortField === 'lastSeenAt'}
            direction={sortField === 'lastSeenAt' ? sortDirection : null}
            onClick={() => toggleSort('lastSeenAt')}
          />
          <SortButton
            label="First Seen"
            active={sortField === 'firstSeenAt'}
            direction={sortField === 'firstSeenAt' ? sortDirection : null}
            onClick={() => toggleSort('firstSeenAt')}
          />
          <SortButton
            label="Impressions"
            active={sortField === 'impressionCount'}
            direction={sortField === 'impressionCount' ? sortDirection : null}
            onClick={() => toggleSort('impressionCount')}
          />
          <SortButton
            label="Advertiser"
            active={sortField === 'advertiserName'}
            direction={sortField === 'advertiserName' ? sortDirection : null}
            onClick={() => toggleSort('advertiserName')}
          />
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-gray-600 px-2">
        Showing {filteredRecords.length} of {records.length} ads
      </div>

      {/* Ad Cards */}
      <div className="space-y-2">
        {filteredRecords.map(record => (
          <div key={record.id} className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-blue-600 uppercase">{record.platform}</span>
                  <span className="text-xs text-gray-500">{record.labelText || record.sponsoredLabel}</span>
                  {record.impressionCount > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {record.impressionCount}x seen
                    </span>
                  )}
                  {record.mediaUrls && record.mediaUrls.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      📷 {record.mediaUrls.length}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-gray-800">{record.advertiserName || 'Unknown Advertiser'}</h3>
                {(record.creativeText || record.text) && (
                  <p className="text-xs text-gray-700 mt-1 line-clamp-2">{record.creativeText || record.text}</p>
                )}
                {(record.destinationUrl || record.destUrl) && (
                  <a
                    href={record.destinationUrl || record.destUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1 block"
                  >
                    {new URL(record.destinationUrl || record.destUrl!).hostname}
                  </a>
                )}
              </div>
              <div className="text-right text-xs text-gray-400 ml-4">
                <div className="font-medium">
                  {new Date(record.lastSeenAt || record.detectedAt || 0).toLocaleDateString()}
                </div>
                {record.firstSeenAt && record.lastSeenAt && record.firstSeenAt !== record.lastSeenAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    First: {new Date(record.firstSeenAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            <p className="text-lg mb-2">No ads match your filters</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: 'asc' | 'desc' | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label} {active && (direction === 'asc' ? '↑' : '↓')}
    </button>
  );
}

