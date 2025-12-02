# Detection Engine

The detection engine is the core of Ad Mirror's ad detection system. Introduced in v2.0, it uses a layered, data-driven approach with multiple detection strategies, fallback selectors, and confidence scoring.

## Architecture

### Three-Phase Pipeline

The detection engine processes ads in three distinct phases:

```
Phase 1: Container Detection
    ↓
Phase 2: Field Extraction
    ↓
Phase 3: Validation & Scoring
```

### Phase 1: Container Detection

**Goal**: Find elements that might be ads

**Strategies**:
1. **Label-Led Detection** - Find "Promoted"/"Sponsored" text, walk up DOM
2. **CSS Selector** - Use platform-specific CSS selectors
3. **Attribute-Based** - Match elements with specific attributes
4. **Negative Filtering** - Exclude false positives

```typescript
// Multiple strategies per platform
const containerRules = [
  {
    id: 'label-led-promoted',
    type: 'label-led',
    labelTexts: ['Promoted', 'Sponsored'],
    containerSelectors: ['[data-testid="post-container"]'],
    score: 1.0
  },
  {
    id: 'css-promoted-attr',
    type: 'css',
    selector: '[data-promoted="true"]',
    score: 0.9
  },
  {
    id: 'attribute-sponsored',
    type: 'attribute',
    attribute: 'data-is-sponsored',
    value: 'true',
    score: 0.85
  }
];
```

### Phase 2: Field Extraction

**Goal**: Extract metadata from ad containers

**Fields**:
- `advertiserName` - Who is advertising
- `advertiserHandle` - Platform username/handle
- `headline` - Ad headline/title
- `text` - Ad body text
- `destinationUrl` - Where the ad links to
- `mediaUrls` - Images/videos in the ad
- `labelText` - The "Promoted"/"Sponsored" label

**Fallback Selectors**:
```typescript
const fieldRules = [
  {
    field: 'advertiserName',
    selector: 'a[href*="/user/"] span',
    score: 1.0,
    optional: false
  },
  {
    field: 'advertiserName',  // Fallback
    selector: 'a.author',
    score: 0.8,
    optional: false
  },
  {
    field: 'advertiserName',  // Last resort
    selector: '.username',
    score: 0.6,
    optional: false
  }
];
```

### Phase 3: Validation & Scoring

**Goal**: Filter out false positives and compute confidence

**Validators**:
- `required_field` - Ensure critical fields are present
- `label_pattern` - Verify label matches expected text
- `url` - Validate destination URLs
- `min_text_length` - Ensure sufficient text content
- `advertiser` - Verify advertiser name is reasonable

```typescript
const validators = [
  {
    type: 'required_field',
    field: 'advertiserName',
    weight: 0.3
  },
  {
    type: 'label_pattern',
    patterns: ['Promoted', 'Sponsored'],
    weight: 0.25
  },
  {
    type: 'url',
    field: 'destinationUrl',
    weight: 0.2
  },
  {
    type: 'min_text_length',
    field: 'text',
    minLength: 10,
    weight: 0.15
  },
  {
    type: 'advertiser',
    field: 'advertiserName',
    weight: 0.1
  }
];
```

**Confidence Score**:
```
confidence = Σ (validator_score × weight)
```

Only ads with `confidence >= minConfidence` are captured.

## Key Features

### 1. Multi-Strategy Detection

Instead of relying on a single selector, the engine tries multiple approaches:

**Benefits**:
- Resilient to platform changes
- Higher detection rate
- Automatic fallback

**Example**:
```json
{
  "containerRules": [
    { "type": "label-led", "score": 1.0 },
    { "type": "css", "score": 0.9 },
    { "type": "attribute", "score": 0.85 }
  ]
}
```

If label-led detection fails, CSS fallback is used.

### 2. Label-Led Detection

**Most robust strategy** - searches for ad labels in the DOM:

```typescript
// Find "Promoted" text nodes
const textNodes = findTextNodes(document.body, /Promoted|Sponsored/i);

// Walk up to find container
for (const textNode of textNodes) {
  const container = textNode.parentElement?.closest('[data-testid="post-container"]');
  if (container) {
    matches.push({ element: container, score: 1.0 });
  }
}
```

