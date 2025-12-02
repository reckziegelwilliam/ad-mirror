# Architecture Overview

This document explains how Ad Mirror is architected and how its components work together.

## High-Level Overview

Ad Mirror is a Chrome Manifest V3 extension built with modern web technologies. It uses a plugin-based architecture to support multiple platforms while maintaining clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐      ┌──────────────┐                    │
│  │ Content Script│◄────►│   Platform   │                    │
│  │  (Detector)   │      │   Webpage    │                    │
│  └───────┬───────┘      └──────────────┘                    │
│          │                                                    │
│          │ Detected Ad                                       │
│          ▼                                                    │
│  ┌───────────────┐      ┌──────────────┐                    │
│  │   Background  │◄────►│   Offscreen  │                    │
│  │Service Worker │      │   Document   │                    │
│  │  (Router)     │      │  (IndexedDB) │                    │
│  └───────┬───────┘      └──────────────┘                    │
│          │                                                    │
│          │ Ad Data                                           │
│          ▼                                                    │
│  ┌───────────────┐      ┌──────────────┐                    │
│  │  Popup UI     │      │  Options UI  │                    │
│  │  (Gallery)    │      │  (Settings)  │                    │
│  └───────────────┘      └──────────────┘                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Content Scripts (Detection Layer)

**Purpose**: Detect ads on platform pages and extract metadata.

**Location**: `src/content/`

**Key Files**:
- `src/content/platforms/reddit.ts` - Reddit detection
- `src/content/platforms/google.ts` - Google Search detection
- `src/content/platforms/twitter.ts` - Twitter/X detection
- `src/content/platforms/facebook.ts` - Facebook detection
- `src/content/engine/detector.ts` - Unified detection engine

**How it works**:
1. Injected into platform pages by manifest configuration
2. Uses MutationObserver to watch for new DOM elements
3. Runs detection pipeline when elements change
4. Extracts ad metadata (advertiser, text, links, etc.)
5. Sends candidates to background service worker

**Detection Pipeline**:
```
DOM Changes
    ↓
Find Containers (CSS, label-led, attributes)
    ↓
Extract Fields (with fallbacks)
    ↓
Validate & Score (confidence threshold)
    ↓
Send to Background
```

### 2. Detection Engine (Core Logic)

**Purpose**: Unified, data-driven ad detection system.

**Location**: `src/content/engine/`

**Key Files**:
- `detector.ts` - Main detection pipeline
- `labelLedDetection.ts` - Label-based container finding
- `validators.ts` - Validation rules
- `configValidator.ts` - Config validation
- `metricsCollector.ts` - Performance metrics

**Features**:
- Multiple detection strategies per platform
- Fallback selectors for resilience
- Confidence-based scoring
- Negative filters to exclude false positives
- Context-aware field extraction
- Performance metrics collection

**Configuration-Driven**:
```json
{
  "platform": "reddit",
  "version": "2.1.0",
  "containerRules": [
    {
      "id": "label-led-promoted",
      "type": "label-led",
      "labelTexts": ["Promoted"],
      "containerSelectors": ["[data-testid='post-container']"],
      "score": 1.0
    }
  ],
  "fieldRules": { ... },
  "validators": [ ... ]
}
```

### 3. Background Service Worker (Message Router)

**Purpose**: Central message hub, data normalization, and deduplication.

**Location**: `src/background/index.ts`

**Responsibilities**:
- Route messages between components
- Normalize ad data from different platforms
- Deduplicate ads using stable hashing
- Apply privacy settings (strip URLs if disabled)
- Forward validated ads to offscreen document for storage

**Message Flow**:
```
Content Script → AD_CANDIDATE → Background Worker
                                       ↓
                                 Normalize & Validate
                                       ↓
                                 Apply Privacy Settings
                                       ↓
                    STORE_AD → Offscreen Document
```

### 4. Offscreen Document (Storage Layer)

**Purpose**: Persistent IndexedDB storage (survives service worker restarts).

**Location**: `src/offscreen/`

**Key Files**:
- `db.ts` - Dexie (IndexedDB wrapper) setup
- `adStore.ts` - Ad CRUD operations
- `analytics.ts` - Query and analysis
- `maintenance.ts` - Cleanup and optimization

