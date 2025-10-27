import { SelectorsConfig } from './types';

export const DEFAULT_SELECTORS: SelectorsConfig = {
  reddit: {
    postContainer: 'div[data-testid="post-container"]',
    adLabelTexts: ['Promoted'],     // Use /\bpromoted\b/i in code
    title: 'h3',
    advertiser: 'header a[href*="/user/"]',
    advertiserFallback: 'header a[href*="/r/"]',  // Subreddit ads
    dest: 'a[data-click-id="body"]',
    media: 'img, video',
  },
  google: {
    adHeaderTexts: ['Sponsored results', 'Sponsored'],  // localize later
    headingSelectors: ['h1', 'h2', 'h3', 'div', 'span'],
    sectionSelectors: ['section', '[role="region"]', 'div'],
    cardLinkSelector: 'a[href]',
  },
  twitter: {
    tweetContainer: 'article[data-testid="tweet"]',
    tweetContainerFallback: 'article',
    adLabelTexts: ['Promoted', 'Ad'],
    text: 'div[data-testid="tweetText"]',
    advertiserSelectors: [
      'a[role="link"][href^="/"]',
      'a[href^="/"][dir="ltr"]',
    ],
    media: 'img, video',
  },
};

export async function getActiveSelectors(): Promise<SelectorsConfig> {
  const settings = await chrome.storage.local.get('settings');
  const override = settings.settings?.selectorsOverride;
  return override
    ? { ...DEFAULT_SELECTORS, ...override }
    : DEFAULT_SELECTORS;
}

