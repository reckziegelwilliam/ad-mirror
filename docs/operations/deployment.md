# Deployment Guide

This guide covers releasing Ad Mirror to production, including Chrome Web Store submission, manual distribution, and Firefox Add-ons.

## Release Checklist

Before creating a release:

- [ ] All tests passing
- [ ] No linter errors
- [ ] Config validation passes
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Migration guide written (if needed)
- [ ] Manual testing completed
- [ ] Security audit clean

## Versioning

Ad Mirror follows **[Semantic Versioning](https://semver.org/)**: `MAJOR.MINOR.PATCH`

### Version Bumping

```bash
# Patch release (bug fixes)
npm version patch  # 2.1.0 → 2.1.1

# Minor release (new features, backward compatible)
npm version minor  # 2.1.1 → 2.2.0

# Major release (breaking changes)
npm version major  # 2.2.0 → 3.0.0
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### Version Guidelines

**Patch** (2.1.0 → 2.1.1):
- Bug fixes
- Selector updates
- Documentation fixes
- Performance improvements
- Security patches

**Minor** (2.1.0 → 2.2.0):
- New features
- New platform support
- New validators
- New configuration options
- Deprecations (with warning)

**Major** (2.0.0 → 3.0.0):
- Breaking API changes
- Removed features
- Config format changes (incompatible)
- Minimum browser version increase

## Building for Production

### Chrome/Chromium

```bash
# Production build
npm run build

# Create ZIP package
npm run zip
```

Output: `ad-mirror.zip` in project root

### Firefox

```bash
# Build for Firefox
npm run build:firefox

# Package as XPI
npm run package:firefox
```

Output: `ad-mirror.xpi` in project root

### Verification

```bash
# Check build output
ls -lh dist/

# Verify manifest
cat dist/manifest.json

# Check bundle sizes
du -sh dist/assets/*

# Generate checksums
sha256sum ad-mirror.zip > checksums.txt
```

## Chrome Web Store Submission

### First-Time Setup

1. **Create Developer Account**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time $5 registration fee
   - Verify your email

2. **Create Extension Listing**:
   - Click "New Item"
   - Upload `ad-mirror.zip`
   - Fill in store listing information

3. **Store Listing Details**:

   **Name**: Ad Mirror  
   **Summary**: Privacy-first ad detection and archival  
   **Description**: (See below)  
   **Category**: Productivity  
   **Language**: English  

   **Icons**:
   - 128x128: `public/icons/icon128.png`
   - (Upload same icon for all sizes)

   **Screenshots**:
   - Popup gallery view
   - Options page
   - Debug mode visualization
   - (Minimum 1, maximum 5)

   **Promotional Images**:
   - Small tile: 440x280
   - Large tile: 920x680
   - Marquee: 1400x560

4. **Privacy & Permissions**:
   - Check required permissions
   - Explain each permission usage
   - Link to privacy policy (GitHub README)

### Automated Publishing

Configure CI/CD for automatic publishing (see [CI/CD Guide](ci-cd.md)):

```yaml
# .github/workflows/ci-cd.yml
- name: Publish to Chrome Web Store
  if: startsWith(github.ref, 'refs/tags/v')
  uses: mnao305/chrome-extension-upload@v4
  with:
    file-path: ad-mirror.zip
    extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
    client-id: ${{ secrets.CHROME_CLIENT_ID }}
    client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
    refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

### Manual Publishing

If automated publishing fails or for first release:

1. **Go to Developer Dashboard**
2. **Click on Ad Mirror**
3. **Click "Package" tab**
4. **Click "Upload new package"**
5. **Upload `ad-mirror.zip`**
6. **Click "Submit for review"**

Review typically takes 1-3 days.

### Store Listing Description

```
# Ad Mirror - Your Private Ad Gallery

Track and archive ads shown to you on Reddit, Google Search, and Twitter/X. 
All data stays on your device - no servers, no tracking, no cloud.

## Privacy-First Design
• 100% local storage in IndexedDB
• No external network calls
• Page URLs and media OFF by default
• You control your data

## Features
• Automatic ad detection across multiple platforms
• Searchable gallery with filters
• Export as JSON or CSV
• Customizable detection selectors
• Debug visualization tools
• Performance metrics

## Supported Platforms
• Reddit
• Google Search
• Twitter/X
• Facebook (experimental)

## Open Source
Code is fully open source and auditable on GitHub.

## Privacy Policy
Ad Mirror does not collect, transmit, or store any user data externally. 
All processing happens locally on your device.

For more information, visit our GitHub repository.
```

## Firefox Add-ons Submission

### First-Time Setup

1. **Create Account**:
   - Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
   - Sign in with Firefox Account

2. **Submit Extension**:
   - Click "Submit a New Add-on"
   - Choose "On this site"
   - Upload `ad-mirror.xpi`

3. **Listing Information**:
   - Use same details as Chrome Web Store
   - Adjust for Firefox-specific features

### Differences from Chrome

- Use `browser.*` API instead of `chrome.*`
- Manifest V2 or V3 (V3 support varies)
- Different review process (more thorough)
- Signing required for distribution

### Build Configuration

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'firefox', // or 'chrome'
    // ...
  }
});
```

## Manual Distribution

For users who don't use extension stores:

### GitHub Releases

1. **Create Release**:
   ```bash
   # Tag release
   git tag -a v2.2.0 -m "Release v2.2.0"
   git push origin v2.2.0
   ```

2. **GitHub UI**:
   - Go to Releases
   - Draft new release
   - Choose tag: v2.2.0
   - Add release notes
   - Attach `ad-mirror.zip`
   - Attach `checksums.txt`
   - Publish release

3. **Release Notes Template**:

   ```markdown
   # Ad Mirror v2.2.0

   ## New Features
   - Feature 1 description
   - Feature 2 description

   ## Bug Fixes
   - Fix 1 description
   - Fix 2 description

   ## Breaking Changes
   - None

   ## Installation
   1. Download `ad-mirror.zip`
   2. Go to `chrome://extensions/`
   3. Enable Developer Mode
   4. Drag and drop ZIP file

   ## Checksums
   See `checksums.txt` for SHA256 hashes.

   ## Full Changelog
   See [CHANGELOG.md](./CHANGELOG.md)
   ```

### Self-Hosting

For organizations wanting to host internally:

1. **Build extension**:
   ```bash
   npm run build
   npm run zip
   ```

2. **Host ZIP file** on internal server

3. **Provide installation instructions**:
   ```
   1. Download ad-mirror.zip from [internal-url]
   2. Verify checksum
   3. Unzip to permanent location
   4. Load unpacked in Chrome
   ```

4. **Update mechanism**:
   - Manual updates (download new version)
   - Or implement update_url in manifest

## Post-Release

### Verification

After publishing:

- [ ] Install from Chrome Web Store
- [ ] Test all platforms (Reddit, Google, Twitter)
- [ ] Verify settings work
- [ ] Check export functionality
- [ ] Test selector editing
- [ ] Confirm no console errors

### Monitoring

**Chrome Web Store**:
- Check reviews and ratings
- Monitor crash reports
- Review user feedback

**GitHub**:
- Watch for new issues
- Monitor discussions
- Track download counts

### Announcement

Announce release on:
- GitHub Releases (automatic)
- Project README (update version)
- Community discussions
- Social media (if applicable)

## Rollback Procedure

If critical bug found after release:

### Immediate

1. **Unpublish from store** (if severe)
2. **Create hotfix branch**:
   ```bash
   git checkout -b hotfix/critical-bug
   ```

3. **Fix bug**:
   ```bash
   # Make fix
   git add .
   git commit -m "fix: critical bug description"
   ```

4. **Emergency release**:
   ```bash
   npm version patch
   git push origin hotfix/critical-bug --tags
   ```

5. **Submit to store** immediately

### Follow-up

1. Merge hotfix to main
2. Post-mortem analysis
3. Add tests to prevent recurrence
4. Update documentation

## Store Policies Compliance

### Chrome Web Store

**Required**:
- ✅ Single purpose clearly described
- ✅ Minimal permissions requested
- ✅ No obfuscated code
- ✅ Privacy policy accessible
- ✅ No inline scripts (CSP compliant)

**Prohibited**:
- ❌ Cryptocurrency mining
- ❌ Ads injection
- ❌ Data collection without disclosure
- ❌ Deceptive behavior

### Firefox Add-ons

**Required**:
- ✅ Source code readable
- ✅ All dependencies explained
- ✅ Privacy policy linked
- ✅ Permissions justified

**Additional review** for:
- External scripts
- Remote code execution
- Data transmission

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Store Rejection

**Common reasons**:
- Permissions not justified
- Privacy policy missing
- Description too vague
- Inline scripts (CSP violation)
- Obfuscated code

**How to fix**:
1. Read rejection reason carefully
2. Address specific issues
3. Update submission
4. Resubmit with explanation

### Update Not Appearing

Chrome updates can take 60 minutes to propagate.

**Force update**:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Update"

## Release Cadence

**Recommended schedule**:

- **Patch releases**: As needed (bug fixes)
- **Minor releases**: Monthly (new features)
- **Major releases**: Quarterly or as needed

**Beta testing**:
- Use separate beta channel
- Or distribute via GitHub for testing
- Gather feedback before stable release

## Documentation Updates

For each release:

- [ ] Update README.md version
- [ ] Update CHANGELOG.md
- [ ] Update API docs if changed
- [ ] Update screenshots if UI changed
- [ ] Tag documentation version

## Legal

### License

MIT License - included in repository

### Privacy Policy

Link to GitHub README privacy section

### Terms of Service

Extension use governed by store ToS:
- Chrome Web Store Terms
- Firefox Add-ons Policies

## Learn More

- **[CI/CD Guide](ci-cd.md)** - Automated pipeline
- **[Contributing Guide](../development/contributing.md)** - Development workflow
- **[Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies/)** - Official policies

---

**[← Back: CI/CD](ci-cd.md)** | **[Documentation Home](../index.md)** | **[Next: Reference →](../reference/configuration.md)**

