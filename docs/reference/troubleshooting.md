# Troubleshooting

Solutions to common problems and debugging tips for Ad Mirror.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Detection Problems](#detection-problems)
- [Performance Issues](#performance-issues)
- [Data & Storage](#data--storage)
- [UI Problems](#ui-problems)
- [Build & Development](#build--development)

## Installation Issues

### Extension Won't Load

**Symptom**: "Manifest file is missing or unreadable"

**Causes**:
- `dist` folder doesn't exist
- Build failed
- Wrong folder selected

**Solutions**:
```bash
# Rebuild extension
npm run build

# Verify dist exists
ls -la dist/

# Check manifest exists
cat dist/manifest.json
```

Then reload extension in Chrome.

### "This extension may have been corrupted"

**Symptom**: Chrome shows corruption warning

**Causes**:
- Partial build
- File system errors
- Interrupted build process

**Solutions**:
```bash
# Clean rebuild
rm -rf dist node_modules
npm install
npm run build
```

Remove and re-add extension in Chrome.

### npm install Fails

**Symptom**: Errors during `npm install`

**Causes**:
- Wrong Node.js version
- npm cache corruption
- Permission issues

**Solutions**:
```bash
# Check Node version (need 18+)
node --version

# Clear npm cache
npm cache clean --force

# Fix permissions (Mac/Linux)
sudo chown -R $USER:$GROUP ~/.npm

# Try again
npm install
```

## Detection Problems

### No Ads Detected

**Symptom**: Gallery is empty even when ads are visible

**Diagnosis**:
1. Check if platform is enabled in Settings
2. Check browser console for errors
3. Enable debug mode to see detection attempts

**Solutions**:

**Platform disabled**:
```
Settings → Platforms → Enable Reddit/Google/Twitter
```

**Console errors**:
```
F12 → Console tab → Look for red errors
```

**Debug mode**:
```
Settings → Advanced → Enable Debug Mode
Visit platform → Check for colored outlines
```

**Selectors outdated**:
```
# Update selectors
Settings → Selectors (Advanced) → Edit JSON → Save
```

### False Positives

**Symptom**: Non-ads being detected

**Causes**:
- Selectors too broad
- Missing negative filters
- Low confidence threshold

**Solutions**:

**Add negative filters**:
```json
{
  "excludeSelectors": ["[data-testid='comment']"],
  "excludeIfContains": ["replied to"],
  "excludeAncestors": [".sidebar"]
}
```

**Increase threshold**:
```json
{
  "minConfidence": 0.7,  // Was 0.5
  "containerScoreThreshold": 0.75
}
```

**Enable adaptive threshold**:
```json
{
  "adaptiveThreshold": true
}
```

### False Negatives

**Symptom**: Missing actual ads

**Causes**:
- Selectors too specific
- Threshold too high
- Platform changed HTML

**Solutions**:

**Inspect HTML**:
```
Right-click ad → Inspect → Note selectors/attributes
```

**Add fallback selectors**:
```json
{
  "containerRules": [
    { "id": "primary", "selector": ".specific-selector", "score": 1.0 },
    { "id": "fallback", "selector": ".broader-selector", "score": 0.8 }
  ]
}
```

**Lower threshold**:
```json
{
  "minConfidence": 0.4,  // Was 0.5
  "containerScoreThreshold": 0.5
}
```

### Wrong Field Data

**Symptom**: Advertiser name or other fields incorrect

**Causes**:
- Selector matching wrong element
- Need context-aware extraction

**Solutions**:

**Add more specific selector**:
```json
{
  "field": "advertiserName",
  "selector": "a[href*='/user/'] span.name",  // More specific
  "score": 1.0
}
```

**Use debug mode** to see what's being extracted:
```
Enable Debug Mode → Click ad → Check "Fields" section
```

## Performance Issues

### Slow Page Loading

**Symptom**: Pages load slower with extension installed

**Causes**:
- Too many selector rules
- Inefficient selectors
- Detection running too frequently

**Solutions**:

**Profile detection**:
```typescript
console.time('detection');
detectAds();
console.timeEnd('detection');  // Should be < 60ms
```

**Optimize selectors**:
```
Bad:  div
Good: [data-testid='post-container']

Bad:  * .ad
Good: .ad-container
```

**Reduce rules**:
- Keep under 20 container rules
- Remove unused rules
- Combine similar rules

### High Memory Usage

**Symptom**: Chrome Task Manager shows high memory

**Causes**:
- Too many stored ads
- Memory leaks
- Large media URLs

**Solutions**:

**Check stored ads**:
```
F12 → Application → IndexedDB → AdMirrorDB → ads
```

**Enable auto-cleanup**:
```
Settings → Advanced → Max Stored Ads: 5000
Settings → Advanced → Auto-Cleanup: ON
```

**Clear old data**:
```
Settings → Danger Zone → Erase All Data
```

### Extension Slows Down Over Time

**Symptom**: Works well initially, then slows

**Causes**:
- IndexedDB growing large
- Metrics accumulating
- WeakSet not cleaning up

**Solutions**:

**Reset database**:
```javascript
// In browser console
indexedDB.deleteDatabase('AdMirrorDB');
// Then reload extension
```

**Clear metrics**:
```
localStorage.removeItem('ad-mirror-metrics');
```

**Reload extension**:
```
chrome://extensions/ → Refresh icon
```

## Data & Storage

### Data Not Persisting

**Symptom**: Ads disappear after browser restart

**Causes**:
- IndexedDB not initializing
- Service worker restarting before save
- Storage quota exceeded

**Solutions**:

**Check IndexedDB**:
```
F12 → Application → IndexedDB → AdMirrorDB
```

If empty or missing:
```javascript
// Check for errors
chrome.runtime.lastError
```

**Check storage quota**:
```javascript
navigator.storage.estimate().then(console.log);
```

### Export Fails

**Symptom**: Export button doesn't work or downloads empty file

**Causes**:
- No ads stored
- Permission denied
- Browser download settings

**Solutions**:

**Verify ads exist**:
```
F12 → Application → IndexedDB → AdMirrorDB → ads
```

**Check console errors**:
```
F12 → Console → Look for export errors
```

**Try different format**:
- JSON not working → Try CSV
- CSV not working → Try JSON

### Can't Delete Data

**Symptom**: "Erase All Data" doesn't work

**Causes**:
- Database locked
- Permission error
- Service worker issue

**Solutions**:

**Manual deletion**:
```javascript
// In browser console
indexedDB.deleteDatabase('AdMirrorDB');
localStorage.clear();
```

**Reload extension**:
```
chrome://extensions/ → Remove → Re-add
```

## UI Problems

### Popup Not Opening

**Symptom**: Clicking icon does nothing

**Causes**:
- Popup HTML missing
- React render error
- Extension disabled

**Solutions**:

**Check extension status**:
```
chrome://extensions/ → Verify "Ad Mirror" is enabled
```

**Right-click icon**:
```
Right-click → Inspect Popup → Check Console for errors
```

**Reload extension**:
```
chrome://extensions/ → Refresh icon
```

### Settings Page Broken

**Symptom**: Options page shows errors or blank

**Causes**:
- React error
- Settings corrupted
- Build issue

**Solutions**:

**Check console**:
```
Right-click page → Inspect → Console tab
```

**Reset settings**:
```javascript
// In options page console
chrome.storage.local.clear();
location.reload();
```

**Rebuild extension**:
```bash
npm run build
```

### Gallery Not Showing Ads

**Symptom**: IndexedDB has ads but gallery is empty

**Causes**:
- Offscreen document not loading
- Message passing failure
- React state issue

**Solutions**:

**Check service worker**:
```
chrome://extensions/ → Service worker → Check console
```

**Reload popup**:
```
Close popup → Reopen
```

**Restart extension**:
```
chrome://extensions/ → Toggle off/on
```

## Build & Development

### Build Fails with TypeScript Errors

**Symptom**: `npm run build` fails with type errors

**Solutions**:

**Check types**:
```bash
npm run type-check
```

**Fix errors**, then:
```bash
npm run build
```

**Restart TS server** (VS Code):
```
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Tests Failing

**Symptom**: `npm test` shows failures

**Diagnosis**:
```bash
# Run specific test
npm test detector.test.ts

# Verbose output
npm test -- --reporter=verbose

# Watch mode
npm run test:watch
```

**Common issues**:

**Import errors**:
```
Fix paths or add to jest.config.js
```

**Chrome API mocks missing**:
```
Check src/__tests__/setup.ts
```

**Fixture not loading**:
```
Verify file exists in src/content/fixtures/
```

### Git Hooks Failing

**Symptom**: `git commit` or `git push` rejected

**Lint errors**:
```bash
# Fix auto-fixable issues
npm run lint:fix

# Fix remaining manually
```

**Test failures**:
```bash
npm test
# Fix failing tests
```

**Bypass** (not recommended):
```bash
git commit --no-verify
git push --no-verify
```

### Vite Build Errors

**Symptom**: Build fails with Vite errors

**Solutions**:

**Clear cache**:
```bash
rm -rf node_modules/.vite
```

**Update dependencies**:
```bash
npm update
```

**Check vite.config.ts**:
- Verify paths are correct
- Check plugin configuration

## Debugging Tips

### Enable Debug Logging

```typescript
// Add to content script
console.log('[Ad Mirror]', 'Detection started');
console.log('[Ad Mirror]', 'Found', candidates.length, 'ads');
```

### Service Worker Console

```
chrome://extensions/ → Ad Mirror → "service worker" link
```

Shows background script logs.

### Content Script Console

```
F12 on platform page → Console tab
```

Shows detection logs.

### Network Monitoring

```
F12 → Network tab
```

Ad Mirror should make NO external requests (except loading own pages).

### Performance Profiling

```
F12 → Performance tab → Record → Interact → Stop
```

Find slow operations in flame graph.

## Common Error Messages

### "Cannot read property 'textContent' of null"

**Meaning**: Selector didn't find element

**Fix**: Add null check or update selector

### "WeakSet.prototype.add: argument is not an object"

**Meaning**: Trying to add non-element to WeakSet

**Fix**: Verify `container` is Element type

### "Failed to execute 'querySelector' on 'Element'"

**Meaning**: Invalid CSS selector

**Fix**: Validate selector syntax

### "QuotaExceededError: The quota has been exceeded"

**Meaning**: Storage limit reached

**Fix**: Enable auto-cleanup or erase old data

## Getting More Help

### Check Documentation

- [Detection Engine](../features/detection-engine.md)
- [Configuration Reference](configuration.md)
- [Adding Platforms](../development/adding-platforms.md)

### GitHub Issues

Search existing issues:
```
https://github.com/yourusername/ad-mirror/issues
```

Create new issue:
1. Use issue template
2. Include browser version, OS, extension version
3. Attach console logs
4. Describe steps to reproduce

### Community

- [GitHub Discussions](https://github.com/yourusername/ad-mirror/discussions)
- Check FAQ in README
- Join community Discord (if available)

## Diagnostic Checklist

When reporting issues, include:

- [ ] Browser name and version
- [ ] Operating system
- [ ] Extension version
- [ ] Platform where issue occurs
- [ ] Steps to reproduce
- [ ] Console errors (F12 → Console)
- [ ] Service worker logs
- [ ] Screenshot of issue
- [ ] Debug mode screenshot (if detection issue)
- [ ] Sample HTML (if detection issue)

## Platform-Specific Issues

### Reddit

**Ads not detected on old Reddit**:
- Ad Mirror targets new Reddit (reddit.com)
- Old Reddit (old.reddit.com) may need separate config

**Comments detected as ads**:
- Add comment selectors to `excludeSelectors`

### Google

**Organic results detected as ads**:
- Verify `labelPattern` validator is working
- Check for "Sponsored" label presence

**Mobile search ads missed**:
- Mobile selectors may differ
- May need separate mobile config

### Twitter/X

**Promoted tweets not detected**:
- Twitter frequently changes selectors
- Check console for errors
- Update selectors if needed

**Timeline changes break detection**:
- Enable debug mode
- Inspect promoted tweet HTML
- Update container selectors

### Facebook

**Sponsored posts not detected**:
- Facebook heavily obfuscates HTML
- Uses dynamic class names
- May need label-led detection

---

**[← Back: Configuration](configuration.md)** | **[Documentation Home](../index.md)**

