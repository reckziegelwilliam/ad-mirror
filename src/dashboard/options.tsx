import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Settings, Platform } from '../shared/types';
import { getCurrentSettings, updateSettings } from '../shared/settings';
import { DEFAULT_SELECTORS } from '../shared/selectors';
import './styles.css';

function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectorsJSON, setSelectorsJSON] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getCurrentSettings();
    setSettings(s);
    setSelectorsJSON(JSON.stringify(s.selectorsOverride || DEFAULT_SELECTORS, null, 2));
  }

  async function save() {
    if (!settings) return;
    
    try {
      const parsed = JSON.parse(selectorsJSON);
      const updated = { ...settings, selectorsOverride: parsed };
      await updateSettings(updated);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('Invalid JSON');
    }
  }

  async function togglePlatform(platform: Platform) {
    if (!settings) return;
    
    const enabled = !settings.enabledPlatforms[platform];
    
    if (enabled) {
      // Request host permission
      const hosts = {
        reddit: 'https://*.reddit.com/*',
        google: 'https://www.google.com/*',
        twitter: 'https://*.twitter.com/*',
      };
      
      await chrome.permissions.request({
        origins: [hosts[platform]],
      });
    }
    
    const updated = {
      ...settings,
      enabledPlatforms: { ...settings.enabledPlatforms, [platform]: enabled },
    };
    setSettings(updated);
    await updateSettings(updated);
  }

  if (!settings) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ad Mirror Settings</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Platforms</h2>
        <div className="space-y-2">
          {(['reddit', 'google', 'twitter'] as Platform[]).map(platform => (
            <label key={platform} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enabledPlatforms[platform]}
                onChange={() => togglePlatform(platform)}
              />
              <span className="capitalize">{platform}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Privacy</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.capturePageUrl}
              onChange={(e) => {
                const updated = { ...settings, capturePageUrl: e.target.checked };
                setSettings(updated);
                updateSettings(updated);
              }}
            />
            <span>Capture page URLs (default: OFF)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.storeMediaUrls}
              onChange={(e) => {
                const updated = { ...settings, storeMediaUrls: e.target.checked };
                setSettings(updated);
                updateSettings(updated);
              }}
            />
            <span>Store media URLs (default: OFF)</span>
          </label>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Selectors (Advanced)</h2>
        <p className="text-sm text-gray-600 mb-2">
          Edit CSS selectors and ad label texts. Be careful—invalid JSON will break detection.
        </p>
        <textarea
          title="Selectors JSON"
          placeholder="Enter selectors JSON here..."
          className="w-full h-64 font-mono text-sm border rounded p-2"
          value={selectorsJSON}
          onChange={(e) => setSelectorsJSON(e.target.value)}
        />
        <button onClick={save} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
          Save Selectors
        </button>
        {saveStatus && <span className="ml-2 text-sm text-green-600">{saveStatus}</span>}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-red-600">Danger Zone</h2>
        <button
          onClick={async () => {
            if (confirm('Erase all ad data? This cannot be undone.')) {
              await chrome.runtime.sendMessage({ type: 'DELETE_ALL' });
              alert('All data erased.');
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Erase All Data
        </button>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);

