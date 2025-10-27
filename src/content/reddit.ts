import { AdCandidatePayload } from '../shared/types';
import { getActiveSelectors } from '../shared/selectors';

const seenElements = new WeakSet<Element>();

// Regex whole-word match
const isPromoted = (element: Element, labels: string[]): boolean => {
  const text = element.textContent || '';
  return labels.some(label => 
    new RegExp(`\\b${label}\\b`, 'i').test(text)
  );
};

async function detectRedditAds() {
  const selectors = await getActiveSelectors();
  const config = selectors.reddit;
  
  const posts = document.querySelectorAll(config.postContainer);
  console.log(`[Ad Mirror Reddit] Scanning ${posts.length} posts`);

  for (const post of posts) {
    if (seenElements.has(post)) continue;
    
    if (!isPromoted(post, config.adLabelTexts)) continue;
    
    seenElements.add(post);

    // Try primary advertiser selector, fallback to subreddit
    const advertiser = 
      post.querySelector(config.advertiser)?.textContent?.trim() ||
      post.querySelector(config.advertiserFallback)?.textContent?.trim();

    const payload: AdCandidatePayload = {
      platform: 'reddit',
      pageUrl: window.location.href,
      placement: 'feed',
      advertiserName: advertiser,
      advertiserHandle: advertiser,
      text: post.querySelector(config.title)?.textContent?.trim(),
      destUrl: (post.querySelector(config.dest) as HTMLAnchorElement)?.href,
      mediaUrls: Array.from(post.querySelectorAll(config.media))
        .map(el => (el as HTMLImageElement).src)
        .filter(Boolean)
        .slice(0, 3), // Limit to 3 images
      sponsoredLabel: 'Promoted',
    };

    console.log('[Ad Mirror Reddit] Detected ad:', payload);
    chrome.runtime.sendMessage({ type: 'AD_CANDIDATE', payload });
  }
}

// Throttled observer
let timeout: number | null = null;
const observer = new MutationObserver(() => {
  if (timeout) return;
  timeout = window.setTimeout(() => {
    detectRedditAds();
    timeout = null;
  }, 500);
});

observer.observe(document.body, { childList: true, subtree: true });
detectRedditAds();

