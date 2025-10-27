import { AdCandidatePayload } from '../shared/types';
import { getActiveSelectors } from '../shared/selectors';

const seenElements = new WeakSet<Element>();

const isPromoted = (element: Element, labels: string[]): boolean => {
  const text = element.textContent || '';
  return labels.some(label => 
    new RegExp(`\\b${label}\\b`, 'i').test(text)
  );
};

async function detectTwitterAds() {
  const selectors = await getActiveSelectors();
  const config = selectors.twitter;
  
  // Try primary selector, fallback to broader search
  let tweets = document.querySelectorAll(config.tweetContainer);
  if (tweets.length === 0) {
    tweets = document.querySelectorAll(config.tweetContainerFallback);
  }
  
  console.log(`[Ad Mirror Twitter] Scanning ${tweets.length} tweets`);

  for (const tweet of tweets) {
    if (seenElements.has(tweet)) continue;
    
    if (!isPromoted(tweet, config.adLabelTexts)) continue;
    
    seenElements.add(tweet);

    // Try multiple advertiser selectors
    let advertiser = '';
    for (const selector of config.advertiserSelectors) {
      const el = tweet.querySelector(selector);
      if (el?.textContent?.trim()) {
        advertiser = el.textContent.trim();
        break;
      }
    }

    const payload: AdCandidatePayload = {
      platform: 'twitter',
      pageUrl: window.location.href,
      placement: 'feed',
      advertiserName: advertiser || 'Unknown',
      text: tweet.querySelector(config.text)?.textContent?.trim(),
      mediaUrls: Array.from(tweet.querySelectorAll(config.media))
        .map(el => (el as HTMLImageElement | HTMLVideoElement).src)
        .filter(Boolean)
        .slice(0, 2),
      sponsoredLabel: 'Promoted',
    };

    console.log('[Ad Mirror Twitter] Detected ad:', payload);
    chrome.runtime.sendMessage({ type: 'AD_CANDIDATE', payload });
  }
}

// Throttled observer
let timeout: number | null = null;
const observer = new MutationObserver(() => {
  if (timeout) return;
  timeout = window.setTimeout(() => {
    detectTwitterAds();
    timeout = null;
  }, 500);
});

observer.observe(document.body, { childList: true, subtree: true });
detectTwitterAds();

