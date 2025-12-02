# Privacy Features

Ad Mirror is built with privacy as a core principle. This document explains our privacy architecture and the design decisions that protect your data.

## Privacy Philosophy

**Your data belongs to you.**

Ad Mirror captures information about ads you see, but that information stays entirely on your device. We don't track you - we help you track what's tracking *you*.

## Core Privacy Principles

### 1. 100% Local Storage

**All data stays on your device**

- Stored in browser's IndexedDB
- Never sent to external servers
- No cloud storage
- No analytics or telemetry
- No network calls (except loading extension pages)

```typescript
// All storage is local
import Dexie from 'dexie';

const db = new Dexie('AdMirrorDB');
db.version(1).stores({
  ads: '++id, platform, detectedAt, advertiserName'
});

// No fetch(), no XMLHttpRequest, no external APIs
```

### 2. Privacy Defaults

**Sensitive data OFF by default**

By default, Ad Mirror does NOT capture:
- **Page URLs** - Where you saw the ad
- **Media URLs** - Links to ad images/videos

These must be explicitly enabled in settings.

```typescript
// Default settings
const DEFAULT_SETTINGS = {
  capturePageUrls: false,      // OFF
  storeMediaUrls: false,        // OFF
  platforms: {
    reddit: true,
    google: true,
    twitter: true
  }
};
```

**Why?**
- URLs can contain tracking parameters
- URLs reveal browsing patterns
- Media URLs may include session identifiers

### 3. Minimal Permissions

**Only what's necessary**

Ad Mirror requests:
- `storage` - For settings and data
- `offscreen` - For stable IndexedDB
- `host_permissions` - Only for enabled platforms

Ad Mirror does NOT request:
- `webRequest` - Can't intercept network traffic
- `cookies` - Can't access your cookies
- `tabs` (full access) - Can only send messages
- `history` - Can't see browsing history
- `bookmarks` - Can't access bookmarks

```json
// manifest.json
{
  "permissions": ["storage", "offscreen"],
  "host_permissions": [
    "https://*.reddit.com/*",
    "https://*.google.com/*",
    "https://*.twitter.com/*",
    "https://*.x.com/*"
  ]
}
```

### 4. No Tracking

**Zero telemetry**

