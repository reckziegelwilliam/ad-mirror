# Development Setup

This guide will help you set up a local development environment for contributing to Ad Mirror.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or higher (`node --version`)
- **npm** 9 or higher (`npm --version`)
- **Git** (`git --version`)
- **Chrome Browser** (latest version)
- **Code Editor** (VS Code recommended)

## Initial Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/ad-mirror.git
cd ad-mirror
```

### 2. Add Upstream Remote

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/ad-mirror.git
git fetch upstream
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- Build tools (Vite, TypeScript)
- React and UI libraries
- Testing frameworks (Vitest)
- Development tools (ESLint, Prettier)
- Git hooks (Husky, commitlint)

### 4. Install Git Hooks

```bash
npm run prepare
```

This sets up:
- Pre-commit: Linting and type checking
- Commit-msg: Conventional commit validation

## Development Workflow

### Starting Development Mode

```bash
npm run dev
```

This:
- Starts Vite in watch mode
- Builds to `dist/` on file changes
- Enables source maps for debugging

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist` folder in your project
5. Note the extension ID (you'll need it for debugging)

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** in the appropriate files

3. **Test locally**:
   ```bash
   npm run test:unit        # Run unit tests
   npm run lint             # Check linting
   npm run type-check       # Check types
   ```

4. **Reload extension** in Chrome:
   - Click refresh icon on extension card
   - Or toggle extension off and on

### Debugging

**Service Worker Console**:
```bash
# Go to chrome://extensions/
# Find Ad Mirror
# Click "service worker" link
# Console opens with background logs
```

**Content Script Console**:
```bash
# Visit a supported platform (e.g., reddit.com)
# Open DevTools (F12)
# Check Console tab for content script logs
```

**Popup DevTools**:
```bash
# Right-click extension icon
# Select "Inspect Popup"
# DevTools opens for popup
```

**React DevTools**:
```bash
# Install React DevTools extension
# Open popup or options page
# React DevTools tab appears in DevTools
```

## Project Structure

```
ad-mirror/
├── src/
│   ├── background/          # Service worker
│   │   └── index.ts
│   ├── content/             # Platform detection
│   │   ├── configs/         # JSON selector configs
│   │   ├── engine/          # Detection engine
│   │   ├── platforms/       # Platform plugins
│   │   └── fixtures/        # Test HTML files
│   ├── dashboard/           # React UI
│   │   ├── components/      # Shared components
│   │   ├── popup.tsx        # Gallery UI
│   │   └── options.tsx      # Settings UI
│   ├── offscreen/           # Storage layer
│   │   ├── db.ts            # IndexedDB setup
│   │   └── adStore.ts       # Ad CRUD
│   ├── shared/              # Utilities
│   │   ├── types/           # TypeScript types
│   │   └── selectors.ts     # Default selectors
│   └── manifest.json        # Extension manifest
├── docs/                    # Documentation
├── scripts/                 # Build/validation scripts
├── public/                  # Static assets
└── dist/                    # Build output (gitignored)
```

## Common Development Tasks

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test detector.test.ts
```

### Linting and Formatting

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Type Checking

```bash
# Check types
npm run type-check

# Watch mode
npm run type-check:watch
```

### Build Commands

```bash
# Development build (with source maps)
npm run dev

# Production build (minified)
npm run build

# Build and package
npm run zip
```

### Validation Scripts

```bash
# Validate all configs
npm run validate:configs

# Validate single config
npm run validate:config reddit

# Test config compatibility
npm run test:config-compat

# Run benchmarks
npm run benchmark
```

## VS Code Setup (Recommended)

### Extensions

Install these VS Code extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "vitest.explorer",
    "usernamehw.errorlens"
  ]
}
```

### Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## Environment Variables

No environment variables needed for development. All configuration is in code or `manifest.json`.

## Database Inspection

### View IndexedDB

1. Open DevTools on any page (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** in sidebar
4. Find **AdMirrorDB**
5. Browse tables: `ads`, `metrics`, etc.

### Reset Database

```javascript
// In browser console
indexedDB.deleteDatabase('AdMirrorDB');
// Then reload extension
```

## Troubleshooting Development Issues

### Build fails with "Module not found"

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Extension doesn't reload changes

```bash
# Hard reload:
# 1. Remove extension from chrome://extensions/
# 2. npm run build
# 3. Load unpacked again
```

### TypeScript errors in editor but builds fine

```bash
# Restart TypeScript server
# VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Git hooks not running

```bash
# Reinstall hooks
npm run prepare

# Check hook files exist
ls -la .husky/
```

### Tests fail with "Cannot find module"

```bash
# Check test setup
cat src/__tests__/setup.ts

# Rebuild
npm run build
npm test
```

## Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge into your main branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main

# Update feature branch
git checkout feat/my-feature
git rebase main
```

## Code Style Guide

### TypeScript

- Use strict typing (no `any` unless absolutely necessary)
- Document complex functions with JSDoc
- Use interfaces for object shapes
- Export types that consumers need

### React

- Use functional components
- Use hooks for state and effects
- Memoize expensive computations
- Keep components under 300 lines

### CSS

- Use Tailwind utility classes
- Custom CSS only when necessary
- Follow BEM for custom classes
- Keep specificity low

## Performance Profiling

### Content Script Performance

```typescript
// Add timing logs
console.time('detection');
const ads = detectAds(config);
console.timeEnd('detection');
```

### React Performance

```bash
# Install React DevTools
# Use Profiler tab
# Record while interacting
# Analyze flame graph
```

### Extension Performance

```bash
# Chrome Task Manager
# Shift + Esc or Window → Task Manager
# Find "Extension: Ad Mirror"
# Monitor CPU and memory
```

## Release Process

Maintainers only - see [Deployment Guide](../operations/deployment.md)

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/yourusername/ad-mirror/discussions)
- **Bugs**: [Issue Tracker](https://github.com/yourusername/ad-mirror/issues)
- **Chat**: Community Discord (link coming soon)

## Next Steps

- **[Contributing Guide](contributing.md)** - Learn contribution guidelines
- **[Testing Guide](testing.md)** - Write and run tests
- **[Adding Platforms](adding-platforms.md)** - Add new platform support
- **[Architecture](../getting-started/architecture.md)** - Understand the codebase

---

**[← Back: Architecture](../getting-started/architecture.md)** | **[Documentation Home](../index.md)** | **[Next: Contributing →](contributing.md)**

