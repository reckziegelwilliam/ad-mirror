# Testing Guide

This guide covers testing approaches and best practices for Ad Mirror.

## Testing Philosophy

Ad Mirror uses multiple testing strategies:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test complete detection pipelines
3. **Fixture-Based Tests** - Test with realistic HTML samples
4. **Manual Browser Testing** - Test in real browsers
5. **Debug Mode** - Visual inspection of detection

## Test Framework

Ad Mirror uses **Vitest** - a fast, modern test runner compatible with Jest.

### Why Vitest?

- Fast - native ESM support
- Compatible with Jest APIs
- Great TypeScript support
- Built-in coverage reporting
- Watch mode with intelligent re-runs

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Watch mode (runs tests on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test detector.test.ts

# Run tests matching pattern
npm test -- --grep "Reddit"
```

### Coverage Thresholds

Maintain these minimum coverage levels:

- **Lines**: 80%
- **Branches**: 70%
- **Functions**: 75%

Check current coverage:
```bash
npm run test:coverage
```

Opens HTML report in browser showing coverage by file.

## Writing Unit Tests

### Test File Structure

Create test files next to source files or in `__tests__` directories:

```
src/content/engine/
├── detector.ts
├── validators.ts
└── __tests__/
    ├── detector.test.ts
    └── validators.test.ts
```

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { myFunction } from '../myModule';

describe('myFunction', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize test data
  });

  // Cleanup after each test
  afterEach(() => {
    // Clean up resources
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBeNull();
  });
});
```

### Testing Detection Engine

```typescript
import { describe, it, expect } from 'vitest';
import { detectAds } from '../detector';
import { loadConfig } from '../../detectionRegistry';

describe('detectAds', () => {
  it('should detect ads from container elements', () => {
    const config = loadConfig('reddit');
    const seenContainers = new WeakSet<Element>();
    
    // Create mock DOM
    document.body.innerHTML = `
      <div data-testid="post-container">
        <span>Promoted</span>
        <a href="/user/advertiser">Advertiser Name</a>
        <p>Ad text content here</p>
      </div>
    `;
    
    const candidates = detectAds(config!, seenContainers);
    
    expect(candidates).toHaveLength(1);
    expect(candidates[0].fields.advertiserName).toBe('Advertiser Name');
    expect(candidates[0].fields.text).toContain('Ad text');
    expect(candidates[0].validation.confidence).toBeGreaterThan(0.5);
  });

  it('should not detect same container twice', () => {
    const config = loadConfig('reddit');
    const seenContainers = new WeakSet<Element>();
    
    const candidates1 = detectAds(config!, seenContainers);
    const candidates2 = detectAds(config!, seenContainers);
    
    expect(candidates1.length).toBeGreaterThan(0);
    expect(candidates2.length).toBe(0);
  });
});
```

### Testing Validators

```typescript
import { describe, it, expect } from 'vitest';
import { validateRequiredField, validateAdCandidate } from '../validators';

describe('validateRequiredField', () => {
  it('should pass when field is present and non-empty', () => {
    const fields = { advertiserName: 'Acme Corp', text: 'Buy now!' };
    const result = validateRequiredField('advertiserName', fields);
    
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
  });

  it('should fail when field is missing', () => {
    const fields = { text: 'Buy now!' };
    const result = validateRequiredField('advertiserName', fields);
    
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should fail when field is empty string', () => {
    const fields = { advertiserName: '', text: 'Buy now!' };
    const result = validateRequiredField('advertiserName', fields);
    
    expect(result.passed).toBe(false);
  });
});

describe('validateAdCandidate', () => {
  const mockConfig = {
    validators: [
      { type: 'required_field', field: 'advertiserName', weight: 0.3 },
      { type: 'required_field', field: 'text', weight: 0.2 },
      { type: 'url', field: 'destinationUrl', weight: 0.2 },
    ],
    minConfidence: 0.5,
  };

  it('should validate complete candidates', () => {
    const candidate = {
      fields: {
        advertiserName: 'Acme Corp',
        text: 'Buy our product now!',
        destinationUrl: 'https://example.com',
      },
      // ...
    };
    
    const result = validateAdCandidate(candidate, mockConfig);
    
    expect(result.passed).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.details).toHaveLength(3);
  });
});
```

### Testing React Components

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdCard } from '../AdCard';

