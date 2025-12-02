# CI/CD Pipeline

Ad Mirror uses GitHub Actions for continuous integration and deployment. This document explains the pipeline, how to use it, and how to maintain it.

## Overview

The CI/CD pipeline automatically:
- Tests code quality and functionality
- Validates selector configurations
- Builds for multiple browsers
- Checks security vulnerabilities
- Measures performance
- Creates releases
- Publishes to Chrome Web Store

## Pipeline Stages

### 1. Code Quality

**Triggers**: Every push, every PR

**Jobs**:
- **Lint** - ESLint checks
- **Format** - Prettier verification
- **Type Check** - TypeScript compilation

```yaml
- name: Lint
  run: npm run lint

- name: Format Check
  run: npm run format:check

- name: Type Check
  run: npm run type-check
```

**Why**: Catch code style and type errors early.

### 2. Testing

**Triggers**: Every push, every PR

**Jobs**:
- **Unit Tests** - Test detection engine, validators, utilities
- **Coverage** - Ensure 80%+ coverage
- **Matrix Testing** - Node 18 and 20

```yaml
strategy:
  matrix:
    node-version: [18, 20]

steps:
  - name: Run Tests
    run: npm test

  - name: Coverage Report
    run: npm run test:coverage

  - name: Upload to Codecov
    uses: codecov/codecov-action@v3
```

**Why**: Prevent regressions and ensure quality.

### 3. Config Validation

**Triggers**: Every push, every PR

**Jobs**:
- **Syntax Check** - Validate JSON syntax
- **Selector Validation** - Verify CSS selectors
- **Compatibility Check** - Ensure backward compatibility

```yaml
- name: Validate Configs
  run: npm run validate:configs

- name: Check Compatibility
  run: npm run test:config-compat
```

**Why**: Selector configs break detection if invalid.

### 4. Build

**Triggers**: After tests pass

**Jobs**:
- **Chrome Build** - Production build for Chrome
- **Firefox Build** - Cross-browser build for Firefox
- **Artifacts** - Upload build artifacts

```yaml
- name: Build Chrome
  run: npm run build

- name: Build Firefox  
  run: npm run build:firefox

- name: Upload Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: chrome-build
    path: dist/
```

**Why**: Ensure builds work on all targets.

### 5. Security Audit

**Triggers**: Every push

**Jobs**:
- **npm audit** - Check for known vulnerabilities
- **Dependency check** - Review outdated packages

```yaml
- name: Security Audit
  run: npm audit --audit-level=moderate

- name: Check Outdated
  run: npm outdated || true
```

**Why**: Catch security issues early.

### 6. Performance Benchmarks

**Triggers**: PRs only

**Jobs**:
- **Run Benchmarks** - Measure detection performance
- **Compare Baseline** - Check for regressions
- **Post Results** - Comment on PR

```yaml
- name: Run Benchmarks
  run: npm run benchmark

- name: Compare with Baseline
  run: npm run benchmark:compare

- name: Post to PR
  uses: actions/github-script@v6
```

**Why**: Detect performance regressions.

### 7. Release Packaging

**Triggers**: GitHub Release created

**Jobs**:
- **Package Extension** - Create ZIP file
- **Generate Checksums** - SHA256 hashes
- **Attach to Release** - Upload artifacts

```yaml
- name: Package
  run: npm run zip

- name: Generate Checksums
  run: sha256sum ad-mirror.zip > checksums.txt

- name: Upload Release Assets
  uses: actions/upload-release-asset@v1
```

**Why**: Automated release artifacts.

### 8. Chrome Web Store Publish

**Triggers**: Stable releases (tags matching `v*.*.*`)

**Jobs**:
- **Publish** - Auto-upload to Chrome Web Store
- **Submit Review** - Request review

```yaml
- name: Publish to Chrome Web Store
  uses: mnao305/chrome-extension-upload@v4
  with:
    file-path: ad-mirror.zip
    extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
    client-id: ${{ secrets.CHROME_CLIENT_ID }}
    client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
    refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

**Why**: Automated distribution.

### 9. Documentation Deployment

**Triggers**: Push to main branch

**Jobs**:
- **Build Docs** - Generate documentation site
- **Deploy** - Publish to GitHub Pages

```yaml
- name: Build Docs
  run: npm run docs:build

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./docs-site
```

**Why**: Keep documentation up-to-date.

### 10. Metrics Collection

**Triggers**: Push to main branch

**Jobs**:
- **Generate Metrics** - Count lines, files, selectors
- **Update Dashboard** - Store historical data

```yaml
- name: Generate Metrics
  run: npm run metrics:generate

- name: Commit Metrics
  run: |
    git add metrics/
    git commit -m "chore: update metrics [skip ci]"
    git push
```

**Why**: Track project growth.

## Required Secrets

Configure these in GitHub Settings → Secrets:

### Chrome Web Store

```
CHROME_EXTENSION_ID      - Extension ID from Chrome Web Store
CHROME_CLIENT_ID         - OAuth client ID
CHROME_CLIENT_SECRET     - OAuth client secret
CHROME_REFRESH_TOKEN     - OAuth refresh token
```

**How to get**:
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create OAuth credentials
3. Generate refresh token using Google's OAuth flow

### Codecov (Optional)

```
CODECOV_TOKEN  - For private repositories
```

**How to get**:
1. Sign up at [codecov.io](https://codecov.io)
2. Add repository
3. Copy token from settings

## Local Development

### Running Pipeline Stages Locally

```bash
# Code quality
npm run lint
npm run format:check
npm run type-check

