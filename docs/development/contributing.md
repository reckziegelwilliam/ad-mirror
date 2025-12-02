# Contributing Guide

Thank you for considering contributing to Ad Mirror! This guide will help you contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Selector Config Guidelines](#selector-config-guidelines)

## Code of Conduct

- **Be respectful and inclusive** - Treat everyone with respect
- **Focus on constructive feedback** - Help each other improve
- **Welcome newcomers** - Everyone was new once
- **Assume good intentions** - Give others the benefit of the doubt
- **Keep discussions on topic** - Stay focused on Ad Mirror

## How to Contribute

### Reporting Bugs

Before submitting a bug report:

1. **Check existing issues** - Your bug may already be reported
2. **Use the latest version** - Update and test again
3. **Try to reproduce** - Ensure it's consistently reproducible

When submitting:

1. Use the **bug report template**
2. Include:
   - Browser name and version
   - Operating system
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/screencasts if applicable
   - Console errors (DevTools → Console)
   - Platform where issue occurs (Reddit, Google, Twitter)

Example:
```markdown
**Bug**: Reddit ads not detected after site update

**Environment**:
- Chrome 120.0
- macOS 14.1
- Ad Mirror v2.1.0

**Steps**:
1. Visit reddit.com
2. Scroll feed
3. See promoted posts
4. No ads captured

**Console errors**:
```
TypeError: Cannot read property 'textContent' of null
  at extractFields (reddit.ts:45)
```

**Expected**: Ads should be captured
**Actual**: No detection, error in console
```

### Suggesting Features

Before suggesting:

1. **Check roadmap** - May already be planned
2. **Check existing requests** - May already be suggested
3. **Consider scope** - Should fit Ad Mirror's mission

When suggesting:

1. **Describe the problem** - What issue does this solve?
2. **Propose a solution** - How would it work?
3. **Consider alternatives** - What other approaches exist?
4. **Impact on privacy** - How does this affect user privacy?
5. **Implementation complexity** - Simple, moderate, or complex?

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos and grammar
- Clarify confusing sections
- Add examples
- Update outdated information
- Add missing information

Just edit the relevant `.md` file and submit a PR!

### Improving Selector Configs

**Most common and valuable contribution!**

Selector configs break when platforms update their HTML. Here's how to fix them:

```bash
# 1. Test current detection
npm run dev
# Load extension, visit platform, check detection

# 2. Enable debug mode
# In extension options → Enable Debug Mode
# Highlights detected ads with confidence scores

# 3. Identify the issue
# - False positives (non-ads detected)
# - False negatives (ads missed)
# - Wrong field extraction (advertiser, text, etc.)

# 4. Edit config
vim src/content/configs/reddit.json

# 5. Validate changes
npm run validate:configs

# 6. Test in browser
npm run build
# Reload extension
# Visit platform
# Verify detection works

# 7. Run unit tests
npm test

# 8. Commit with clear message
git commit -m "config(reddit): Update promoted post selector for new layout"
```

### Adding New Platforms

Want to add support for a new website?

See the comprehensive guide: **[Adding Platforms](adding-platforms.md)**

## Development Workflow

### Setup

See **[Development Setup](setup.md)** for initial setup.

### Creating a Feature Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feat/my-feature
# or fix/my-fix
# or config/platform-update
```

### Making Changes

1. **Make small, focused changes** - Easier to review
2. **Test as you go** - Don't wait until the end
3. **Commit frequently** - Small, logical commits
4. **Write tests** - For new functionality
5. **Update docs** - If behavior changes

### Before Submitting

```bash
# Run full check
npm run lint           # Check code style
npm run type-check     # Check types
npm test               # Run tests
npm run build          # Ensure builds successfully
```

All should pass without errors.

## Code Standards

### TypeScript

**Use strict typing**:
```typescript
// Good ✓
export function detectAds(
  config: PlatformSelectorConfig,
  seenContainers: WeakSet<Element>
): AdCandidate[] {
  // ...
}

// Avoid ✗
export function detectAds(config: any, seenContainers: any): any {
  // ...
}
```

**Document complex functions**:
```typescript
/**
 * Extracts ad metadata from a container element
 * @param element - The ad container element
 * @param config - Platform selector configuration
 * @param context - Optional extraction context
 * @returns Extracted ad fields or null if extraction fails
 */
export function extractFields(
  element: Element,
  config: PlatformSelectorConfig,
  context?: ExtractionContext
): AdFields | null {
  // ...
}
```

**Use interfaces for object shapes**:
```typescript
// Good ✓
interface AdCandidate {
  container: Element;
  fields: AdFields;
  validation: ValidationResult;
  debug: DebugInfo;
}

// Avoid ✗
type AdCandidate = {
  container: any;
  fields: any;
  validation: any;
  debug: any;
};
```

### React Components

**Use functional components**:
```typescript
// Good ✓
export function AdCard({ ad, onClick }: AdCardProps) {
  return <div onClick={onClick}>{ad.advertiserName}</div>;
}

// Avoid ✗ (class components)
export class AdCard extends React.Component {
  render() {
    return <div>{this.props.ad.advertiserName}</div>;
  }
}
```

**Keep components focused**:
- Single responsibility
- Under 300 lines
- Extract subcomponents
- Use custom hooks for logic

### Naming Conventions

- **Files**: `camelCase.ts`, `PascalCase.tsx`
- **Functions**: `camelCase()`
- **Classes**: `PascalCase`
- **Components**: `PascalCase`
- **Interfaces**: `PascalCase`
- **Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private vars**: `_prefixedCamelCase`

### Commit Messages

Follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `config` - Selector config changes
- `docs` - Documentation only
- `test` - Test changes
- `refactor` - Code refactoring (no behavior change)
- `perf` - Performance improvement
- `chore` - Maintenance (dependencies, build, etc.)

**Scopes**:
- `reddit`, `google`, `twitter`, `facebook` - Platform-specific
- `detector` - Detection engine
- `ui` - User interface
- `storage` - Data storage
- `ci` - CI/CD changes

**Examples**:
```bash
feat(detector): Add context-aware field extraction
fix(reddit): Correct advertiser selector for new layout
config(twitter): Add negative filters for reply threads
docs(architecture): Update detection flow diagram
test(validator): Add edge case for empty containers
refactor(storage): Simplify IndexedDB queries
perf(detector): Optimize container deduplication
chore(deps): Update React to 18.2.0
```

**Subject guidelines**:
- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at the end
- Limit to 72 characters

## Testing Requirements

### When Tests Are Required

**Required**:
- New detection engine features
- New validators
- Utility functions
- Bug fixes (prevent regression)

**Optional but recommended**:
- UI components
- Integration flows
- Platform plugins (use fixtures)

### Writing Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateAdCandidate } from '../validators';

describe('validateAdCandidate', () => {
  it('should pass valid candidates', () => {
    const candidate = {
      fields: { advertiser: 'Acme Corp', text: 'Buy now!' },
      // ...
    };
    const result = validateAdCandidate(candidate, config);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should reject candidates without advertiser', () => {
    const candidate = {
      fields: { text: 'Buy now!' },
      // ...
    };
    const result = validateAdCandidate(candidate, config);
    expect(result.isValid).toBe(false);
  });
});
```

### Using Fixtures

```typescript
import { loadFixture } from '../fixtures/loader';
import { detectAds } from '../engine/detector';

it('should detect Reddit promoted posts', () => {
  const doc = loadFixture('reddit-promoted-post.html');
  const config = loadConfig('reddit');
  const candidates = detectAds(config, new WeakSet(), doc);
  
  expect(candidates).toHaveLength(2);
  expect(candidates[0].fields.labelText).toBe('Promoted');
});
```

### Coverage Requirements

Maintain or improve:
- **Lines**: 80%+
- **Branches**: 70%+
- **Functions**: 75%+

Check coverage:
```bash
npm run test:coverage
```

## Pull Request Process

### 1. Create Pull Request

- Use descriptive title (follows commit convention)
- Fill out PR template completely
- Link related issues (e.g., "Closes #123")
- Add screenshots for UI changes
- Mark as draft if not ready for review

### 2. PR Checklist

Before requesting review:

- [ ] Tests added/updated and passing
- [ ] Documentation updated (if needed)
- [ ] Config validated (`npm run validate:configs`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Coverage maintained (`npm run test:coverage`)
- [ ] Extension tested in browser
- [ ] Commit messages follow convention

### 3. Request Review

- Assign to maintainers
- Add relevant labels
- Wait for CI checks to pass
- Respond to feedback promptly

### 4. Address Feedback

- Make requested changes
- Push new commits (don't force push)
- Reply to comments when addressed
- Request re-review when ready

### 5. Merge

- Maintainer will squash and merge
- Your commits will be combined into one
- Delete your feature branch after merge

## Selector Config Guidelines

### Config Structure

```json
{
  "platform": "reddit",
  "version": "2.1.0",
  "containerRules": [
    {
      "id": "label-led-promoted",
      "type": "label-led",
      "labelTexts": ["Promoted"],
      "containerSelectors": ["[data-testid='post-container']"],
      "score": 1.0,
      "excludeSelectors": ["[data-testid='comment']"],
      "excludeIfContains": ["replied to"],
      "excludeAncestors": [".sidebar"]
    }
  ],
  "fieldRules": [
    {
      "field": "advertiser",
      "selector": "[data-click-id='user']",
      "score": 1.0,
      "optional": false
    }
  ],
  "validators": [
    {
      "type": "required_field",
      "field": "advertiser",
      "weight": 0.3
    }
  ],
  "minConfidence": 0.5,
  "containerScoreThreshold": 0.6,
  "adaptiveThreshold": true
}
```

### Best Practices

**1. Use multiple container strategies**:
```json
"containerRules": [
  { "type": "label-led", "score": 1.0 },     // Most reliable
  { "type": "css", "score": 0.9 },            // Fast
  { "type": "attribute", "score": 0.85 }      // Fallback
]
```

**2. Add fallback selectors**:
```json
"fieldRules": [
  { "field": "advertiser", "selector": "a[href*='/user/']", "score": 1.0 },
  { "field": "advertiser", "selector": "a.author", "score": 0.8 },
  { "field": "advertiser", "selector": ".advertiser-name", "score": 0.6 }
]
```

**3. Use negative filters**:
```json
{
  "excludeSelectors": ["[data-testid='comment']", ".reply"],
  "excludeIfContains": ["replied to", "commented on"],
  "excludeAncestors": [".sidebar", ".footer"]
}
```

**4. Set appropriate thresholds**:
```json
{
  "minConfidence": 0.5,             // Lower for platforms with varied layouts
  "containerScoreThreshold": 0.6,    // Minimum container score
  "adaptiveThreshold": true          // Adjusts based on max score
}
```

### Testing Configs

```bash
# 1. Validate syntax
npm run validate:configs

# 2. Build and load extension
npm run build

# 3. Enable debug mode
# Extension Options → Debug Mode

# 4. Visit platform
# - Ads highlighted with confidence scores
# - Check for false positives/negatives
# - Verify field extraction

# 5. Check metrics
# Extension Options → Export Metrics
# Review success rates per rule
```

### Config Versioning

When updating configs:

1. Increment version (semantic versioning)
2. Document changes in commit message
3. Test thoroughly before submitting

```bash
# Minor changes (new fallback selector)
2.1.0 → 2.1.1

# New features (negative filters)
2.1.1 → 2.2.0

# Breaking changes (removed rules)
2.2.0 → 3.0.0
```

## Performance Guidelines

- Keep detection time < 60ms per page
- Limit rules to < 20 per type
- Use specific selectors (avoid `*` or `div`)
- Test on pages with 100+ items
- Profile with `console.time()` if slow

## Security Guidelines

- Never log sensitive user data
- Strip tracking parameters from URLs
- Respect privacy settings
- No external API calls from content scripts
- All data processing must be local
- Validate all user inputs
- Sanitize extracted text

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/yourusername/ad-mirror/discussions)
- **Bugs**: [Issue Tracker](https://github.com/yourusername/ad-mirror/issues)
- **Docs**: [Documentation](../index.md)
- **Platform-specific**: Check existing configs for examples

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md`
- GitHub contributors page
- Release notes
- Git commit history

Thank you for contributing to Ad Mirror! Every contribution, no matter how small, makes a difference. 🎉

---

**[← Back: Setup](setup.md)** | **[Documentation Home](../index.md)** | **[Next: Adding Platforms →](adding-platforms.md)**