describe('AdCard', () => {
  const mockAd = {
    id: '1',
    platform: 'reddit',
    advertiserName: 'Acme Corp',
    text: 'Buy now!',
    detectedAt: Date.now(),
  };

  it('should render ad information', () => {
    render(<AdCard ad={mockAd} />);
    
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Buy now!')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AdCard ad={mockAd} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledWith(mockAd);
  });
});
```

## Fixture-Based Testing

### Using HTML Fixtures

Fixtures are realistic HTML samples from actual platforms:

```
src/content/fixtures/
├── reddit-promoted-post.html
├── google-sponsored-results.html
├── twitter-promoted-tweet.html
└── facebook-sponsored-post.html
```

### Loading Fixtures

```typescript
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

function loadFixture(filename: string): Document {
  const html = fs.readFileSync(
    path.join(__dirname, '../fixtures', filename),
    'utf-8'
  );
  const dom = new JSDOM(html);
  return dom.window.document;
}

describe('Reddit detection with fixtures', () => {
  it('should detect promoted posts', () => {
    const doc = loadFixture('reddit-promoted-post.html');
    const config = loadConfig('reddit');
    
    // Use fixture document instead of global document
    const containers = doc.querySelectorAll('[data-testid="post-container"]');
    // ... test detection
  });
});
```

### Creating New Fixtures

1. **Visit platform page** with ads
2. **Open DevTools** and find ad container
3. **Copy outerHTML** of container and surrounding context
4. **Save to file** in `src/content/fixtures/`
5. **Clean up** personal data (usernames, etc.)
6. **Document** what the fixture contains

Example fixture structure:
```html
<!-- reddit-promoted-post.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reddit Fixture</title>
</head>
<body>
  <!-- Promoted post #1 -->
  <div data-testid="post-container" data-promoted="true">
    <span aria-label="Promoted">Promoted</span>
    <a href="/user/advertiser1">Advertiser One</a>
    <h3>Amazing Product Headline</h3>
    <p>Check out our amazing product today!</p>
    <a href="https://example.com/product">Learn More</a>
  </div>

  <!-- Regular post (should not be detected) -->
  <div data-testid="post-container">
    <a href="/user/regular_user">Regular User</a>
    <h3>Regular Post Title</h3>
    <p>This is not an ad.</p>
  </div>

  <!-- Promoted post #2 -->
  <div data-testid="post-container" data-promoted="true">
    <span>Promoted</span>
    <a href="/user/advertiser2">Advertiser Two</a>
    <h3>Another Ad</h3>
  </div>
</body>
</html>
```

## Integration Testing

### Testing Complete Pipeline

```typescript
describe('Reddit detection pipeline', () => {
  it('should detect, extract, and validate ads', () => {
    const doc = loadFixture('reddit-promoted-post.html');
    const config = loadConfig('reddit');
    const seenContainers = new WeakSet<Element>();
    
    // Run detection
    const candidates = detectAds(config!, seenContainers, doc);
    
    // Verify detection
    expect(candidates).toHaveLength(2);
    
    // Verify extraction
    expect(candidates[0].fields.advertiserName).toBeTruthy();
    expect(candidates[0].fields.text).toBeTruthy();
    expect(candidates[0].fields.labelText).toBe('Promoted');
    
    // Verify validation
    expect(candidates[0].validation.passed).toBe(true);
    expect(candidates[0].validation.confidence).toBeGreaterThan(0.5);
    
    // Verify no false positives
    const regularPost = doc.querySelector('[data-testid="post-container"]:not([data-promoted])');
    expect(candidates.every(c => c.container !== regularPost)).toBe(true);
  });
});
```

## Manual Browser Testing

### Test Checklist

For each platform, verify:

- [ ] Ads are detected
- [ ] No false positives
- [ ] All fields extracted correctly
- [ ] Confidence scores reasonable (>0.5)
- [ ] No duplicates
- [ ] No console errors
- [ ] Performance acceptable (<60ms)

### Using Debug Mode

1. **Open extension options**
2. **Enable Debug Mode**
3. **Visit platform page**
4. **Observe**:
   - Green outlines = high confidence (>0.8)
   - Yellow outlines = medium confidence (0.6-0.8)
   - Red outlines = low confidence (<0.6)
5. **Click labels** for detailed information
6. **Check console** for detection logs

### Performance Testing

```typescript
// Add to content script temporarily
console.time('detection');
const candidates = detectAds(config, seenContainers);
console.timeEnd('detection');
// Should be < 60ms