# Testing
npm test
npm run test:coverage

# Config validation
npm run validate:configs
npm run test:config-compat

# Build
npm run build
npm run build:firefox

# Security
npm audit
npm outdated

# Benchmarks
npm run benchmark
npm run benchmark:compare

# Metrics
npm run metrics:generate
```

### Git Hooks

Automated checks before commit/push:

**Pre-commit** (runs on `git commit`):
```bash
# Automatically runs:
- ESLint (auto-fix enabled)
- Prettier (auto-format)
- Config validation

# Only on staged files (fast)
```

**Pre-push** (runs on `git push`):
```bash
# Automatically runs:
- Type check
- Unit tests

# On all files (slower)
```

**Commit-msg** (runs on `git commit`):
```bash
# Validates commit message format:
- Must follow conventional commits
- Example: "feat(detector): add new feature"
```

**Bypass hooks** (not recommended):
```bash
git commit --no-verify
git push --no-verify
```

## Release Process

### 1. Prepare Release

```bash
# Update version in package.json
npm version minor  # or major, patch

# Update CHANGELOG.md
# Add release notes

# Commit changes
git add .
git commit -m "chore: release v2.2.0"
git push
```

### 2. Create GitHub Release

```bash
# Create and push tag
git tag -a v2.2.0 -m "Release v2.2.0"
git push origin v2.2.0
```

Or use GitHub UI:
1. Go to Releases
2. Click "Draft a new release"
3. Choose tag (v2.2.0)
4. Write release notes
5. Publish release

### 3. Automated Steps

Pipeline automatically:
- Runs all tests
- Builds extension
- Creates ZIP file
- Generates checksums
- Uploads to release
- Publishes to Chrome Web Store (if stable)

### 4. Verify

- Check Chrome Web Store listing
- Download and test release artifact
- Verify checksums match

## Workflow Files

### Main Workflow

**File**: `.github/workflows/ci-cd.yml`

Contains all pipeline stages. Runs on:
- `push` - All branches
- `pull_request` - To any branch
- `release` - When created

### Branch Protection

Recommended settings for `main` branch:

- ✅ Require pull request reviews (1+)
- ✅ Require status checks to pass
  - lint
  - test (Node 18)
  - test (Node 20)
  - validate-configs
  - build
- ✅ Require branches to be up to date
- ✅ Require linear history
- ❌ Allow force pushes
- ❌ Allow deletions

## Troubleshooting

### Build Fails - Linting Errors

```bash
# Fix auto-fixable issues
npm run lint:fix

# Check remaining issues
npm run lint
```

### Build Fails - Type Errors

```bash
# Check types
npm run type-check

# Fix in editor, then verify
```

### Build Fails - Test Failures

```bash
# Run tests locally
npm test

# Run specific test
npm test detector.test.ts

# Debug test
npm run test:watch
```

### Build Fails - Config Validation

```bash
# Validate all configs
npm run validate:configs

# Validate specific config
npm run validate:config reddit

# Fix JSON syntax errors
# Then rerun validation
```

### Chrome Web Store Publish Fails

**Check**:
- Secrets are configured correctly
- Extension ID matches
- OAuth tokens haven't expired
- Chrome Web Store account is in good standing

**Regenerate tokens**:
1. Revoke old tokens
2. Create new OAuth credentials
3. Update GitHub secrets

### Coverage Below Threshold

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html

# Find uncovered lines
# Write tests for them
```

## Performance Considerations

### Pipeline Duration

Typical times:
- **Lint + Format + Type Check**: 1-2 minutes
- **Tests**: 2-3 minutes
- **Build**: 2-3 minutes
- **Total**: 5-8 minutes

### Optimization Tips

1. **Cache dependencies**:
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Parallel jobs**: Independent stages run in parallel

3. **Skip CI**: Use `[skip ci]` in commit message for docs-only changes

4. **Matrix strategy**: Test multiple Node versions in parallel

## Badges

Add to README.md:

```markdown
![CI/CD](https://github.com/USERNAME/ad-mirror/workflows/CI/CD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/USERNAME/ad-mirror/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
```

## Maintenance

### Updating Dependencies

```bash
# Check outdated
npm outdated

# Update
npm update

# Major version updates
npm install package@latest

# Test after updates
npm test
npm run build
```

### Updating Actions

Check for newer versions:
- `actions/checkout` - Keep at latest v3/v4
- `actions/setup-node` - Keep at latest v3/v4
- `codecov/codecov-action` - Keep at latest v3

### Security Updates

```bash
# Auto-fix vulnerabilities
npm audit fix

# Manual review needed
npm audit

# Update specific package
npm install package@version
```

## Learn More

- **[Deployment Guide](deployment.md)** - Release and distribution
- **[Contributing Guide](../development/contributing.md)** - Contribution workflow
- **[GitHub Actions Docs](https://docs.github.com/en/actions)** - Official documentation

---

**[← Back: Operations](../index.md)** | **[Documentation Home](../index.md)** | **[Next: Deployment →](deployment.md)**

