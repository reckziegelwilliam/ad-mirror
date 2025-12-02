# Testing Infrastructure

This directory contains test fixtures and test suites for the Ad Mirror detection engine.

## Fixtures

HTML fixtures simulate real ad structures from each platform:

- `reddit-promoted-post.html` - Reddit promoted posts with various selectors
- `google-sponsored-results.html` - Google search ads
- `twitter-promoted-tweet.html` - Twitter/X promoted tweets
- `facebook-sponsored-post.html` - Facebook sponsored posts

## Running Tests

```bash
# Install test dependencies (from project root)
npm install --save-dev @jest/globals @types/jest jest jsdom ts-jest

# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Test Structure

Tests are organized by platform and cover:

1. **Container Detection** - Verify rules find correct ad containers
2. **Field Extraction** - Ensure all fields extract properly
3. **Validation** - Check confidence scoring and filtering
4. **Edge Cases** - Test fallback selectors and error handling

## Adding New Tests

1. Create HTML fixture in `fixtures/` directory
2. Add test cases in `__tests__/detector.test.ts`
3. Verify against real platform HTML when possible

## Updating Fixtures

When platforms change their HTML structure:

1. Inspect real ads in browser DevTools
2. Copy relevant HTML structure
3. Simplify to essential elements
4. Update fixture file
5. Run tests to verify configs still work
6. Update configs if needed

