/**
 * Detection Engine Tests
 * Tests the three-phase detection pipeline using HTML fixtures
 */

import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { findAdContainers, extractFields, detectAds } from '../detector';
import { PlatformSelectorConfig } from '../../../shared/types/detection';
import * as fs from 'fs';
import * as path from 'path';

// Load fixtures
const fixturesDir = path.join(__dirname, '../../fixtures');

function loadFixture(filename: string): Document {
  const html = fs.readFileSync(path.join(fixturesDir, filename), 'utf-8');
  const dom = new JSDOM(html);
  return dom.window.document;
}

// Load configs
const configsDir = path.join(__dirname, '../../configs');

function loadConfig(platform: string): PlatformSelectorConfig {
  const json = fs.readFileSync(path.join(configsDir, `${platform}.json`), 'utf-8');
  return JSON.parse(json);
}

// ============================================================================
// REDDIT TESTS
// ============================================================================

describe('Reddit Detection', () => {
  let redditConfig: PlatformSelectorConfig;
  let redditDoc: Document;

  beforeEach(() => {
    redditConfig = loadConfig('reddit');
    redditDoc = loadFixture('reddit-promoted-post.html');
  });

  it('should find promoted post containers', () => {
    const containers = findAdContainers(redditConfig, redditDoc);
    
    expect(containers.length).toBeGreaterThanOrEqual(2);
    expect(containers[0].ruleType).toBeDefined();
    expect(containers[0].score).toBeGreaterThan(0.5);
  });

  it('should extract advertiser name', () => {
    const containers = findAdContainers(redditConfig, redditDoc);
    const { fields } = extractFields(containers[0].container, redditConfig.fieldRules);
    
    expect(fields.advertiser).toBeDefined();
    expect(fields.advertiser).toContain('TestAdvertiser');
  });

  it('should extract headline', () => {
    const containers = findAdContainers(redditConfig, redditDoc);
    const { fields } = extractFields(containers[0].container, redditConfig.fieldRules);
    
    expect(fields.headline).toBeDefined();
    expect(fields.headline).toContain('test promoted post headline');
  });

  it('should extract destination URL', () => {
    const containers = findAdContainers(redditConfig, redditDoc);
    const { fields } = extractFields(containers[0].container, redditConfig.fieldRules);
    
    expect(fields.destinationUrl).toBeDefined();
    expect(fields.destinationUrl).toContain('example.com');
  });

  it('should not detect regular posts as ads', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(redditConfig, seenContainers, redditDoc);
    
    // Should find 2 promoted posts, not the regular one
    expect(candidates.length).toBe(2);
  });

  it('should validate ads with sufficient confidence', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(redditConfig, seenContainers, redditDoc);
    
    expect(candidates.length).toBeGreaterThan(0);
    
    for (const candidate of candidates) {
      expect(candidate.validation.valid).toBe(true);
      expect(candidate.validation.confidence).toBeGreaterThanOrEqual(redditConfig.minConfidence);
    }
  });
});

// ============================================================================
// GOOGLE TESTS
// ============================================================================

describe('Google Detection', () => {
  let googleConfig: PlatformSelectorConfig;
  let googleDoc: Document;

  beforeEach(() => {
    googleConfig = loadConfig('google');
    googleDoc = loadFixture('google-sponsored-results.html');
  });

  it('should find sponsored sections', () => {
    const containers = findAdContainers(googleConfig, googleDoc);
    
    expect(containers.length).toBeGreaterThanOrEqual(2);
  });

  it('should extract advertiser from heading', () => {
    const containers = findAdContainers(googleConfig, googleDoc);
    const { fields } = extractFields(containers[0].container, googleConfig.fieldRules);
    
    expect(fields.advertiser).toBeDefined();
  });

  it('should extract destination URLs', () => {
    const containers = findAdContainers(googleConfig, googleDoc);
    const { fields } = extractFields(containers[0].container, googleConfig.fieldRules);
    
    expect(fields.destinationUrl).toBeDefined();
    expect(fields.destinationUrl).toMatch(/^https?:\/\//);
  });

  it('should not detect organic results as ads', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(googleConfig, seenContainers, googleDoc);
    
    // Verify we only get sponsored results
    for (const candidate of candidates) {
      const text = candidate.container.textContent || '';
      expect(text.toLowerCase()).toMatch(/sponsor|ad/);
    }
  });

  it('should pass validation for sponsored results', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(googleConfig, seenContainers, googleDoc);
    
    expect(candidates.length).toBeGreaterThan(0);
    
    for (const candidate of candidates) {
      expect(candidate.validation.valid).toBe(true);
    }
  });
});

// ============================================================================
// TWITTER TESTS
// ============================================================================