**Why it works**:
- Ad labels rarely change (legal requirements)
- DOM structure can change, but labels stay
- More resilient than pure CSS selectors

### 3. Fallback Selectors

Every field has multiple extraction strategies:

```typescript
// Try selectors in order
for (const rule of fieldRules) {
  if (rule.field === targetField) {
    const element = container.querySelector(rule.selector);
    if (element?.textContent?.trim()) {
      return { value: element.textContent.trim(), score: rule.score };
    }
  }
}
```

**Graceful degradation**: If the best selector fails, try the next one.

### 4. Confidence Scoring

Every detection has a confidence score (0-1):

```typescript
const confidence = 
  (requiredFieldScore × 0.3) +
  (labelPatternScore × 0.25) +
  (urlScore × 0.2) +
  (textLengthScore × 0.15) +
  (advertiserScore × 0.1);

if (confidence >= minConfidence) {
  captureAd(candidate);
}
```

**Adaptive filtering**: High confidence threshold reduces false positives.

### 5. Negative Filtering

Explicitly exclude non-ads that might match patterns:

```json
{
  "excludeSelectors": ["[data-testid='comment']", ".reply"],
  "excludeIfContains": ["replied to", "commented on"],
  "excludeAncestors": [".sidebar", ".footer"]
}
```

**Example**: Comments might contain "Promoted" but aren't ads.

### 6. Context-Aware Extraction

Prioritize elements near the ad label:

```typescript
// Find elements close to the label in DOM tree
const candidates = container.querySelectorAll(selector);
const nearest = findNearestElement(candidates, labelElement);
```

**Better accuracy** for fields like advertiser name.

### 7. Performance Metrics

Track selector performance over time:

```typescript
{
  "label-led-promoted": {
    "timesMatched": 1247,
    "timesValidated": 1198,
    "avgConfidence": 0.87,
    "successRate": 0.96
  },
  "css-fallback": {
    "timesMatched": 53,
    "timesValidated": 41,
    "avgConfidence": 0.73,
    "successRate": 0.77
  }
}
```

**Data-driven improvements**: Identify which selectors work best.

## Configuration Format

### Complete Platform Config

```json
{
  "platform": "reddit",
  "version": "2.1.0",
  "containerRules": [
    {
      "id": "label-led-promoted",
      "type": "label-led",
      "labelTexts": ["Promoted", "Sponsored"],
      "containerSelectors": ["[data-testid='post-container']"],
      "score": 1.0,
      "excludeSelectors": ["[data-testid='comment']"],
      "excludeIfContains": ["replied to"],
      "excludeAncestors": [".sidebar"]
    }
  ],
  "fieldRules": [
    {
      "field": "advertiserName",
      "selector": "a[href*='/user/'] span",
      "score": 1.0,
      "optional": false
    }
  ],
  "validators": [
    {
      "type": "required_field",
      "field": "advertiserName",
      "weight": 0.3
    }
  ],
  "minConfidence": 0.5,
  "containerScoreThreshold": 0.6,
  "adaptiveThreshold": true
}
```

### Rule Types

**Container Rules**:
- `label-led` - Find by label text
- `css` - CSS selector
- `attribute` - Match attribute values

**Field Rules**:
- `selector` - CSS selector for extraction
- `score` - Priority (1.0 = highest)
- `optional` - Required or optional field

**Validators**:
- `required_field` - Field must exist
- `label_pattern` - Label must match pattern
- `url` - URL validation
- `min_text_length` - Minimum text length
- `advertiser` - Advertiser name validation

## Implementation

### Core Functions

**`detectAds(config, seenContainers)`**:
```typescript
export function detectAds(
  config: PlatformSelectorConfig,
  seenContainers: WeakSet<Element>
): AdCandidate[] {
  // Phase 1: Find containers
  const containerMatches = findAdContainers(config);
  
  // Deduplicate
  const newContainers = containerMatches.filter(
    m => !seenContainers.has(m.element)
  );
  
  // Phase 2 & 3: Extract and validate
  const candidates = [];
  for (const match of newContainers) {
    seenContainers.add(match.element);
    
    const fields = extractFields(match.element, config, match.context);
    const validation = validateAdCandidate({ fields }, config);
    
    if (validation.passed) {
      candidates.push({ container: match.element, fields, validation });
    }
  }
  
  return candidates;
}
```

