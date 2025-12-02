import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AdRecord, Platform } from '../shared/types';
import { Overview } from './components/Overview';
import { Analytics } from './components/Analytics';
import { AdsTable } from './components/AdsTable';
import { useTheme } from './hooks/useTheme';
import './styles.css';

type Tab = 'overview' | 'ads' | 'analytics';

function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [totalAds, setTotalAds] = useState(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Get total count for tab badge
    loadTotalCount();
    
    // Live updates
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'RECORD_SAVED') {
        loadTotalCount();
      }
    });
  }, []);

  async function loadTotalCount() {
    const response = await chrome.runtime.sendMessage({ type: 'LIST_RECORDS', filters: {} });
    setTotalAds(response.records?.length || 0);
  }

  async function exportData(format: 'json' | 'csv') {
    await chrome.runtime.sendMessage({ type: 'EXPORT', format });
  }

  async function eraseAll() {
    if (!confirm('Erase all ad data? This cannot be undone.')) return;
    await chrome.runtime.sendMessage({ type: 'DELETE_ALL' });
    setTotalAds(0);
  }

  return (
    <div className="w-[800px] h-[600px] flex flex-col bg-gray-50">
      <header className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-800">Ad Mirror</h1>
          <div className="flex items-center gap-2">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
              title="Theme"
            >
              <option value="system">🌓 System</option>
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'ads'}
            onClick={() => setActiveTab('ads')}
            label={`Ads (${totalAds})`}
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            label="Analytics"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'ads' && <AdsTable />}
        {activeTab === 'analytics' && <Analytics />}
      </div>

      <footer className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <button onClick={() => exportData('json')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Export JSON
        </button>
        <button onClick={() => exportData('csv')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Export CSV
        </button>
        <button onClick={eraseAll} className="px-3 py-1 bg-red-600 text-white rounded text-sm ml-auto hover:bg-red-700">
          Erase All
        </button>
        <button onClick={() => chrome.runtime.openOptionsPage()} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
          Settings
        </button>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />);

