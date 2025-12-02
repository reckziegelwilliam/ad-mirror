# Configuration Reference

Complete reference for Ad Mirror configuration files, settings, and selector formats.

## Configuration Files

### Platform Selector Configs

**Location**: `src/content/configs/`

Platform-specific detection configurations:
- `reddit.json` - Reddit detection
- `google.json` - Google Search detection
- `twitter.json` - Twitter/X detection
- `facebook.json` - Facebook detection

### User Settings

**Location**: Browser's `chrome.storage.local`

User-configurable settings stored in browser storage.

### Metrics Data

**Location**: Browser's `localStorage`

Performance metrics for selector rules.

## Platform Config Schema

### Root Object

```typescript
interface PlatformSelectorConfig {
  platform: string;                    // Platform identifier
  version: string;                     // Config version (semver)
  containerRules: ContainerRule[];     // Container detection rules
  fieldRules: FieldRule[];            // Field extraction rules
  validators: ValidationRule[];        // Validation rules
  minConfidence: number;               // Minimum confidence threshold
  containerScoreThreshold?: number;    // Container score minimum
  adaptiveThreshold?: boolean;         // Enable adaptive threshold
}
```

### Container Rule

```typescript
interface ContainerRule {
  id: string;                          // Unique rule identifier
  type: 'label-led' | 'css' | 'attribute';
  score: number;                       // Priority score (0-1)
  
  // Label-led specific
  labelTexts?: string[];               // Labels to search for
  containerSelectors?: string[];       // Container CSS selectors
  labelSelector?: string;              // Label CSS selector
  
  // CSS specific
  selector?: string;                   // CSS selector
  
  // Attribute specific
  attribute?: string;                  // Attribute name
  value?: string;                      // Expected value
  
  // Negative filtering (v2.1+)
  excludeSelectors?: string[];         // Elements to exclude
  excludeIfContains?: string[];        // Text patterns to exclude
  excludeAncestors?: string[];         // Parent elements to exclude
}
```

### Field Rule

```typescript
interface FieldRule {
  field: string;                       // Field name
  selector: string;                    // CSS selector
  score: number;                       // Priority (0-1)
  optional: boolean;                   // Required or optional
  attribute?: string;                  // Extract from attribute
  transform?: string;                  // Transform function name
}
```

**Supported Fields**:
- `advertiserName` - Advertiser display name
- `advertiserHandle` - Platform username/handle
- `headline` - Ad headline/title
- `text` - Ad body text
- `labelText` - "Promoted"/"Sponsored" label
- `destinationUrl` - Where ad links to
- `mediaUrls` - Images/videos

### Validation Rule

```typescript
interface ValidationRule {
  type: string;                        // Validator type
  weight: number;                      // Weight in confidence (0-1)
  field?: string;                      // Field to validate
  patterns?: string[];                 // Text patterns
  minLength?: number;                  // Minimum text length
}
```

**Validator Types**:
- `required_field` - Field must exist and be non-empty
- `label_pattern` - Label must match patterns
- `url` - URL must be valid
- `min_text_length` - Text must meet minimum length
- `advertiser` - Advertiser name must be reasonable

## Example Configurations

### Complete Reddit Config