console.log('Candidates found:', candidates.length);
console.log('Avg confidence:', 
  candidates.reduce((sum, c) => sum + c.validation.confidence, 0) / candidates.length
);
```

## Mocking

### Mocking Chrome APIs

```typescript
import { vi } from 'vitest';

// Mock chrome.runtime.sendMessage
global.chrome = {
  runtime: {
    sendMessage: vi.fn((message, callback) => {
      callback?.({ success: true });
      return Promise.resolve({ success: true });
    }),
  },
} as any;

// Use in tests
it('should send message to background', () => {
  sendAdCandidate(mockAd);
  expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
    type: 'AD_CANDIDATE',
    payload: mockAd,
  });
});
```

### Mocking IndexedDB

```typescript
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Automatically uses fake-indexeddb for tests
it('should store ads in database', async () => {
  await storeAd(mockAd);
  const stored = await getAd(mockAd.id);
  expect(stored).toEqual(mockAd);
});
```

## Continuous Integration

Tests run automatically on:
- Every push to any branch
- Every pull request
- Before merging

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Best Practices

### Do's

✅ **Write tests first** (TDD) for complex logic  
✅ **Test edge cases** (null, empty, invalid input)  
✅ **Keep tests focused** - one concept per test  
✅ **Use descriptive test names** - explain what's being tested  
✅ **Clean up after tests** - avoid state leakage  
✅ **Mock external dependencies** - keep tests fast and isolated  
✅ **Test behavior, not implementation** - refactoring shouldn't break tests  

### Don'ts

❌ **Don't test implementation details** - test public APIs  
❌ **Don't make tests dependent on each other** - each should run independently  
❌ **Don't test third-party code** - trust that it works  
❌ **Don't ignore failing tests** - fix or remove them  
❌ **Don't test everything** - focus on critical and complex code  

## Debugging Tests

### Run Single Test

```bash
# Run specific test file
npm test detector.test.ts

# Run tests matching description
npm test -- --grep "should detect Reddit ads"

# Run in watch mode
npm run test:watch detector.test.ts
```

### Debug with VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["run", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Then: Set breakpoints → Press F5 → Debug

### Verbose Output

```bash
# Show full error stacks
npm test -- --reporter=verbose

# Show console.log output
npm test -- --reporter=verbose --silent=false
```

## Test Coverage

### Viewing Coverage

```bash
# Generate and open HTML report
npm run test:coverage
open coverage/index.html
```

### Improving Coverage

1. **Find uncovered lines**: Check HTML report
2. **Write tests**: Cover those specific cases
3. **Verify**: Re-run coverage report
4. **Refactor if needed**: Some code may be untestable (refactor it)

### Excluding from Coverage

For generated or trivial code:
```typescript
/* istanbul ignore next */
export function trivialFunction() {
  // Won't affect coverage
}
```

## Performance Testing

### Benchmark Detection

```bash
npm run benchmark
```

Runs detection on fixtures and reports timing.

### Profile in Browser

1. **Open DevTools** on platform page
2. **Go to Performance tab**
3. **Click Record**
4. **Trigger detection** (scroll, reload)
5. **Stop recording**
6. **Analyze flame graph** - look for slow functions

## Next Steps

- **[Development Setup](setup.md)** - Set up your environment
- **[Contributing Guide](contributing.md)** - Learn contribution workflow
- **[Adding Platforms](adding-platforms.md)** - Add new platform support
- **[Architecture](../getting-started/architecture.md)** - Understand the system

---

**[← Back: Contributing](contributing.md)** | **[Documentation Home](../index.md)** | **[Next: Features →](../features/detection-engine.md)**