**Why Offscreen?**: 
Chrome Manifest V3 service workers can shut down at any time. Offscreen documents provide a stable context for IndexedDB operations.

**Database Schema**:
```typescript
{
  id: string,              // Unique ad ID
  platform: 'reddit' | 'google' | 'twitter',
  detectedAt: number,      // Timestamp
  advertiserName: string,
  creativeText: string,
  destinationUrl?: string, // Optional (privacy)
  mediaUrls?: string[],    // Optional (privacy)
  pageUrl?: string,        // Optional (privacy)
  metadata: object         // Platform-specific data
}
```

### 5. Dashboard UI (User Interface)

**Purpose**: User interaction - view, filter, export, and configure.

**Location**: `src/dashboard/`

**Components**:

**Popup** (`popup.tsx`):
- Gallery view of captured ads
- Platform/time/text filters
- Export buttons (JSON/CSV)
- Link to settings

**Options** (`options.tsx`):
- Platform enable/disable toggles
- Privacy settings (URLs on/off)
- Selector editor (advanced)
- Data export and erase
- Debug mode controls

**Tech Stack**:
- React 18
- Tailwind CSS
- TypeScript
- Vite (bundler)

## Data Flow

### Ad Detection Flow

```
1. User visits Reddit
   ↓
2. Content script injected
   ↓
3. MutationObserver detects new DOM elements
   ↓
4. Detection engine runs:
   - Find containers (multi-strategy)
   - Extract fields (with fallbacks)
   - Validate & score (confidence check)
   ↓
5. Send AD_CANDIDATE message to background
   ↓
6. Background worker:
   - Normalizes data
   - Checks for duplicates
   - Applies privacy settings
   ↓
7. Send STORE_AD message to offscreen
   ↓
8. Offscreen document:
   - Stores in IndexedDB
   - Sends confirmation
   ↓
9. User opens popup → sees ad in gallery
```

### Configuration Flow

```
1. User edits selectors in Options UI
   ↓
2. Validate JSON format
   ↓
3. Store in chrome.storage.local
   ↓
4. Send CONFIG_UPDATED message
   ↓
5. Content scripts reload config
   ↓
6. New detection runs use updated selectors
```

## Plugin Architecture

Ad Mirror uses a plugin system for platform support:

```typescript
interface DetectionPlugin {
  id: string;
  matchHostname(hostname: string): boolean;
  init(config: PlatformDetectionConfig): void;
  teardown(): void;
}
```

**Benefits**:
- Easy to add new platforms
- Platform-specific logic isolated
- Shared detection engine
- Consistent data format

**Adding a Platform**:
1. Create config JSON in `src/content/configs/`
2. Create plugin in `src/content/platforms/`
3. Register in `detectionRegistry.ts`
4. Add to manifest `host_permissions`

See: [Adding Platforms Guide](../development/adding-platforms.md)

## Storage Strategy

### Local Storage (chrome.storage.local)

**Used for**:
- User settings (platform toggles, privacy settings)
- Custom selector configurations
- Detection metrics

**Why**: Syncs across browser restarts, accessible from all contexts.

### IndexedDB (via Dexie)

**Used for**:
- Ad data (can be thousands of records)
- Full-text search capabilities
- Complex queries and aggregations

**Why**: Handles large datasets, supports transactions, better performance.

### Session State (Memory)

**Used for**:
- Seen element tracking (WeakSet)
- Temporary detection state
- MutationObserver instances

**Why**: No persistence needed, automatic garbage collection.

## Build System

### Vite Configuration

**Entry Points**:
- `src/background/index.ts` → Service worker
- `src/content/platforms/*.ts` → Content scripts
- `src/dashboard/popup.tsx` → Popup UI
- `src/dashboard/options.tsx` → Options UI
- `src/offscreen/db.ts` → Offscreen document

**Build Output** (`dist/`):
```
dist/
├── manifest.json
├── service-worker-loader.js
├── assets/
│   ├── popup-[hash].js
│   ├── options-[hash].js
│   ├── reddit.ts-[hash].js
│   ├── google.ts-[hash].js
│   └── ...
├── src/dashboard/
│   ├── popup.html
│   └── options.html
└── src/offscreen/
    └── db.html
```

**Development vs Production**:
- Dev: Source maps, hot reload, readable output
- Prod: Minified, tree-shaken, optimized assets