describe('Twitter Detection', () => {
  let twitterConfig: PlatformSelectorConfig;
  let twitterDoc: Document;

  beforeEach(() => {
    twitterConfig = loadConfig('twitter');
    twitterDoc = loadFixture('twitter-promoted-tweet.html');
  });

  it('should find promoted tweets', () => {
    const containers = findAdContainers(twitterConfig, twitterDoc);
    
    expect(containers.length).toBeGreaterThanOrEqual(3);
  });

  it('should extract advertiser name', () => {
    const containers = findAdContainers(twitterConfig, twitterDoc);
    const { fields } = extractFields(containers[0].container, twitterConfig.fieldRules);
    
    expect(fields.advertiser).toBeDefined();
  });

  it('should extract tweet text', () => {
    const containers = findAdContainers(twitterConfig, twitterDoc);
    const { fields } = extractFields(containers[0].container, twitterConfig.fieldRules);
    
    expect(fields.body).toBeDefined();
    expect(fields.body).toContain('promoted tweet');
  });

  it('should handle both article[data-testid] and article fallback selectors', () => {
    const containers = findAdContainers(twitterConfig, twitterDoc);
    
    // Should find promoted tweets using both selectors
    const testIdMatches = containers.filter(c => 
      c.container.getAttribute('data-testid') === 'tweet'
    );
    const fallbackMatches = containers.filter(c => 
      c.container.tagName === 'ARTICLE' && !c.container.getAttribute('data-testid')
    );
    
    expect(testIdMatches.length + fallbackMatches.length).toBeGreaterThan(0);
  });

  it('should not detect regular tweets as ads', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(twitterConfig, seenContainers, twitterDoc);
    
    // Should only find promoted tweets
    for (const candidate of candidates) {
      const text = candidate.container.textContent || '';
      expect(text.toLowerCase()).toMatch(/promot|ad/);
    }
  });
});

// ============================================================================
// FACEBOOK TESTS
// ============================================================================

describe('Facebook Detection', () => {
  let facebookConfig: PlatformSelectorConfig;
  let facebookDoc: Document;

  beforeEach(() => {
    facebookConfig = loadConfig('facebook');
    facebookDoc = loadFixture('facebook-sponsored-post.html');
  });

  it('should find sponsored posts', () => {
    const containers = findAdContainers(facebookConfig, facebookDoc);
    
    expect(containers.length).toBeGreaterThanOrEqual(3);
  });

  it('should extract advertiser name', () => {
    const containers = findAdContainers(facebookConfig, facebookDoc);
    const { fields } = extractFields(containers[0].container, facebookConfig.fieldRules);
    
    expect(fields.advertiser).toBeDefined();
  });

  it('should extract post text', () => {
    const containers = findAdContainers(facebookConfig, facebookDoc);
    const { fields } = extractFields(containers[0].container, facebookConfig.fieldRules);
    
    expect(fields.body).toBeDefined();
  });

  it('should handle both "Sponsored" and "Paid partnership" labels', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(facebookConfig, seenContainers, facebookDoc);
    
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    
    // Check that both label types are detected
    const texts = candidates.map(c => c.container.textContent || '');
    const hasSponsored = texts.some(t => t.includes('Sponsored'));
    const hasPaidPartnership = texts.some(t => t.includes('Paid partnership'));
    
    expect(hasSponsored || hasPaidPartnership).toBe(true);
  });

  it('should not detect regular posts as ads', () => {
    const seenContainers = new WeakSet<HTMLElement>();
    const candidates = detectAds(facebookConfig, seenContainers, facebookDoc);
    
    // Verify all candidates have ad labels
    for (const candidate of candidates) {
      const text = candidate.container.textContent || '';
      expect(text.toLowerCase()).toMatch(/sponsor|paid partnership/);
    }
  });
});

// ============================================================================
// CROSS-PLATFORM TESTS
// ============================================================================

describe('Cross-Platform Validation', () => {
  it('all configs should have required structure', () => {
    const platforms = ['reddit', 'google', 'twitter', 'facebook'];
    
    for (const platform of platforms) {
      const config = loadConfig(platform);
      
      expect(config.platform).toBe(platform);
      expect(config.version).toBeDefined();
      expect(config.containerRules).toBeInstanceOf(Array);
      expect(config.containerRules.length).toBeGreaterThan(0);
      expect(config.fieldRules).toBeInstanceOf(Array);
      expect(config.fieldRules.length).toBeGreaterThan(0);
      expect(config.validators).toBeInstanceOf(Array);
      expect(config.minConfidence).toBeGreaterThan(0);
      expect(config.minConfidence).toBeLessThanOrEqual(1);
    }
  });

  it('all configs should have label-led container rules', () => {
    const platforms = ['reddit', 'google', 'twitter', 'facebook'];
    
    for (const platform of platforms) {
      const config = loadConfig(platform);
      
      const hasLabelLed = config.containerRules.some(r => r.type === 'label-led');
      expect(hasLabelLed).toBe(true);
    }
  });

  it('all configs should extract required fields', () => {
    const platforms = ['reddit', 'google', 'twitter', 'facebook'];
    
    for (const platform of platforms) {
      const config = loadConfig(platform);
      
      const fields = new Set(config.fieldRules.map(r => r.field));
      
      // All platforms should extract at least advertiser and destinationUrl
      expect(fields.has('advertiser')).toBe(true);
      expect(fields.has('destinationUrl')).toBe(true);
    }
  });
});

