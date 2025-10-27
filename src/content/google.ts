import { AdCandidatePayload } from '../shared/types';
import { getActiveSelectors } from '../shared/selectors';

const seenElements = new WeakSet<Element>();

// Find "Sponsored results" block
async function findSponsoredBlock(): Promise<{ section: Element; cards: Element[] } | null> {
  const config = (await getActiveSelectors()).google;
  
  // Find all heading candidates
  const headings = Array.from(
    document.querySelectorAll(config.headingSelectors.join(','))
  ).filter(h => 
    config.adHeaderTexts.some(text => 
      h.textContent?.trim().toLowerCase() === text.toLowerCase()
    )
  );

  for (const heading of headings) {
    // Walk up to find section container
    const section = heading.closest(config.sectionSelectors.join(','));
    if (!section) continue;

    // Find all link cards in this section
    const links = Array.from(section.querySelectorAll(config.cardLinkSelector));
    // Get unique parent containers (cards)
    const cards = [...new Set(
      links.map(a => a.closest('div, article, li')).filter(Boolean)
    )] as Element[];

    if (cards.length > 0) {
      console.log('[Ad Mirror Google] Found sponsored block:', {
        heading: heading.textContent,
        cardCount: cards.length
      });
      return { section, cards };
    }
  }

  return null;
}

async function detectGoogleAds() {
  const block = await findSponsoredBlock();
  if (!block) {
    console.log('[Ad Mirror Google] No sponsored block found');
    return;
  }

  for (const card of block.cards) {
    if (seenElements.has(card)) continue;
    seenElements.add(card);

    const titleLink = card.querySelector('a[href]') as HTMLAnchorElement;
    const allText = card.textContent?.trim() || '';

    const payload: AdCandidatePayload = {
      platform: 'google',
      pageUrl: window.location.href,
      placement: 'search',
      advertiserName: titleLink?.textContent?.trim() || 'Unknown',
      text: allText.substring(0, 500),
      destUrl: titleLink?.href,
      sponsoredLabel: 'Sponsored',
    };

    console.log('[Ad Mirror Google] Detected ad:', payload);
    chrome.runtime.sendMessage({ type: 'AD_CANDIDATE', payload });
  }
}

// Throttled observer
let timeout: number | null = null;
const observer = new MutationObserver(() => {
  if (timeout) return;
  timeout = window.setTimeout(() => {
    detectGoogleAds();
    timeout = null;
  }, 500);
});

observer.observe(document.body, { childList: true, subtree: true });
detectGoogleAds();