## Security Considerations

### Content Security Policy

Manifest specifies CSP:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

No inline scripts, no eval(), no external scripts.

### Permissions

Minimal permissions requested:
- `storage` - For settings and configs
- `offscreen` - For stable IndexedDB context
- `host_permissions` - Only for enabled platforms

No `webRequest`, no `tabs` (except sendMessage), no `cookies`.

### Data Privacy

- No network calls (except to load extension pages)
- All processing local
- No telemetry or analytics
- URLs off by default
- User controls all data

## Performance Optimizations

### Detection

- **Throttled**: MutationObserver callbacks throttled (500ms)
- **Debounced**: Rapid DOM changes batched
- **WeakSet**: Automatic garbage collection of seen elements
- **Early Exit**: Fast rejection of non-ads

### Storage

- **Batched Writes**: Multiple ads written in single transaction
- **Indexed Queries**: IndexedDB indexes on platform and timestamp
- **Pagination**: Gallery loads ads in chunks (50 at a time)

### UI

- **Virtual Scrolling**: Large lists rendered incrementally
- **Memoization**: React components memoized to prevent re-renders
- **Lazy Loading**: Images loaded on-demand

## Extension Lifecycle

### Installation

1. User installs extension
2. Service worker starts
3. Default settings initialized in chrome.storage
4. Offscreen document created
5. IndexedDB database initialized

### Runtime

1. User visits supported platform
2. Content script injected
3. Detection begins
4. Ads captured and stored
5. Service worker may shut down (idle)
6. Offscreen keeps IndexedDB alive

### Updates

1. Extension updated via Chrome Web Store
2. Service worker restarted
3. Existing data preserved
4. New configs may require migration
5. Content scripts reload with new code

## Testing Architecture

### Unit Tests

**Location**: `src/content/engine/__tests__/`

**Framework**: Vitest (Jest-compatible)

**Coverage**:
- Detection engine logic
- Validators and scoring
- Configuration validation
- Data normalization

### Fixtures

**Location**: `src/content/fixtures/`

HTML files simulating real platform pages for consistent testing.

### Integration Tests

Manual testing with real platforms (automated tests planned for v1.0).

## Project Structure

```
ad-mirror/
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Detection layer
│   │   ├── configs/         # Platform configs (JSON)
│   │   ├── engine/          # Detection engine
│   │   ├── fixtures/        # Test HTML
│   │   └── platforms/       # Platform plugins
│   ├── dashboard/           # React UI
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── popup.tsx        # Gallery UI
│   │   └── options.tsx      # Settings UI
│   ├── offscreen/           # Storage layer
│   ├── shared/              # Shared utilities
│   │   ├── types/           # TypeScript types
│   │   ├── selectors.ts     # Default selectors
│   │   └── settings.ts      # Settings management
│   └── manifest.json        # Extension manifest
├── public/                  # Static assets
├── docs/                    # Documentation
├── scripts/                 # Build/validation scripts
└── dist/                    # Build output
```

## Technology Stack

**Core**:
- TypeScript 5
- Chrome Extension Manifest V3
- Vite 5

**UI**:
- React 18
- Tailwind CSS 3
- Heroicons

**Storage**:
- Dexie (IndexedDB wrapper)
- chrome.storage API

**Development**:
- ESLint
- Prettier
- Vitest
- GitHub Actions (CI/CD)

## Future Architecture Considerations

### Planned for v1.0

- **Firefox Support**: WebExtension API compatibility layer
- **Encrypted Sync**: E2E encrypted cloud backup (optional)
- **Analytics Dashboard**: Local-only insights
- **ML Detection**: Machine learning for improved accuracy

### Scalability

Current architecture supports:
- Thousands of ads per user
- Multiple platforms (4+ supported)
- Fast queries (<100ms)
- Small memory footprint (<50MB)

## Learn More

- **[Detection Engine Deep Dive](../features/detection-engine.md)**
- **[Selector System](../features/selector-improvements.md)**
- **[Adding Platforms](../development/adding-platforms.md)**
- **[Configuration Reference](../reference/configuration.md)**

---

**[← Back: Quick Start](quick-start.md)** | **[Documentation Home](../index.md)** | **[Next: Development Setup →](../development/setup.md)**

