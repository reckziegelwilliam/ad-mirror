# Ad Mirror - Quick Start Guide

## What You Have

A complete Chrome MV3 extension that:
- ✅ Detects ads on Reddit, Google Search, and Twitter/X
- ✅ Stores metadata locally in IndexedDB (privacy-first)
- ✅ Provides searchable gallery in popup
- ✅ Exports data as JSON/CSV
- ✅ Editable CSS selectors for community updates
- ✅ Architected for v1+ features (sync, analytics, cross-browser)

## Installation & Testing

### 1. Install Dependencies

```bash
cd /Users/liamreckziegel/Desktop/ad-mirror
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates the `dist/` folder with your compiled extension.

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist` folder

You should see "Ad Mirror" in your extensions list!

### 4. Test It

**Test Reddit:**
1. Visit https://www.reddit.com (logged in)
2. Scroll until you see a "Promoted" post
3. Click the Ad Mirror extension icon
4. You should see the ad in the gallery!

**Test Google:**
1. Search for something commercial (e.g., "buy laptop")
2. Look for "Sponsored" results at the top
3. Click the extension icon
4. Verify the ad appears

**Test Twitter/X:**
1. Visit https://twitter.com or https://x.com
2. Scroll your feed until you see a "Promoted" tweet
3. Click the extension icon
4. Verify the ad appears

### 5. Try Features

**Filters:**
- Use the platform dropdown to filter by Reddit/Google/Twitter
- Use time range dropdown (24h, 7d, all time)
- Type in the search box to find specific ads

**Export:**
- Click "Export JSON" to download structured data
- Click "Export CSV" to download spreadsheet format

**Settings:**
- Click "Settings" button in popup
- Toggle platforms on/off
- Toggle privacy settings (page URLs, media URLs)
- Edit CSS selectors (advanced)
- Erase all data (danger zone)

## Development Mode

For active development with auto-reload:

```bash
npm run dev
```

Then load the `dist` folder in Chrome. The extension will rebuild automatically when you edit source files.

## Project Structure

```
src/
├── background/index.ts      # Service worker (message router)
├── content/                 # Ad detectors (Reddit, Google, Twitter)
├── dashboard/               # Popup & Options UI (React + Tailwind)
├── offscreen/db.ts          # IndexedDB layer (Dexie)
├── shared/                  # Types, settings, selectors, utilities
└── manifest.json            # Extension manifest
```

## Next Steps

### MVP Refinement
- Update CSS selectors if sites have changed
- Test across different pages and layouts
- Add more robust error handling
- Improve UI/UX in popup

### V1+ Features (from your plan)
1. **More Platforms**: Facebook, Instagram, YouTube, LinkedIn
2. **Analytics**: Local-only insights (top advertisers, topics)
3. **Cross-Browser**: Firefox and Edge builds
4. **Selector Packs**: Import/export community-maintained selectors
5. **Encrypted Sync**: Zero-knowledge sync across devices

### Selector Updates

If detection breaks (sites change their HTML):

1. Open Settings → "Selectors (Advanced)"
2. Inspect the site's HTML to find new selectors
3. Update the JSON configuration
4. Click "Save Selectors"

Example:
```json
{
  "reddit": {
    "postContainer": "[data-testid='post-container']",
    "adLabelTexts": ["Promoted", "Sponsored"],
    ...
  }
}
```

### Testing Checklist

- [ ] Reddit: Detect "Promoted" posts
- [ ] Google: Detect "Sponsored" results
- [ ] Twitter/X: Detect "Promoted" tweets
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] Privacy defaults (no pageUrl/mediaUrls)
- [ ] Toggle privacy settings ON → data appears
- [ ] Platform toggles disable detection
- [ ] Erase all data clears gallery
- [ ] Selector editing persists

## Debugging

**Service Worker Console:**
- Go to `chrome://extensions/`
- Find "Ad Mirror"
- Click the "service worker" link

**Popup DevTools:**
- Right-click the popup → "Inspect"

**Content Script Logs:**
- Open DevTools on Reddit/Google/Twitter
- Check console for content script output

**IndexedDB:**
- DevTools → Application → IndexedDB → AdMirrorDB

## Known Limitations (MVP)

- No network interceptor (webRequest) - relies on DOM detection
- Selectors may break when sites update (user-editable as workaround)
- No automated tests (manual testing only for MVP)
- Single-language support (English ad labels only)

## Files You Can Edit

**Easy:**
- `src/shared/selectors.ts` - Default CSS selectors
- `src/dashboard/popup.tsx` - Gallery UI
- `src/dashboard/options.tsx` - Settings UI
- `tailwind.config.js` - Styling theme

**Moderate:**
- `src/content/*.ts` - Detection logic per platform
- `src/background/index.ts` - Message routing
- `src/shared/normalize.ts` - Data transformation

**Advanced:**
- `src/offscreen/db.ts` - Database schema & queries
- `vite.config.ts` - Build configuration
- `src/manifest.json` - Extension permissions

## Packaging for Distribution

```bash
npm run build
npm run zip
```

Creates `ad-mirror.zip` ready for:
- Chrome Web Store submission
- Manual distribution
- GitHub releases

## Support & Documentation

- Full plan: `ad-mirror-mvp.plan.md`
- Development guide: `DEVELOPMENT.md`
- Main README: `README.md`

## Privacy Reminder

This extension stores data **only on your device**. No servers, no tracking, no data leaves your machine by default. Page URLs and media URLs are OFF by default. You control your data.

---

**You're ready to go!** 🎉

Run the tests above, and if everything works, you have a functional Ad Mirror MVP. From here, you can refine the MVP or start building v1+ features from your original plan.

