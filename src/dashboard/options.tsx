import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Settings, Platform } from '../shared/types';
import { getCurrentSettings, updateSettings } from '../shared/settings';
import { DEFAULT_SELECTORS } from '../shared/selectors';
import './styles.css';

type ConfigTab = 'reddit' | 'google' | 'twitter' | 'facebook';

function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectorsJSON, setSelectorsJSON] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('reddit');
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, any>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    loadPlatformConfigs();
  }, []);

  async function loadSettings() {
    const s = await getCurrentSettings();
    setSettings(s);
    setSelectorsJSON(JSON.stringify(s.selectorsOverride || DEFAULT_SELECTORS, null, 2));
  }

  async function loadPlatformConfigs() {
    try {
      // Load the new v2 configs
      const configs: Record<string, any> = {};
      
      const platforms = ['reddit', 'google', 'twitter', 'facebook'];
      for (const platform of platforms) {
        const response = await fetch(chrome.runtime.getURL(`src/content/configs/${platform}.json`));
        configs[platform] = await response.json();
      }
      
      setPlatformConfigs(configs);
      
      // Set initial JSON for active tab
      if (configs[activeConfigTab]) {
        setSelectorsJSON(JSON.stringify(configs[activeConfigTab], null, 2));
      }
    } catch (error) {
      console.error('Failed to load platform configs:', error);
    }
  }

  function validateJSON(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      setJsonError(null);
      
      // Basic validation for platform config structure
      if (parsed.containerRules && Array.isArray(parsed.containerRules)) {
        return true;
      }
      
      // Legacy selector format
      if (parsed.reddit || parsed.google || parsed.twitter) {
        return true;
      }
      
      setJsonError('Invalid config structure: missing containerRules or platform configs');
      return false;
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      return false;
    }
  }

  async function save() {
    if (!settings) return;
    
    if (!validateJSON(selectorsJSON)) {
      setSaveStatus('❌ Invalid JSON');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    try {
      const parsed = JSON.parse(selectorsJSON);
      
      // Save to localStorage as custom override
      const storageKey = `custom-config-${activeConfigTab}`;
      await chrome.storage.local.set({ [storageKey]: parsed });
      
      setSaveStatus('✓ Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
      
      // Reload the config
      loadPlatformConfigs();
    } catch (err) {
      setSaveStatus('❌ Save failed');
      setJsonError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }

  async function exportPlatformConfig() {
    const config = {
      platform: activeConfigTab,
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      config: JSON.parse(selectorsJSON),
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-mirror-${activeConfigTab}-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSaveStatus('✓ Exported!');
    setTimeout(() => setSaveStatus(''), 2000);
  }

  function importPlatformConfig() {
    fileInputRef.current?.click();
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      
      // Extract config from wrapper if present
      const config = imported.config || imported;
      
      // Validate structure
      if (!config.containerRules && !config.reddit && !config.google) {
        throw new Error('Invalid config: missing required fields');
      }
      
      setSelectorsJSON(JSON.stringify(config, null, 2));
      setSaveStatus('✓ Imported! Click Save to apply.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus(`❌ Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  }

  async function resetToDefaults() {
    if (!confirm(`Reset ${activeConfigTab} config to defaults? This will overwrite your customizations.`)) return;
    
    // Load default config for this platform
    const storageKey = `custom-config-${activeConfigTab}`;
    await chrome.storage.local.remove(storageKey);
    
    // Reload configs
    await loadPlatformConfigs();
    
    if (platformConfigs[activeConfigTab]) {
      setSelectorsJSON(JSON.stringify(platformConfigs[activeConfigTab], null, 2));
    }
    
    setSaveStatus('✓ Reset to defaults!');
    setTimeout(() => setSaveStatus(''), 2000);
  }

  function switchConfigTab(platform: ConfigTab) {
    setActiveConfigTab(platform);
    if (platformConfigs[platform]) {
      setSelectorsJSON(JSON.stringify(platformConfigs[platform], null, 2));
      setJsonError(null);
    }
  }

  async function togglePlatform(platform: Platform) {
    if (!settings) return;
    
    const enabled = !settings.enabledPlatforms[platform];
    
    if (enabled) {
      const hosts: Record<Platform, string> = {
        reddit: 'https://*.reddit.com/*',
        google: 'https://www.google.com/*',
        twitter: 'https://*.twitter.com/*',
        facebook: 'https://*.facebook.com/*',
      };
      
      try {
        await chrome.permissions.request({
          origins: [hosts[platform]],
        });
      } catch (err) {
        console.error('Permission request failed:', err);
        return;
      }
    }
    
    const updated = {
      ...settings,
      enabledPlatforms: { ...settings.enabledPlatforms, [platform]: enabled },
    };
    setSettings(updated);
    await updateSettings(updated);
  }

  async function toggleDebugMode() {
    // Send message to current tab to enable debug overlay
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      const config = platformConfigs[activeConfigTab];
      chrome.tabs.sendMessage(tab.id, {
        type: 'ENABLE_DEBUG',
        platform: activeConfigTab,
        config,
      });
      setSaveStatus('✓ Debug mode enabled on current tab');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  }

  if (!settings) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ad Mirror Settings v2.0</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Platforms</h2>
        <div className="space-y-2">
          {(['reddit', 'google', 'twitter', 'facebook'] as Platform[]).map(platform => (
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
        <h2 className="text-xl font-semibold mb-3">Detection Configuration (Advanced)</h2>
        
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Advanced users only:</strong> These are the new v2.0 layered detection configs with containerRules, fieldRules, and validators.
            Invalid configurations will break ad detection. Test changes thoroughly.
          </p>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {(['reddit', 'google', 'twitter', 'facebook'] as ConfigTab[]).map(platform => (
            <button
              key={platform}
              onClick={() => switchConfigTab(platform)}
              className={`px-4 py-2 capitalize rounded-t transition-colors ${
                activeConfigTab === platform
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Config info */}
        {platformConfigs[activeConfigTab] && (
          <div className="mb-2 text-sm text-gray-600">
            Platform: <strong>{platformConfigs[activeConfigTab].platform}</strong> • 
            Version: <strong>{platformConfigs[activeConfigTab].version}</strong> • 
            Container Rules: <strong>{platformConfigs[activeConfigTab].containerRules?.length || 0}</strong> • 
            Field Rules: <strong>{platformConfigs[activeConfigTab].fieldRules?.length || 0}</strong>
          </div>
        )}

        {/* JSON editor */}
        <textarea
          title="Platform Configuration JSON"
          placeholder="Loading configuration..."
          className={`w-full h-96 font-mono text-xs border rounded p-3 ${
            jsonError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          value={selectorsJSON}
          onChange={(e) => {
            setSelectorsJSON(e.target.value);
            validateJSON(e.target.value);
          }}
          spellCheck={false}
        />
        
        {jsonError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-700">
            <strong>Validation Error:</strong> {jsonError}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={save}
            disabled={!!jsonError}
            className={`px-4 py-2 rounded font-medium ${
              jsonError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Save Config
          </button>
          <button
            onClick={exportPlatformConfig}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Config
          </button>
          <button
            onClick={importPlatformConfig}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Import Config
          </button>
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset to Defaults
          </button>
          <button
            onClick={toggleDebugMode}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            🔍 Enable Debug Mode
          </button>
          {saveStatus && (
            <span className={`ml-2 text-sm self-center font-medium ${
              saveStatus.includes('❌') ? 'text-red-600' : 'text-green-600'
            }`}>
              {saveStatus}
            </span>
          )}
        </div>

        <input
          title="Import Config File"
          type="file"
          ref={fileInputRef}
          accept=".json"
          className="hidden"
          onChange={handleFileImport}
        />

        {/* Documentation */}
        <details className="mt-6 p-4 bg-gray-50 border rounded">
          <summary className="cursor-pointer font-semibold text-gray-700">
            📖 Configuration Documentation
          </summary>
          <div className="mt-3 text-sm text-gray-600 space-y-3">
            <div>
              <strong>Container Rules:</strong> Strategies to find ad containers
              <ul className="list-disc ml-5 mt-1">
                <li><code>type: "css"</code> - Direct CSS selector</li>
                <li><code>type: "label-led"</code> - Find by label text (e.g., "Promoted")</li>
                <li><code>type: "attribute"</code> - Match by data attribute</li>
              </ul>
            </div>
            <div>
              <strong>Field Rules:</strong> Extract specific data from containers
              <ul className="list-disc ml-5 mt-1">
                <li><code>field</code> - advertiser, headline, body, destinationUrl, etc.</li>
                <li><code>selector</code> - CSS selector relative to container</li>
                <li><code>attr</code> - Optional: extract from attribute (href, src)</li>
                <li><code>score</code> - Priority (0-1), higher = preferred</li>
              </ul>
            </div>
            <div>
              <strong>Validators:</strong> Score and filter candidates
              <ul className="list-disc ml-5 mt-1">
                <li><code>required-field</code> - Field must be present</li>
                <li><code>label-pattern</code> - Label must match regex</li>
                <li><code>url-valid</code> - Destination URL must be valid</li>
                <li><code>min-text-length</code> - Minimum text length</li>
              </ul>
            </div>
          </div>
        </details>
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
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Erase All Data
        </button>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);
