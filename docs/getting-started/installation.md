# Installation Guide

This guide covers installing Ad Mirror for both development and production use.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Chrome Browser**: Latest version recommended
- **Git**: For cloning the repository

## Development Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ad-mirror.git
cd ad-mirror
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and React DOM
- Vite (build tool)
- Tailwind CSS
- Dexie (IndexedDB wrapper)
- TypeScript
- Development tools (ESLint, Prettier, etc.)

### 3. Build the Extension

For development with hot reload:

```bash
npm run dev
```

For production build:

```bash
npm run build
```

Both commands create a `dist/` folder with your compiled extension.

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top right corner
3. Click **Load unpacked** button
4. Navigate to your project directory and select the `dist` folder
5. Click **Select**

You should now see "Ad Mirror" in your extensions list with a green "Active" indicator.

### 5. Verify Installation

1. Click the Ad Mirror extension icon in your Chrome toolbar
2. You should see the popup interface (it will be empty initially)
3. Click the "Settings" button to verify the options page loads
4. Check that all three platforms (Reddit, Google, Twitter) are enabled by default

## Production Installation

### From Chrome Web Store

*Coming soon - Ad Mirror will be available on the Chrome Web Store*

### From Release Package

1. Download the latest `ad-mirror.zip` from [GitHub Releases](https://github.com/yourusername/ad-mirror/releases)
2. Unzip the file to a permanent location on your computer
3. Follow steps 4-5 from the Development Installation above

**Note**: For production use, do NOT delete the unzipped folder - Chrome needs it to run the extension.

## Building for Distribution

If you want to package the extension yourself:

```bash
# Build the extension
npm run build

# Create distribution zip
npm run zip
```

This creates an `ad-mirror.zip` file in the project root, ready for:
- Chrome Web Store submission
- Manual distribution
- Self-hosting

## Updating the Extension

### Development

When running `npm run dev`, changes to source files will automatically trigger a rebuild. You may need to:

1. Click the refresh icon on the extension card in `chrome://extensions/`
2. Or reload the extension by toggling it off and on

### Production

1. Pull the latest changes: `git pull origin main`
2. Reinstall dependencies: `npm install`
3. Rebuild: `npm run build`
4. Refresh the extension in `chrome://extensions/`

## Troubleshooting Installation

### "Manifest file is missing or unreadable"

**Cause**: The `dist` folder wasn't created or is empty.

**Solution**: 
```bash
npm run build
```

Make sure the build completes without errors.

### "npm install" fails

**Cause**: Node.js version mismatch or npm cache issues.

**Solution**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Extension doesn't appear in toolbar

**Cause**: Extension is installed but not pinned.

**Solution**:
1. Click the puzzle piece icon in Chrome toolbar
2. Find "Ad Mirror" in the list
3. Click the pin icon next to it

### "This extension may have been corrupted"

**Cause**: Build artifacts or node_modules corruption.

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

Then reload the extension in Chrome.

### Permission errors during npm install

**Cause**: Permission issues with npm global directory.

**Solution**:
```bash
# Fix npm permissions (Unix/Mac)
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# On Windows, run as Administrator
```

## Next Steps

- **[Quick Start Guide](quick-start.md)** - Learn how to use Ad Mirror
- **[Architecture Overview](architecture.md)** - Understand how it works
- **[Development Setup](../development/setup.md)** - Set up for contributing

## Platform-Specific Notes

### macOS

No special considerations. Installation works as documented above.

### Windows

- Use PowerShell or Command Prompt (not Git Bash) for npm commands
- Paths use backslashes: `C:\Users\YourName\ad-mirror\dist`

### Linux

May need to install additional dependencies:

```bash
# Debian/Ubuntu
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf install gcc-c++ make
```

---

**[← Back to Documentation Home](../index.md)** | **[Next: Quick Start →](quick-start.md)**

