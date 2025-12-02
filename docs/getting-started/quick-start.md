# Quick Start Guide

This guide will help you start using Ad Mirror in just a few minutes.

## What is Ad Mirror?

Ad Mirror is a privacy-first Chrome extension that captures and archives ads shown to you on social media and search platforms. All data stays on your device - no servers, no tracking, no cloud.

**Supported Platforms:**
- Reddit
- Google Search
- Twitter/X
- Facebook (experimental)

## Your First Ad Capture

### 1. Visit a Supported Platform

Let's start with Reddit as an example:

1. Navigate to [https://www.reddit.com](https://www.reddit.com)
2. Make sure you're logged in
3. Scroll through your feed

### 2. Wait for an Ad

Keep scrolling until you see a post labeled "Promoted" - these are ads.

### 3. View Your Capture

1. Click the **Ad Mirror** extension icon in your Chrome toolbar
2. You should see the ad appear in your gallery!

The gallery shows:
- Platform icon (Reddit, Google, or Twitter)
- Advertiser name
- Ad text/content
- When it was detected
- Destination link

## Testing Each Platform

### Reddit Ads

**What to look for**: Posts with a "Promoted" label

**Steps**:
1. Visit [reddit.com](https://reddit.com)
2. Scroll your feed
3. Look for posts marked "Promoted"
4. Ad Mirror will automatically capture them

**Note**: Reddit ads appear in your feed just like regular posts.

### Google Search Ads

**What to look for**: Results with a "Sponsored" label

**Steps**:
1. Visit [google.com](https://google.com)
2. Search for something commercial like "buy laptop" or "best hotels"
3. Look at the top results - sponsored ads have a "Sponsored" tag
4. Ad Mirror captures them automatically

**Note**: Not all searches show ads - try commercial/shopping queries.

### Twitter/X Ads

**What to look for**: Tweets with a "Promoted" label

**Steps**:
1. Visit [twitter.com](https://twitter.com) or [x.com](https://x.com)
2. Scroll your timeline
3. Look for tweets labeled "Promoted"
4. Ad Mirror captures them as you scroll

**Note**: You must be logged in to see promoted tweets.

## Using the Gallery

### Filtering Ads

**By Platform**:
- Click the platform dropdown at the top
- Select Reddit, Google, Twitter, or "All Platforms"

**By Time Range**:
- Click the time dropdown
- Choose: Last 24 hours, Last 7 days, Last 30 days, or All time

**By Search**:
- Use the search box to find ads by advertiser name or content
- Search is case-insensitive and matches partial text

### Viewing Ad Details

Click on any ad card to expand and see:
- Full ad text
- Destination URL (if captured)
- Media URLs (if captured)
- Platform-specific metadata
- Exact timestamp

### Exporting Your Data

**Export JSON**:
1. Click the "Export JSON" button
2. Saves a structured JSON file with all your ad data
3. Useful for analysis or backup

**Export CSV**:
1. Click the "Export CSV" button  
2. Saves a spreadsheet-compatible file
3. Easy to open in Excel or Google Sheets

## Privacy Controls

### Opening Settings

1. Click the Ad Mirror icon
2. Click the "Settings" button in the popup

### Platform Toggles

Enable or disable ad detection per platform:

- **Reddit**: Toggle to stop/start capturing Reddit ads
- **Google**: Toggle for Google Search ads
- **Twitter**: Toggle for Twitter/X ads

When disabled, Ad Mirror won't capture ads on that platform.

### Data Capture Settings

By default, Ad Mirror is privacy-focused:

- **Capture Page URLs**: OFF by default
  - When ON: Saves the URL where you saw the ad
  - When OFF: No URL information stored

- **Store Media URLs**: OFF by default
  - When ON: Saves links to ad images/videos
  - When OFF: No media links stored

**Why are these off?**: URLs can contain tracking parameters and identify your browsing patterns. Ad Mirror defaults to maximum privacy.

### Erasing Data

**Warning**: This cannot be undone!

1. Go to Settings
2. Scroll to "Danger Zone"
3. Click "Erase All Data"
4. Confirm the action

This permanently deletes all captured ads from your device.

## Advanced: Selector Editing

If ad detection stops working (sites change their HTML):

1. Go to Settings
2. Scroll to "Selectors (Advanced)"
3. You'll see JSON configurations for each platform
4. Edit the selectors (requires CSS/HTML knowledge)
5. Click "Save Selectors"

**Warning**: Invalid JSON will break detection. Keep a backup of working selectors!

For help with selectors, see:
- [Configuration Reference](../reference/configuration.md)
- [Adding Platforms Guide](../development/adding-platforms.md)

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Reddit: Detected a "Promoted" post
- [ ] Google: Detected a "Sponsored" search result
- [ ] Twitter/X: Detected a "Promoted" tweet
- [ ] Popup gallery shows all captured ads
- [ ] Platform filter works
- [ ] Time range filter works
- [ ] Search filter works
- [ ] Export JSON downloads successfully
- [ ] Export CSV downloads successfully
- [ ] Settings page opens
- [ ] Platform toggles work
- [ ] Privacy settings toggle correctly

## Debugging

### No Ads Appearing?

**Check if the platform is enabled**:
1. Open Settings
2. Verify the platform toggle is ON

**Check the console**:
1. Visit the platform website
2. Open Chrome DevTools (F12)
3. Look for Ad Mirror logs in the Console tab
4. You should see detection messages

**Service Worker logs**:
1. Go to `chrome://extensions/`
2. Find Ad Mirror
3. Click "service worker" link
4. Check for errors in the console

### Ads Detected But Not Showing in Gallery?

**Check IndexedDB**:
1. Open DevTools (F12) on any page
2. Go to Application tab
3. Expand IndexedDB in the sidebar
4. Look for "AdMirrorDB"
5. Check if ads are stored

**Try refreshing the popup**:
1. Close the popup
2. Click the extension icon again

### Extension Stopped Working?

**Reload the extension**:
1. Go to `chrome://extensions/`
2. Find Ad Mirror
3. Click the refresh icon
4. Or toggle it off and on

**Rebuild and reload** (development):
```bash
npm run build
```
Then refresh in `chrome://extensions/`

## Common Questions

**Q: Does Ad Mirror block ads?**  
A: No, Ad Mirror only captures metadata about ads for your personal archive. It doesn't block, hide, or interact with ads.

**Q: Can advertisers see that I'm using Ad Mirror?**  
A: No, Ad Mirror runs entirely locally and doesn't communicate with any external servers.

**Q: How much storage does it use?**  
A: Very little - typically less than 5MB even with hundreds of ads. Media files are not stored, only metadata.

**Q: Can I sync across devices?**  
A: Not yet - this is planned for v1.0. Currently, data is local to each browser.

**Q: Why don't I see ads on some pages?**  
A: Some pages may not have ads, or you may have an ad blocker that hides them before Ad Mirror can detect them.

## Next Steps

- **[Architecture Overview](architecture.md)** - Understand how Ad Mirror works
- **[Privacy Features](../features/privacy.md)** - Deep dive into privacy design
- **[Troubleshooting](../reference/troubleshooting.md)** - Solutions to common issues
- **[Contributing](../development/contributing.md)** - Help improve Ad Mirror

## Getting Help

- Check [Troubleshooting Guide](../reference/troubleshooting.md)
- Search [GitHub Issues](https://github.com/yourusername/ad-mirror/issues)
- Open a new issue if needed
- Join [community discussions](https://github.com/yourusername/ad-mirror/discussions)

---

**[← Back: Installation](installation.md)** | **[Documentation Home](../index.md)** | **[Next: Architecture →](architecture.md)**

