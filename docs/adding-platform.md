# Adding New Platforms to Ad Mirror

This guide explains how to add support for detecting ads on new platforms (websites/apps).

## Overview

Ad Mirror uses a **plugin-based architecture** where each platform has:
1. A **detection config** (JSON file) defining selectors and rules
2. A **plugin implementation** (TypeScript file) that uses the config
3. **Registration** in the detection registry

## Step-by-Step Guide

### Step 1: Create a Detection Config

Create a new JSON file in `src/content/configs/` named after your platform (e.g., `facebook.json`).

**Example: `src/content/configs/facebook.json`**

```json
{
  "platform": "facebook",
  "version": "1.0.0",
  "hostnames": ["facebook.com"],
  "rules": [
    {
      "id": "sponsored-post",
      "type": "css",
      "selector": "div[data-pagelet]",
      "confidence": 0.90
    },
    {
      "id": "sponsored-label-text",
      "type": "text",
      "textPattern": "\\bSponsored\\b",
      "confidence": 0.95
    }
  ],
  "extractors": {
    "advertiserName": [
      "h4 a",
      "strong a"
    ],
    "text": [
      "div[data-ad-preview]",
      "div[dir='auto']"
    ],
    "destination": [
      "a[role='link']"
    ],
    "media": [
      "img",
      "video"
    ]
  }
}
```

**Config Fields:**
- **platform**: Unique identifier for your platform
- **version**: Config version (use semantic versioning)
- **hostnames**: Array of hostnames to match (e.g., `["facebook.com", "fb.com"]`)
- **rules**: Detection rules to identify ads
  - **id**: Unique rule identifier
  - **type**: `"css"`, `"text"`, or `"attribute"`
  - **selector**: CSS selector (for css type)
  - **textPattern**: Regex pattern (for text type)
  - **confidence**: 0-1 confidence score
- **extractors**: CSS selectors to extract ad data
  - Arrays of selectors to try in order (first match wins)

### Step 2: Create a Plugin Implementation

Create a new TypeScript file in `src/content/platforms/` named after your platform (e.g., `facebook.ts`).

**Example: `src/content/platforms/facebook.ts`**

```typescript
import { DetectionPlugin, PlatformDetectionConfig, AdDetection } from '../../shared/types/platform';
import { AdCandidatePayload } from '../../shared/types';

const seenElements = new WeakSet<Element>();
let observer: MutationObserver | null = null;
let config: PlatformDetectionConfig | null = null;

export function createFacebookPlugin(): DetectionPlugin {
  return {
    id: 'facebook',
    
    matchHostname(hostname: string): boolean {
      return hostname.includes('facebook.com') || hostname.includes('fb.com');
    },
    
    init(platformConfig: PlatformDetectionConfig): void {
      config = platformConfig;
      console.log('[Facebook Plugin] Initializing with config:', config);
      
      // Start observing DOM changes
      observer = new MutationObserver(throttledDetect);
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Initial detection
      detectFacebookAds();
    },
    
    teardown(): void {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      config = null;
    },
  };
}

// Throttle detection to avoid performance issues
let detectTimeout: number | null = null;

function throttledDetect() {
  if (detectTimeout) return;
  detectTimeout = window.setTimeout(() => {
    detectFacebookAds();
    detectTimeout = null;
  }, 500);
}

function detectFacebookAds() {
  if (!config) return;
  
  // Find potential ad containers using rules
  const containers = findAdContainers();
  
  console.log(`[Facebook Plugin] Scanning ${containers.length} potential ads`);
  
  for (const container of containers) {
    if (seenElements.has(container)) continue;
    
    // Check if this is actually an ad
    if (!isAd(container)) continue;
    
    seenElements.add(container);
    
    // Extract ad data
    const detection = extractAdData(container);
    if (detection) {
      sendAdCandidate(detection);
    }
  }
}

function findAdContainers(): Element[] {
  if (!config) return [];
  
  // Use CSS rules from config
  const cssRules = config.rules.filter(r => r.type === 'css');
  const containers: Element[] = [];
  
  for (const rule of cssRules) {
    if (rule.selector) {
      containers.push(...Array.from(document.querySelectorAll(rule.selector)));
    }
  }
  
  return containers;
}

function isAd(element: Element): boolean {
  if (!config) return false;
  
  // Check text patterns from rules
  const textRules = config.rules.filter(r => r.type === 'text');
  for (const rule of textRules) {
    if (rule.textPattern) {
      const regex = new RegExp(rule.textPattern, 'i');
      if (regex.test(element.textContent || '')) {
        return true;
      }
    }
  }
  
  return false;
}

function extractAdData(element: Element): AdDetection | null {
  if (!config) return null;
  
  const extractors = config.extractors;
  if (!extractors) return null;
  
  // Extract advertiser name
  let advertiserName = '';
  for (const selector of extractors.advertiserName || []) {
    const el = element.querySelector(selector);
    if (el?.textContent?.trim()) {
      advertiserName = el.textContent.trim();
      break;
    }
  }
  
  // Extract ad text
  let text = '';
  for (const selector of extractors.text || []) {
    const el = element.querySelector(selector);
    if (el?.textContent?.trim()) {
      text = el.textContent.trim();
      break;
    }
  }
  
  // Extract destination URL
  let destinationUrl = '';
  for (const selector of extractors.destination || []) {
    const el = element.querySelector(selector) as HTMLAnchorElement;
    if (el?.href) {
      destinationUrl = el.href;
      break;
    }
  }
  
  // Extract media URLs
  const mediaUrls: string[] = [];
  if (extractors.media) {
    for (const selector of extractors.media) {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        const src = (el as HTMLImageElement | HTMLVideoElement).src;
        if (src) mediaUrls.push(src);
      });
    }
  }
  
  return {
    id: crypto.randomUUID(),
    platform: 'facebook',
    detectedAt: Date.now(),
    advertiserName,
    creativeText: text,
    destinationUrl,
    mediaUrls: mediaUrls.slice(0, 3), // Limit to 3
    labelText: 'Sponsored',
    placement: 'feed',
    meta: {},
  };
}

function sendAdCandidate(detection: AdDetection) {
  const payload: AdCandidatePayload = {
    platform: 'facebook' as any, // Add to Platform type in types.ts
    pageUrl: window.location.href,
    placement: detection.placement || 'feed',
    advertiserName: detection.advertiserName,
    text: detection.creativeText,
    destUrl: detection.destinationUrl,
    mediaUrls: detection.mediaUrls,
    sponsoredLabel: detection.labelText,
  };
  
  console.log('[Facebook Plugin] Detected ad:', payload);
  chrome.runtime.sendMessage({ type: 'AD_CANDIDATE', payload });
}
```

