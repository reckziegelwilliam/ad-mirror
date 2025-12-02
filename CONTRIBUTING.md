# Contributing to Ad Mirror

Thank you for considering contributing to Ad Mirror! This document provides guidelines and instructions.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming community

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Use bug report template
3. Include:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Console errors

### Suggesting Features

1. Check existing feature requests
2. Describe the problem you're solving
3. Explain your proposed solution
4. Consider impact on privacy

### Improving Selector Configs

Selector configs are the most common contribution area:

```bash
# 1. Test current detection on platform
# Enable debug mode in extension

# 2. Identify issues
# - False positives
# - False negatives
# - Missing fields

# 3. Edit config
vim src/content/configs/reddit.json

# 4. Validate
npm run validate:configs

# 5. Test
npm run test:unit

# 6. Commit
git commit -m "config(reddit): Improve headline extraction"
```

## Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/ad-mirror.git
cd ad-mirror

# Install dependencies
npm install

# Install git hooks
npm run prepare

# Create feature branch
git checkout -b feat/my-feature

# Start development
npm run dev
```

## Code Standards

### TypeScript

- Use strict type checking
- Avoid `any` when possible
- Document complex functions
- Export types when needed

```typescript
// Good
export function detectAds(config: PlatformSelectorConfig): AdCandidate[] {
  // Implementation
}

// Avoid
export function detectAds(config: any): any {
  // Implementation
}
```

### Naming Conventions

- **Files**: camelCase.ts
- **Components**: PascalCase.tsx
- **Functions**: camelCase
- **Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

### Commit Messages

Follow conventional commits:

```
type(scope): Subject

Body (optional)

Footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `config` - Selector config changes
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `perf` - Performance improvement

**Examples:**
```
feat(detector): Add context-aware field extraction
fix(reddit): Correct advertiser selector for new layout
config(twitter): Add negative filters for replies
docs(ci): Update pipeline documentation
test(validator): Add edge case tests
```

## Testing Requirements

### Unit Tests

Required for:
- New detection engine features
- Validator functions
- Utility functions

```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Required for:
- Full pipeline changes
- Platform plugin modifications

Use fixtures:
```typescript
const doc = loadFixture('reddit-promoted-post.html');
const candidates = detectAds(config, new WeakSet(), doc);
expect(candidates.length).toBeGreaterThan(0);
```

### Coverage

Maintain or improve:
- Lines: 80%+
- Branches: 70%+
- Functions: 75%+

## Pull Request Process

1. **Create PR** with descriptive title
2. **Fill out template** completely
3. **Link related issues**
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Wait for CI** to pass (all checks green)
7. **Squash and merge** when approved

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Config validated
- [ ] No linting errors
- [ ] Type check passes
- [ ] Coverage maintained
- [ ] Changelog updated

## Selector Config Guidelines

### Best Practices

1. **Use multiple strategies**
   ```json
   "containerRules": [
     { "type": "label-led", "score": 1.0 },
     { "type": "css", "score": 0.9 },
     { "type": "attribute", "score": 0.85 }
   ]
   ```

2. **Add fallback selectors**
   ```json
   "fieldRules": [
     { "field": "advertiser", "selector": "a[href*='/user/']", "score": 1.0 },
     { "field": "advertiser", "selector": "a[href*='/r/']", "score": 0.7 }
   ]
   ```

3. **Use negative filters**
   ```json
   {
     "excludeSelectors": ["[data-testid='comment']"],
     "excludeIfContains": ["replied to"],
     "excludeAncestors": [".sidebar"]
   }
   ```

4. **Test on real pages**
   - Enable debug mode
   - Verify confidence scores
   - Check for false positives
   - Validate field extraction

### Config Testing

```bash
# Validate syntax
npm run validate:configs

# Test in browser
npm run build
# Load extension in browser
# Enable debug mode
# Verify detection works
```

## Performance Guidelines

- Keep detection time < 60ms per page
- Limit rules to < 20 per type
- Use specific selectors (avoid broad matching)
- Test with large pages (100+ posts)

## Security Guidelines

- Never log user data
- Strip tracking parameters from URLs
- Respect privacy settings
- No external API calls from content scripts
- All data stays local

## Review Process

### Maintainer Checklist

- [ ] Code quality (follows standards)
- [ ] Tests pass (including new tests)
- [ ] Config validated
- [ ] No performance regression
- [ ] Documentation updated
- [ ] Breaking changes noted
- [ ] Backward compatible (or migration path provided)

### Review Timeline

- Initial response: Within 3 days
- Full review: Within 7 days
- Merge after approval: Within 2 days

## Getting Help

- [GitHub Discussions](https://github.com/YOUR_USERNAME/ad-mirror/discussions)
- [Issue Tracker](https://github.com/YOUR_USERNAME/ad-mirror/issues)
- [Documentation](docs/)

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- GitHub contributors page
- Release notes

Thank you for contributing to Ad Mirror! 🎉