- No usage analytics
- No error reporting to external servers
- No version checking (except browser's auto-update)
- No unique user IDs
- No fingerprinting

```typescript
// NO code like this exists in Ad Mirror:
// ❌ fetch('https://analytics.example.com/event')
// ❌ Sentry.captureException(error)
// ❌ ga('send', 'pageview')
```

### 5. Transparent Processing

**All processing is local and visible**

- Open source code
- Inspect IndexedDB in DevTools
- Export your data anytime
- Delete all data with one click

## Privacy Controls

### Settings Page

Open **Extension Options** to control privacy:

#### Platform Toggles

Enable/disable detection per platform:

```typescript
settings.platforms = {
  reddit: true,     // Enabled
  google: false,    // Disabled
  twitter: true,
  facebook: false
};
```

When disabled, Ad Mirror:
- Doesn't inject content scripts
- Doesn't detect ads
- Doesn't store any data

#### Capture Page URLs

**Default: OFF**

When enabled:
- Stores the full URL where ad was seen
- Example: `https://www.reddit.com/r/technology/comments/abc123/`

When disabled:
- No URL information captured
- Can't tell where you saw the ad

**Privacy implications**:
- URLs can reveal browsing patterns
- May contain personal identifiers
- May include tracking parameters

```typescript
if (settings.capturePageUrls) {
  ad.pageUrl = sanitizeUrl(window.location.href);
} else {
  ad.pageUrl = null;  // Not captured
}
```

#### Store Media URLs

**Default: OFF**

When enabled:
- Stores links to ad images/videos
- Example: `https://cdn.example.com/ad-image.jpg`

When disabled:
- No media links captured
- Can see ad text but not images

**Privacy implications**:
- Media URLs may include session tokens
- Loading media might be tracked
- URLs can reveal content preferences

```typescript
if (settings.storeMediaUrls) {
  ad.mediaUrls = extractMediaUrls(element);
} else {
  ad.mediaUrls = [];  // Empty
}
```

## Data Captured

### Always Captured

These fields are ALWAYS captured (privacy-safe):

- **Platform** - Which site (reddit, google, twitter)
- **Advertiser Name** - Who ran the ad
- **Ad Text** - Content of the ad
- **Label Text** - "Promoted", "Sponsored", etc.
- **Detected At** - Timestamp
- **Unique ID** - Local UUID

```typescript
interface AdCore {
  id: string;
  platform: 'reddit' | 'google' | 'twitter';
  advertiserName: string;
  text: string;
  labelText: string;
  detectedAt: number;
}
```

### Conditionally Captured

These fields depend on settings:

- **Page URL** - If `capturePageUrls` enabled
- **Destination URL** - If `capturePageUrls` enabled
- **Media URLs** - If `storeMediaUrls` enabled

```typescript
interface AdOptional {
  pageUrl?: string;          // Controlled by capturePageUrls
  destinationUrl?: string;   // Controlled by capturePageUrls
  mediaUrls?: string[];      // Controlled by storeMediaUrls
}
```

### Never Captured

These are NEVER captured:

- Your identity/username
- Cookies or session tokens
- Browser fingerprint
- IP address
- Location data
- Device information
- Other tabs or browsing history
- Personal messages or emails
- Payment information

## Data Processing

### URL Sanitization

When URLs ARE captured, they're sanitized:

```typescript
function sanitizeUrl(url: string): string {
  const parsed = new URL(url);
  
  // Remove tracking parameters
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign',
    'fbclid', 'gclid', 'msclkid',
    'ref', 'source', 'campaign_id'
  ];
  
  for (const param of trackingParams) {
    parsed.searchParams.delete(param);
  }
  
  return parsed.toString();
}
```

**Example**:
```
Before: https://example.com/page?utm_source=reddit&fbclid=abc123
After:  https://example.com/page
```

### Stable Hashing

Ads are deduplicated using stable hashing:

```typescript
function generateStableHash(ad: AdCandidate): string {
  const stable = {
    platform: ad.platform,
    advertiser: ad.advertiserName?.toLowerCase().trim(),
    text: ad.text?.slice(0, 100)  // First 100 chars
  };
  
  return hashObject(stable);
}
```

**Privacy benefit**: Hash is platform-specific, doesn't expose personal data.

### No External Communication

Content scripts are isolated:

```typescript
// Content scripts can ONLY:
// 1. Read DOM
const elements = document.querySelectorAll('.ad');

// 2. Send messages to background
chrome.runtime.sendMessage({ type: 'AD_CANDIDATE', data });

// Content scripts CANNOT:
// ❌ Make network requests
// ❌ Access other tabs
// ❌ Read cookies directly
// ❌ Access local files
```

## Data Access

### You Control Your Data

**Export Anytime**:
```typescript
// Export all data as JSON
const ads = await db.ads.toArray();
downloadJSON(ads, 'my-ads.json');

// Export as CSV
const csv = convertToCSV(ads);
downloadCSV(csv, 'my-ads.csv');
```

**Inspect Directly**:
```
1. Open DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB
4. Browse AdMirrorDB
```

**Delete All**:
```typescript
// Permanently delete all data
await db.delete();
await db.open();  // Recreate empty
```

### No Backdoors

- No "sync" feature that uploads data
- No "cloud backup" that stores data elsewhere
- No "phone home" mechanism
- No remote configuration that could enable tracking

All code is open source and auditable.

## Threat Model

### What Ad Mirror Protects Against

✅ **Platform tracking** - They don't know you're archiving ads  
✅ **Third-party tracking** - No external services  
✅ **Data breaches** - No server to breach  
✅ **Subpoenas** - No data to subpoena (we don't have it)  
✅ **Insider threats** - No employees with data access  

### What Ad Mirror Does NOT Protect Against

❌ **Local device access** - If someone has physical access to your device, they can read IndexedDB  
❌ **Browser vulnerabilities** - We rely on Chrome's security  
❌ **Malware** - Local malware can read browser data  
❌ **Compromised extensions** - Other extensions could access storage  

## Future Privacy Features

### Planned for v1.0

**Encrypted Export**:
```typescript
// Export with password encryption
const encrypted = await encryptData(ads, password);
downloadFile(encrypted, 'my-ads.encrypted');
```

**Encrypted Sync** (Optional):
```typescript
// Zero-knowledge sync across devices
// Your data encrypted before leaving device
// Server can't read it
const encrypted = await encryptForSync(ads, encryptionKey);
await uploadToSync(encrypted);  // End-to-end encrypted
```

**Data Retention Limits**:
```typescript
settings.dataRetention = {
  maxAgeDays: 90,        // Auto-delete ads older than 90 days
  maxCount: 10000,       // Keep at most 10,000 ads
  autoCleanup: true      // Enable automatic cleanup
};
```

## Comparison with Competitors

### Ad Mirror vs Ad Blockers

**Ad Blockers**:
- Block ads before they load
- Often upload usage data
- May accept "acceptable ads" payments
- Block content wholesale

**Ad Mirror**:
- Observes ads after they load
- Zero telemetry, 100% local
- No "acceptable ads" - logs everything
- Non-invasive observation

### Ad Mirror vs Privacy Tools

**Privacy Extensions** (Ghostery, Privacy Badger):
- Block trackers
- Some upload data
- Interfere with page function

**Ad Mirror**:
- Doesn't block anything
- No data upload
- Doesn't interfere with pages
- Complements privacy tools

## Compliance

### GDPR (General Data Protection Regulation)

Ad Mirror doesn't need to comply because:
- No data processing on behalf of others
- No data transfer
- No data storage on servers
- User has complete control

### CCPA (California Consumer Privacy Act)

Ad Mirror doesn't sell data because:
- No data collection on behalf of businesses
- No data sharing
- No commercial sale
- User controls all data

## Transparency

### Open Source

All code is available for inspection:
- Review data collection practices
- Verify no tracking
- Audit storage mechanisms
- Check network requests (there are none)

### No Hidden Features

- No A/B testing
- No feature flags controlled remotely
- No experimental tracking
- What you see is what you get

## Best Practices

### For Maximum Privacy

1. **Keep URL capture OFF** - Default setting
2. **Keep media URLs OFF** - Default setting
3. **Periodically export and delete** - Limit data retention
4. **Review captured data** - Inspect what's stored
5. **Use with other privacy tools** - uBlock Origin, Privacy Badger
6. **Keep extension updated** - Security fixes
7. **Review permissions** - Check `chrome://extensions/`

### For Research/Analysis

If you need URLs for research:

1. **Enable temporarily** - Turn on when needed
2. **Export immediately** - Get your data out
3. **Disable again** - Back to privacy mode
4. **Sanitize exports** - Remove personal info before sharing

## Privacy FAQ

**Q: Can platforms detect Ad Mirror?**  
A: No. We only read the DOM, just like any website visitor.

**Q: Does Ad Mirror report my usage?**  
A: No. Zero telemetry, zero reporting, zero data leaves your device.

**Q: Can you see my data?**  
A: No. Your data never reaches us. It's stored locally on your device.

**Q: What if your servers are hacked?**  
A: We don't have servers. Nothing to hack.

**Q: Can law enforcement request my data?**  
A: Not from us - we don't have it. They'd need your physical device.

**Q: Do you comply with subpoenas?**  
A: No data to provide. All data is local to your device.

**Q: Can I trust you?**  
A: Don't trust - verify. Code is open source. Inspect it yourself.

## Contact

Privacy questions or concerns:
- Open an issue on GitHub
- Review the code yourself
- Join community discussions

We take privacy seriously. If you find any privacy issues, please report them immediately.

---

**[← Back: Selector Improvements](selector-improvements.md)** | **[Documentation Home](../index.md)** | **[Next: Operations →](../operations/ci-cd.md)**

