# Ad Mirror

Your private gallery of ads shown to you on Reddit, Google, and Twitter/X.

## Privacy-First Philosophy

Ad Mirror operates with a strict privacy-first approach:

- **100% Local Storage**: All ad data stays on your device in IndexedDB. No servers, no cloud.
- **Privacy Defaults**: Page URLs and media URLs are **OFF by default**. You control what gets stored.
- **No Tracking**: We don't track you. We help you track what's tracking you.
- **Minimal Permissions**: Only the host permissions needed for detection on enabled platforms.

## Features

- 🔍 **Ad Detection**: Automatically detect ads on Reddit, Google Search, and Twitter/X
- 📊 **Private Gallery**: Browse all captured ads in a searchable interface
- 🔒 **Privacy Controls**: Toggle what data gets stored (page URLs, media URLs)
- 📤 **Export**: Export your ad data as JSON or CSV
- 🗑️ **Full Control**: Erase all data with one click
- ⚙️ **Customizable Selectors**: Edit CSS selectors for ad detection (advanced)

## Installation

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Production Build

```bash
npm run build
npm run zip
```

This creates a `ad-mirror.zip` file ready for distribution.

## Usage

### Basic Usage

1. Browse Reddit, Google Search, or Twitter/X normally
2. The extension automatically detects ads and stores metadata locally
3. Click the extension icon to view your ad gallery
4. Filter by platform, time range, or search text
5. Export your data or erase it anytime

### Privacy Settings

Open the Settings page (click "Settings" in the popup) to control:

- **Platform Toggles**: Enable/disable detection per platform
- **Capture Page URLs**: OFF by default (privacy)
- **Store Media URLs**: OFF by default (privacy)

### Updating Selectors

If ad detection breaks (sites change their HTML frequently), you can update the CSS selectors:

1. Open Settings
2. Scroll to "Selectors (Advanced)"
3. Edit the JSON configuration
4. Click "Save Selectors"

**Warning**: Invalid JSON will break detection. Keep a backup!

### Export & Erase

- **Export JSON**: Full structured data export
- **Export CSV**: Spreadsheet-friendly format
- **Erase All Data**: Permanently delete all ad records (cannot be undone)

## How It Works

### Architecture

- **Content Scripts**: Run on Reddit/Google/Twitter pages, use MutationObserver to detect new DOM elements
- **Background Service Worker**: Central message router, deduplication, and data normalization
- **Offscreen Document**: Hosts the IndexedDB (Dexie) for stable storage across service worker restarts
- **Popup UI**: React app for browsing and filtering
- **Options UI**: React app for settings and selector management

### Detection Logic

1. Content script monitors DOM for new elements
2. Checks for "Promoted" or "Sponsored" labels
3. Extracts metadata (advertiser, text, links)
4. Sends to background worker
5. Background normalizes and deduplicates
6. Stores in IndexedDB via offscreen document

### Privacy by Design

- Stable hashing prevents duplicate processing
- Page URLs and media URLs excluded by default
- URL sanitization removes tracking parameters
- All processing happens locally—no network calls

## Roadmap (v1+ Features)

- **More Platforms**: Facebook, Instagram, YouTube, LinkedIn
- **Analytics**: Local-only insights (top advertisers, exposure patterns)
- **Cross-Browser**: Firefox and Edge builds
- **Community Selector Packs**: Import/export selector configs
- **Encrypted Sync**: Optional zero-knowledge sync across devices
- **Topic Tagging**: Automatic categorization of ads

## Contributing

Contributions welcome! Especially:

- Selector updates when sites change
- New platform detectors
- Bug reports with example HTML

## License

MIT

## Disclaimer

This extension is for research and transparency purposes. It detects ads by observing DOM elements in your browser. It does not interact with ads, click them, or interfere with page functionality. Use responsibly and in accordance with platform Terms of Service.

