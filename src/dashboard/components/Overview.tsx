import { useState, useEffect } from 'react';
import { Platform } from '../../shared/types';

interface TotalStats {
  totalAds: number;
  totalImpressions: number;
  uniqueAdvertisers: number;
  oldestAd: number;
  newestAd: number;
}

interface TopAdvertiser {
  advertiserName: string;
  impressionCount: number;
  adCount: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

interface PlatformBreakdown {
  platform: Platform;
  adCount: number;
  impressionCount: number;
}

export function Overview() {
  const [stats, setStats] = useState<TotalStats | null>(null);
  const [topAdvertisers, setTopAdvertisers] = useState<TopAdvertiser[]>([]);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Get total stats
      const statsResponse = await chrome.runtime.sendMessage({
        type: 'ANALYTICS_GET_TOTAL_STATS',
      });
      setStats(statsResponse.stats);

      // Get top 5 advertisers
      const advertisersResponse = await chrome.runtime.sendMessage({
        type: 'ANALYTICS_GET_TOP_ADVERTISERS',
        opts: { limit: 5 },
      });
      setTopAdvertisers(advertisersResponse.advertisers);

      // Get platform breakdown
      const breakdownResponse = await chrome.runtime.sendMessage({
        type: 'ANALYTICS_GET_PLATFORM_BREAKDOWN',
      });
      setPlatformBreakdown(breakdownResponse.breakdown);
    } catch (error) {
      console.error('[Overview] Error loading data:', error);
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Ads"
          value={stats.totalAds.toLocaleString()}
          subtitle={`${stats.uniqueAdvertisers} advertisers`}
        />
        <StatCard
          title="Total Impressions"
          value={stats.totalImpressions.toLocaleString()}
          subtitle={`Avg ${(stats.totalImpressions / Math.max(stats.totalAds, 1)).toFixed(1)} per ad`}
        />
        <StatCard
          title="Time Tracking"
          value={formatDaysSince(stats.oldestAd)}
          subtitle={`Since ${new Date(stats.oldestAd).toLocaleDateString()}`}
        />
      </div>

      {/* Top Advertisers */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Advertisers</h3>
        {topAdvertisers.length === 0 ? (
          <p className="text-sm text-gray-500">No advertisers yet</p>
        ) : (
          <div className="space-y-2">
            {topAdvertisers.map((advertiser, index) => (
              <div
                key={advertiser.advertiserName}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-blue-600 w-6">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {advertiser.advertiserName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {advertiser.adCount} {advertiser.adCount === 1 ? 'ad' : 'ads'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">
                    {advertiser.impressionCount}
                  </div>
                  <div className="text-xs text-gray-500">impressions</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Platform Breakdown</h3>
        {platformBreakdown.length === 0 ? (
          <p className="text-sm text-gray-500">No platform data</p>
        ) : (
          <div className="space-y-2">
            {platformBreakdown.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform.platform)}`} />
                  <span className="font-medium text-gray-800 capitalize">
                    {platform.platform}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {platform.adCount} ads • {platform.impressionCount} impressions
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function formatDaysSince(timestamp: number): string {
  if (!timestamp) return 'N/A';
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
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

