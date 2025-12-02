import { Settings } from './types';

const DEFAULTS: Settings = {
  enabledPlatforms: { reddit: true, google: true, twitter: true, facebook: false },
  capturePageUrl: false,
  storeMediaUrls: false,
  theme: 'system',
  retentionDays: 365,  // Keep ads for 1 year by default
};

export async function getCurrentSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULTS, ...result.settings };
}

export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const current = await getCurrentSettings();
  await chrome.storage.local.set({
    settings: { ...current, ...partial }
  });
}