```json
{
  "platform": "reddit",
  "version": "2.1.0",
  "containerRules": [
    {
      "id": "label-led-promoted",
      "type": "label-led",
      "labelTexts": ["Promoted", "Sponsored"],
      "containerSelectors": [
        "[data-testid='post-container']",
        "div[data-promoted='true']"
      ],
      "score": 1.0,
      "excludeSelectors": [
        "[data-testid='comment']",
        "[data-testid='reply']"
      ],
      "excludeIfContains": [
        "replied to",
        "commented on"
      ],
      "excludeAncestors": [
        ".sidebar",
        "[role='complementary']"
      ]
    },
    {
      "id": "css-promoted-attr",
      "type": "css",
      "selector": "[data-promoted='true']",
      "score": 0.9
    },
    {
      "id": "attribute-sponsored",
      "type": "attribute",
      "attribute": "data-is-sponsored",
      "value": "true",
      "score": 0.85
    }
  ],
  "fieldRules": [
    {
      "field": "advertiserName",
      "selector": "[data-click-id='user'] span",
      "score": 1.0,
      "optional": false
    },
    {
      "field": "advertiserName",
      "selector": "a.author",
      "score": 0.8,
      "optional": false
    },
    {
      "field": "headline",
      "selector": "h3",
      "score": 1.0,
      "optional": true
    },
    {
      "field": "text",
      "selector": "[data-click-id='text']",
      "score": 1.0,
      "optional": true
    },
    {
      "field": "destinationUrl",
      "selector": "a[data-click-id='body']",
      "score": 1.0,
      "optional": true,
      "attribute": "href"
    },
    {
      "field": "mediaUrls",
      "selector": "img, video",
      "score": 1.0,
      "optional": true,
      "attribute": "src"
    }
  ],
  "validators": [
    {
      "type": "required_field",
      "field": "advertiserName",
      "weight": 0.3
    },
    {
      "type": "label_pattern",
      "patterns": ["Promoted", "Sponsored"],
      "weight": 0.25
    },
    {
      "type": "url",
      "field": "destinationUrl",
      "weight": 0.2
    },
    {
      "type": "min_text_length",
      "field": "text",
      "minLength": 10,
      "weight": 0.15
    },
    {
      "type": "advertiser",
      "field": "advertiserName",
      "weight": 0.1
    }
  ],
  "minConfidence": 0.5,
  "containerScoreThreshold": 0.6,
  "adaptiveThreshold": true
}
```

### Minimal Config

```json
{
  "platform": "simple-site",
  "version": "1.0.0",
  "containerRules": [
    {
      "id": "basic",
      "type": "css",
      "selector": ".ad",
      "score": 1.0
    }
  ],
  "fieldRules": [
    {
      "field": "advertiserName",
      "selector": ".advertiser",
      "score": 1.0,
      "optional": false
    }
  ],
  "validators": [
    {
      "type": "required_field",
      "field": "advertiserName",
      "weight": 1.0
    }
  ],
  "minConfidence": 0.5
}
```

## User Settings Schema

```typescript
interface UserSettings {
  // Platform toggles
  platforms: {
    reddit: boolean;
    google: boolean;
    twitter: boolean;
    facebook: boolean;
  };
  
  // Privacy settings
  capturePageUrls: boolean;            // Default: false
  storeMediaUrls: boolean;             // Default: false
  
  // Advanced settings
  debugMode: boolean;                  // Default: false
  autoCleanup: boolean;                // Default: false
  maxStoredAds: number;                // Default: 10000
  
  // Custom configs (optional)
  customConfigs?: {
    [platform: string]: PlatformSelectorConfig;
  };
}
```

### Default Settings

```json
{
  "platforms": {
    "reddit": true,
    "google": true,
    "twitter": true,
    "facebook": false
  },
  "capturePageUrls": false,
  "storeMediaUrls": false,
  "debugMode": false,
  "autoCleanup": false,
  "maxStoredAds": 10000
}
```

## Metrics Schema

```typescript
interface SelectorMetrics {
  platform: string;
  rules: {
    [ruleId: string]: {
      timesMatched: number;            // How many times matched
      timesValidated: number;          // How many passed validation
      avgConfidence: number;           // Average confidence score
      successRate: number;             // timesValidated / timesMatched
      lastUsed: number;                // Timestamp
    };
  };
  summary: {
    totalDetections: number;
    avgConfidence: number;
    lastUpdated: number;
  };
}
```

## Configuration Best Practices

### Container Rules

1. **Order by reliability**:
   ```json
   [
     { "type": "label-led", "score": 1.0 },
     { "type": "css", "score": 0.9 },
     { "type": "attribute", "score": 0.85 }
   ]
   ```

2. **Include negative filters**:
   ```json
   {
     "excludeSelectors": ["[data-testid='comment']"],
     "excludeIfContains": ["replied to"],
     "excludeAncestors": [".sidebar"]
   }
   ```