### Step 3: Register the Plugin

Add your plugin to the detection registry in `src/content/detectionRegistry.ts`:

```typescript
// 1. Import your config
import facebookConfig from './configs/facebook.json';

// 2. Import your plugin factory
import { createFacebookPlugin } from './platforms/facebook';

// 3. Add to loadConfig function
export function loadConfig(platformId: string): PlatformDetectionConfig | null {
  switch (platformId) {
    case 'facebook':
      return facebookConfig as PlatformDetectionConfig;
    // ... existing cases
  }
}

// 4. Add to createPlugin function
function createPlugin(platformId: string): DetectionPlugin | null {
  switch (platformId) {
    case 'facebook':
      return createFacebookPlugin();
    // ... existing cases
  }
}

// 5. Add to startDetection function
export function startDetection() {
  const plugins = [
    { id: 'facebook', hostnames: ['facebook.com', 'fb.com'] },
    // ... existing plugins
  ];
  // ... rest of function
}
```

### Step 4: Update Type Definitions

Add your platform to the `Platform` type in `src/shared/types/index.ts`:

```typescript
export type Platform = 'reddit' | 'google' | 'twitter' | 'facebook';
```

### Step 5: Update Manifest Permissions

Add host permissions in `src/manifest.json`:

```json
{
  "host_permissions": [
    "https://*.facebook.com/*",
    "https://*.fb.com/*"
  ]
}
```

### Step 6: Test Your Plugin

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Test detection:**
   - Visit the platform (e.g., facebook.com)
   - Open DevTools Console
   - Look for detection logs: `[Facebook Plugin] Detected ad:`

4. **Enable debug overlay:**
   - Open Ad Mirror popup
   - Go to Settings
   - Click "Debug Detection" for your platform
   - Detected ads will be highlighted in red

### Step 7: Submit Your Contribution

1. Test thoroughly on different pages
2. Document any platform-specific quirks
3. Submit a Pull Request with:
   - Config JSON
   - Plugin implementation
   - Updated registry and types
   - Test results/screenshots

## Tips & Best Practices

### Finding Selectors

1. **Use Browser DevTools:**
   - Right-click on an ad → "Inspect"
   - Find unique identifiers (data attributes, classes, IDs)
   - Test selectors in Console: `document.querySelectorAll('your-selector')`

2. **Look for "Sponsored" labels:**
   - Ads usually have visible labels
   - Find the parent container of that label

3. **Test on multiple pages:**
   - Homepage, search results, user profiles
   - Different ad types (image, video, carousel)

### Performance Considerations

- Use `WeakSet` to track seen elements (automatic garbage collection)
- Throttle detection (500ms is usually good)
- Limit media extraction (3-5 items max)
- Use specific selectors (avoid `*` or very broad queries)

### Debugging

- Check console for errors
- Use debug overlay to visualize detection
- Test with network throttled (slow 3G)
- Test with uBlock Origin disabled

### Common Issues

**Selector breaks when page updates:**
- Use multiple fallback selectors in extractors
- Prioritize data attributes over classes
- Test on desktop and mobile web

**False positives:**
- Make text patterns more specific
- Require multiple rules to match
- Check for unique container attributes

**Duplicate detections:**
- Ensure `WeakSet` is working
- Check that `seenElements.add()` is called

## Community Selector Packs

Once your platform is working, you can share selector configs:

1. Create a gist or repo with just the JSON config
2. Include version number and test date
3. Share in Ad Mirror community discussions

## Need Help?

- Check existing plugins for reference
- Open a GitHub issue with questions
- Join community discussions

## Next Steps

After adding basic detection, you can enhance it with:
- Better placement detection (feed vs sidebar vs banner)
- Advertiser handle extraction (for social platforms)
- Multiple ad types per platform
- Shadow DOM support
- Dynamic content handling

