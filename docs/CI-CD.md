# CI/CD Pipeline Documentation

## Overview

Ad Mirror uses GitHub Actions for comprehensive CI/CD with automated testing, validation, building, and deployment.

## Pipeline Stages

### 1. **Lint & Format Check**
- Runs ESLint on all TypeScript files
- Checks TypeScript type correctness
- Verifies code formatting with Prettier
- **Triggers:** Every push and PR

### 2. **Test Suite**
- Unit tests with Jest
- Integration tests with fixtures
- Code coverage reporting to Codecov
- Tests on Node 18 and 20
- **Coverage Requirements:**
  - Branches: 70%
  - Functions: 75%
  - Lines: 80%
  - Statements: 80%

### 3. **Config Validation**
- Validates all platform selector configs
- Checks for syntax errors
- Verifies config compatibility
- Ensures no duplicate rule IDs
- **Triggers:** Every push and PR

### 4. **Build**
- Builds for Chrome and Firefox
- Verifies build output
- Calculates bundle size
- Uploads artifacts (30-day retention)
- **Triggers:** After successful tests

### 5. **Security Audit**
- npm audit for vulnerabilities
- Snyk security scanning
- Checks for known CVEs
- **Triggers:** Every push

### 6. **Performance Benchmarks**
- Measures detection speed per platform
- Compares with baseline
- Posts results to PR comments
- **Triggers:** Pull requests only

### 7. **Package & Release**
- Creates ZIP packages
- Generates SHA256 checksums
- Uploads to GitHub releases
- **Triggers:** On release published

### 8. **Auto-Publish**
- Publishes to Chrome Web Store (optional)
- **Triggers:** On stable release (non-prerelease)
- **Requires Secrets:**
  - `CHROME_EXTENSION_ID`
  - `CHROME_CLIENT_ID`
  - `CHROME_CLIENT_SECRET`
  - `CHROME_REFRESH_TOKEN`

### 9. **Deploy Documentation**
- Builds TypeDoc documentation
- Deploys to GitHub Pages
- **Triggers:** Push to main branch

### 10. **Metrics Collection**
- Analyzes code metrics
- Tracks LOC, test files, selector rules
- Updates metrics dashboard
- **Triggers:** Push to main branch

## Local Development Commands

```bash
# Install dependencies
npm install

# Install git hooks
npm run prepare

# Development
npm run dev

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Type checking
npm run type-check

# Testing
npm test                  # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:watch       # Watch mode

# Config validation
npm run validate:configs
npm run test:config-compatibility

# Building
npm run build            # Default build
npm run build:chrome     # Chrome-specific
npm run build:firefox    # Firefox-specific

# Security
npm run security:check

# Benchmarks
npm run benchmark
npm run benchmark:compare

# Metrics
npm run metrics:generate

# Documentation
npm run docs:build
```

## Git Hooks

### Pre-commit
- Runs lint-staged
- Fixes ESLint errors
- Formats code with Prettier
- Validates modified configs

### Pre-push
- Type checks entire codebase
- Runs unit tests

### Commit Message
- Validates commit message format
- Enforces conventional commits
- **Format:** `type(scope): Subject`
- **Example:** `feat(detector): Add context-aware extraction`

## Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code formatting
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Tests
- `build` - Build system
- `ci` - CI/CD changes
- `chore` - Maintenance
- `config` - Selector config changes

## Release Process

### 1. Version Bump
```bash
npm version patch  # 2.1.0 -> 2.1.1
npm version minor  # 2.1.0 -> 2.2.0
npm version major  # 2.1.0 -> 3.0.0
```

### 2. Create Release
- Push tags: `git push --tags`
- Create GitHub release from tag
- CI automatically builds and attaches packages

### 3. Publish (Automatic)
- Chrome Web Store: Auto-publishes on stable release
- Firefox: Manual submission (for now)

## Required Secrets

Configure in GitHub repo settings → Secrets and variables → Actions:

```
CHROME_EXTENSION_ID      # Your Chrome extension ID
CHROME_CLIENT_ID         # OAuth client ID
CHROME_CLIENT_SECRET     # OAuth client secret
CHROME_REFRESH_TOKEN     # OAuth refresh token
SNYK_TOKEN              # Snyk API token (optional)
CODECOV_TOKEN           # Codecov token (optional)
```

## Coverage Reports

- View on [Codecov](https://codecov.io)
- Local report: `npm run test:unit -- --coverage`
- HTML report: `open coverage/lcov-report/index.html`

## Troubleshooting

### Tests Failing Locally
```bash
# Clear cache
npm run test -- --clearCache

# Update snapshots
npm run test -- -u
```

### Lint Errors
```bash
# Auto-fix
npm run lint:fix
npm run format
```

### Type Errors
```bash
# Check for errors
npm run type-check

# Build to see detailed errors
npm run build
```

### Config Validation Errors
```bash
# Validate all configs
npm run validate:configs

# Check compatibility
npm run test:config-compatibility
```

## Performance Targets

- **Detection Time:** < 60ms per page
- **Build Size:** < 5MB total
- **Test Coverage:** > 80%
- **Bundle Size Change:** < 10% per PR

## Continuous Improvement

The CI/CD pipeline tracks:
- Code coverage trends
- Bundle size changes
- Detection performance
- Config validation pass rate
- Selector rule count

Review metrics quarterly to optimize performance and maintainability.