3. **Use specific selectors**:
   - Good: `[data-testid='post-container']`
   - Bad: `div`

### Field Rules

1. **Provide fallbacks**:
   ```json
   [
     { "field": "advertiserName", "selector": ".primary-selector", "score": 1.0 },
     { "field": "advertiserName", "selector": ".fallback-selector", "score": 0.8 }
   ]
   ```

2. **Mark criticality**:
   ```json
   { "field": "advertiserName", "optional": false },  // Required
   { "field": "headline", "optional": true }           // Optional
   ```

### Validators

1. **Weight by importance**:
   ```json
   { "type": "required_field", "weight": 0.3 },  // Critical
   { "type": "label_pattern", "weight": 0.25 },
   { "type": "url", "weight": 0.2 },
   { "type": "min_text_length", "weight": 0.15 },
   { "type": "advertiser", "weight": 0.1 }       // Nice-to-have
   ```

2. **Weights should sum to ~1.0**:
   ```
   0.3 + 0.25 + 0.2 + 0.15 + 0.1 = 1.0
   ```

### Thresholds

1. **Start conservative**:
   ```json
   {
     "minConfidence": 0.5,
     "containerScoreThreshold": 0.6,
     "adaptiveThreshold": true
   }
   ```

2. **Adjust based on metrics**:
   - High false positive rate → increase thresholds
   - High false negative rate → decrease thresholds

## Validation

### Validate Configs

```bash
# All configs
npm run validate:configs

# Single config
npm run validate:config reddit

# In code
import { validateConfig } from './engine/configValidator';
const result = validateConfig(config);
```

### Common Validation Errors

**Invalid CSS Selector**:
```
Error: Invalid selector: div[data-test
```
Fix: Complete the selector: `div[data-test='value']`

**Score Out of Range**:
```
Error: Score must be between 0 and 1, got 1.5
```
Fix: Use valid score: `0.9`

**Weights Don't Sum to 1.0**:
```
Warning: Validator weights sum to 0.85, expected 1.0
```
Fix: Adjust weights to total 1.0

## Editing Configs

### Via Extension UI

1. Open extension options
2. Go to "Selectors (Advanced)"
3. Select platform
4. Edit JSON
5. Click "Save"

**Auto-validation** on save.

### Via Code

1. Edit `src/content/configs/reddit.json`
2. Validate: `npm run validate:configs`
3. Test: `npm run build` and reload extension
4. Commit changes

### Custom Configs

Override default configs:

```typescript
import { setCustomConfig } from './detectionRegistry';

const customConfig = { /* ... */ };
setCustomConfig('reddit', customConfig);
```

Stored in `chrome.storage.local`.

## Environment-Specific Config

### Development

```typescript
if (process.env.NODE_ENV === 'development') {
  config.debugMode = true;
  config.minConfidence = 0.3;  // Lower threshold for testing
}
```

### Production

```typescript
if (process.env.NODE_ENV === 'production') {
  config.debugMode = false;
  config.minConfidence = 0.5;
}
```

## Troubleshooting Configs

### Config Not Loading

Check console for:
```
Error: Failed to load config for reddit
```

Verify:
- File exists in `src/content/configs/`
- JSON is valid
- Imported in `detectionRegistry.ts`

### Selectors Not Matching

Enable debug mode to see:
- Which rules are attempted
- Which rules match
- Match scores

### Low Confidence Scores

Check metrics:
```typescript
const metrics = getMetricsCollector();
const summary = metrics.getSummary('reddit');
console.log('Avg confidence:', summary.avgConfidence);
```

If low:
- Review validator weights
- Check field extraction success
- Verify negative filters aren't too aggressive

## Learn More

- **[Detection Engine](../features/detection-engine.md)** - How detection works
- **[Selector Improvements](../features/selector-improvements.md)** - Advanced features
- **[Adding Platforms](../development/adding-platforms.md)** - Create new configs

---

**[← Back: Reference](../index.md)** | **[Documentation Home](../index.md)** | **[Next: Troubleshooting →](troubleshooting.md)**