**`findAdContainers(config)`**:
```typescript
function findAdContainers(config: PlatformSelectorConfig): ContainerMatch[] {
  const matches = [];
  
  for (const rule of config.containerRules) {
    if (rule.type === 'label-led') {
      matches.push(...findByLabel(rule));
    } else if (rule.type === 'css') {
      matches.push(...findByCSS(rule));
    } else if (rule.type === 'attribute') {
      matches.push(...findByAttribute(rule));
    }
  }
  
  // Apply negative filters
  return applyNegativeFilters(matches, config);
}
```

**`extractFields(element, config, context)`**:
```typescript
function extractFields(
  element: Element,
  config: PlatformSelectorConfig,
  context?: ExtractionContext
): AdFields {
  const fields = {};
  
  for (const field of ['advertiserName', 'text', 'destinationUrl', ...]) {
    const rules = config.fieldRules.filter(r => r.field === field);
    
    for (const rule of rules) {
      const value = extractField(element, rule, context);
      if (value) {
        fields[field] = value;
        break;  // Use first match
      }
    }
  }
  
  return fields;
}
```

### Platform Plugins

Each platform has a thin plugin that uses the detection engine:

```typescript
// src/content/platforms/reddit.ts
import { detectAds } from '../engine/detector';
import config from '../configs/reddit.json';

const seenContainers = new WeakSet<Element>();

export function detectRedditAds() {
  const candidates = detectAds(config, seenContainers);
  
  for (const candidate of candidates) {
    sendAdCandidate({
      platform: 'reddit',
      ...candidate.fields
    });
  }
}
```

## Debugging

### Debug Overlay

Enable in extension options to visualize detection:

- **Green** - High confidence (>0.8)
- **Yellow** - Medium confidence (0.6-0.8)
- **Red** - Low confidence (<0.6)

Click labels for detailed breakdown:
- Container rules attempted
- Field extraction results
- Validation scores
- Confidence calculation

### Console Logging

```typescript
console.log('[Detector] Found containers:', containerMatches.length);
console.log('[Detector] Validated:', candidates.length);
console.log('[Detector] Avg confidence:', avgConfidence);
```

### Metrics Export

Export metrics from options page:

```json
{
  "platform": "reddit",
  "rules": {
    "label-led-promoted": {
      "successRate": 0.96,
      "avgConfidence": 0.87
    }
  }
}
```

## Best Practices

### Writing Configs

1. **Start with label-led detection** - Most robust
2. **Add CSS fallbacks** - For speed
3. **Include negative filters** - Reduce false positives
4. **Set reasonable thresholds** - 0.5 is a good starting point
5. **Test thoroughly** - Use debug mode on real pages

### Updating Configs

1. **Enable debug mode** - Visualize current detection
2. **Identify issues** - False positives/negatives
3. **Update selectors** - Edit config JSON
4. **Validate** - `npm run validate:configs`
5. **Test** - Verify fixes on real pages
6. **Monitor metrics** - Track success rate

### Performance Tips

- Keep rules under 20 per type
- Use specific selectors (avoid `*` or `div`)
- Enable adaptive thresholds
- Profile with `console.time()`

## Version History

- **v1.0** - Simple CSS selectors per platform
- **v2.0** - Layered detection engine with scoring
- **v2.1** - Negative filters, context-aware extraction, metrics

## Learn More

- **[Selector Improvements](selector-improvements.md)** - v2.1 enhancements
- **[Configuration Reference](../reference/configuration.md)** - Complete config docs
- **[Adding Platforms](../development/adding-platforms.md)** - Create new configs

---

**[← Back: Features](../index.md)** | **[Documentation Home](../index.md)** | **[Next: Selector Improvements →](selector-improvements.md)**

