# Ad Mirror

Your private gallery of ads shown to you on Reddit, Google, and Twitter/X.

> **🔒 Privacy-First**: All data stays on your device. No servers, no tracking, no cloud.

## Features

- 🔍 **Ad Detection** - Automatically detect ads across multiple platforms
- 📊 **Private Gallery** - Searchable local archive in IndexedDB
- 🔒 **Privacy Controls** - Toggle what data gets stored
- 📤 **Export** - JSON and CSV export
- ⚙️ **Customizable** - Edit detection rules via UI
- 🧪 **Well-Tested** - 80%+ code coverage with comprehensive test suite

## Quick Start

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → Select dist folder
```

## Documentation

- 📚 **[Documentation Hub](docs/index.md)** - Complete documentation
- 🚀 **[Installation Guide](docs/getting-started/installation.md)** - Detailed setup
- 📖 **[Quick Start Guide](docs/getting-started/quick-start.md)** - Get started in 5 minutes
- 🏗️ **[Architecture](docs/getting-started/architecture.md)** - How it works
- 🛠️ **[Contributing](CONTRIBUTING.md)** - Help improve Ad Mirror

## Supported Platforms

- ✅ Reddit
- ✅ Google Search
- ✅ Twitter/X
- 🧪 Facebook (experimental)

## Privacy

Ad Mirror operates with complete privacy:

- ✅ **100% local storage** - Data never leaves your device
- ✅ **No network calls** - All processing is local
- ✅ **Privacy defaults** - URLs OFF by default
- ✅ **Full control** - Export or erase anytime
- ✅ **Open source** - Auditable code

[Learn more about privacy →](docs/features/privacy.md)

## Contributing

Contributions welcome! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines.

**Common contributions**:
- Selector updates when platforms change
- New platform support
- Bug fixes
- Documentation improvements

## Technology Stack

- **Runtime**: TypeScript, React 18
- **Build**: Vite 5
- **Testing**: Vitest
- **UI**: Tailwind CSS
- **Storage**: Dexie (IndexedDB)

## License

MIT License - see LICENSE file for details

## Links

- **[Documentation](docs/index.md)** - Complete docs
- **[Issue Tracker](https://github.com/yourusername/ad-mirror/issues)** - Report bugs
- **[Discussions](https://github.com/yourusername/ad-mirror/discussions)** - Ask questions

---

**Disclaimer**: This extension is for research and transparency purposes. It observes DOM elements to detect ads. It does not interact with ads, click them, or interfere with page functionality.

