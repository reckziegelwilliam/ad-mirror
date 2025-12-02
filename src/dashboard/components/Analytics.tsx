import { useState, useEffect } from 'react';
import { Platform } from '../../shared/types';

interface TimelineBucket {
  bucketStart: number;
  impressionCount: number;
  adCount: number;
}

interface TopAdvertiser {
  advertiserName: string;
  impressionCount: number;
  adCount: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

interface FrequencyBucket {
  range: string;
  count: number;
}

interface PlatformBreakdown {
  platform: Platform;
  adCount: number;
  impressionCount: number;
}

export function Analytics() {
  const [timeline, setTimeline] = useState<TimelineBucket[]>([]);
  const [topAdvertisers, setTopAdvertisers] = useState<TopAdvertiser[]>([]);
  const [frequency, setFrequency] = useState<FrequencyBucket[]>([]);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const now = Date.now();
      const rangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': 0,
      };

      const since = timeRange === 'all' ? 0 : now - rangeMs[timeRange];

      // Get timeline data
      if (timeRange !== 'all') {
        const bucketMs = timeRange === '7d' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const timelineResponse = await chrome.runtime.sendMessage({
          type: 'ANALYTICS_GET_TIMELINE',
          opts: { start: since, end: now, bucketMs },
        });
        setTimeline(timelineResponse.timeline || []);
      }

      // Get top advertisers
      const advertisersResponse = await chrome.runtime.sendMessage({
        type: 'ANALYTICS_GET_TOP_ADVERTISERS',
        opts: { limit: 10, since },
      });
      setTopAdvertisers(advertisersResponse.advertisers || []);

      // Get frequency distribution
      const frequencyResponse = await chrome.runtime.sendMessage({
        type: 'ANALYTICS_GET_FREQUENCY',
      });
      setFrequency(frequencyResponse.frequency || []);

      // Get platform breakdown
      const breakdownResponse = await chrome.runtime.sendMessage({
        type: 'ANALYTICS_GET_PLATFORM_BREAKDOWN',
      });
      setPlatformBreakdown(breakdownResponse.breakdown || []);
    } catch (error) {
      console.error('[Analytics] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
        <select
          title="Time Range"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Timeline Chart */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Impressions Over Time</h3>
          <TimelineChart data={timeline} />
        </div>
      )}

      {/* Top Advertisers Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Advertisers</h3>
        {topAdvertisers.length === 0 ? (
          <p className="text-sm text-gray-500">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">#</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Advertiser</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">Impressions</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">Ads</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">First Seen</th>
                </tr>
              </thead>
              <tbody>
                {topAdvertisers.map((advertiser, index) => (
                  <tr key={advertiser.advertiserName} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2 text-blue-600 font-bold">{index + 1}</td>
                    <td className="py-2 px-2 font-medium text-gray-800">{advertiser.advertiserName}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{advertiser.impressionCount}</td>
                    <td className="py-2 px-2 text-right text-gray-700">{advertiser.adCount}</td>
                    <td className="py-2 px-2 text-right text-gray-500 text-xs">
                      {new Date(advertiser.firstSeenAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Frequency Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequency Distribution</h3>
          <div className="space-y-2">
            {frequency.map((bucket) => (
              <div key={bucket.range} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{bucket.range} times</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{
                        width: `${(bucket.count / Math.max(...frequency.map(f => f.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-8 text-right">{bucket.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Breakdown</h3>
          <div className="space-y-3">
            {platformBreakdown.map((platform) => (
              <div key={platform.platform}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{platform.platform}</span>
                  <span className="text-sm text-gray-600">{platform.impressionCount} impressions</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`rounded-full h-2 ${getPlatformColor(platform.platform)}`}
                    style={{
                      width: `${
                        (platform.impressionCount /
                          Math.max(...platformBreakdown.map(p => p.impressionCount))) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{platform.adCount} unique ads</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineChart({ data }: { data: TimelineBucket[] }) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.impressionCount));

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-48">
        {data.map((bucket, index) => (
          <div key={index} className="flex-1 flex flex-col items-center justify-end group">
            <div
              className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors relative group"
              style={{ height: `${(bucket.impressionCount / maxCount) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {bucket.impressionCount} impressions
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{new Date(data[0].bucketStart).toLocaleDateString()}</span>
        <span>{new Date(data[data.length - 1].bucketStart).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'reddit':
      return 'bg-orange-500';
    case 'google':
      return 'bg-blue-500';
    case 'twitter':
      return 'bg-sky-500';
    default:
      return 'bg-gray-500';
  }
}

