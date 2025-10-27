import { Settings } from './types';

const DEFAULTS: Settings = {
  enabledPlatforms: { reddit: true, google: true, twitter: true },
  capturePageUrl: false,
  storeMediaUrls: false,
  theme: 'system',
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

