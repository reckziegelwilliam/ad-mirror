# GitHub Actions Status Badges

![CI/CD Pipeline](https://github.com/YOUR_USERNAME/ad-mirror/workflows/CI/CD%20Pipeline/badge.svg)
![Test Coverage](https://codecov.io/gh/YOUR_USERNAME/ad-mirror/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

# Ad Mirror v2.1

Privacy-focused ad detection and archival browser extension with advanced layered detection pipeline.

## Features

- 🎯 **Multi-platform detection**: Reddit, Google, Twitter/X, Facebook
- 🧠 **Layered detection pipeline**: Container → Extract → Validate
- 📊 **Performance metrics**: Track selector accuracy over time
- 🔍 **Debug overlay**: Visual diagnostics with confidence scores
- ⚙️ **Configurable**: JSON-based selector configs with UI editor
- 🧪 **Well-tested**: 80%+ code coverage with fixtures
- 🚀 **Production-ready**: Full CI/CD with automated releases

## Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Validate configs
npm run validate:configs
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [CI/CD Documentation](docs/CI-CD.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Selector Improvements v2.1](SELECTOR_IMPROVEMENTS_v2.1.md)
- [Contributing Guide](CONTRIBUTING.md)

## Architecture

### Detection Pipeline

```
1. Container Detection
   ├── CSS selectors
   ├── Label-led detection
   ├── Attribute matching
   └── Negative filters

2. Field Extraction
   ├── Fallback selectors
   ├── Context-aware extraction
   └── Transform functions

3. Validation & Scoring
   ├── Required fields
   ├── Pattern matching
   ├── Confidence calculation
   └── Threshold filtering
```

### Tech Stack

- **Runtime**: TypeScript, React
- **Build**: Vite
- **Testing**: Jest, jsdom
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, Husky

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ad-mirror.git
cd ad-mirror

# Install dependencies
npm install

# Install git hooks
npm run prepare

# Run development build
npm run dev
```

### Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Watch mode
npm run test:watch

# With coverage
npm run test:unit -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## Configuration

### Selector Configs

Edit platform configs in `src/content/configs/*.json`:

```json
{
  "platform": "reddit",
  "version": "2.1.0",
  "containerRules": [...],
  "fieldRules": [...],
  "validators": [...],
  "minConfidence": 0.5
}
```

### Validation

```bash
# Validate all configs
npm run validate:configs

# Test compatibility
npm run test:config-compatibility
```

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m "feat(scope): Add amazing feature"`
6. Push: `git push origin feat/amazing-feature`
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Release Process

```bash
# Bump version
npm version patch|minor|major

# Push with tags
git push --follow-tags

# Create GitHub release
# CI automatically builds and publishes
```

## CI/CD Pipeline

Every push triggers:
- ✅ Linting & type checking
- ✅ Test suite (80%+ coverage required)
- ✅ Config validation
- ✅ Security audit
- ✅ Multi-browser builds

Every release triggers:
- ✅ Package creation
- ✅ Auto-publish to Chrome Web Store
- ✅ GitHub release with checksums

See [docs/CI-CD.md](docs/CI-CD.md) for details.

## Performance

- **Detection time**: < 60ms per page
- **Build size**: < 5MB
- **Test coverage**: > 80%
- **False positive rate**: < 2%

## Security

- npm audit on every push
- Snyk vulnerability scanning
- Automated security updates via Dependabot
- No data leaves device (privacy-first)

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

Built with the layered detection pipeline architecture for robust, maintainable ad detection.

## Support

- [Report Issues](https://github.com/YOUR_USERNAME/ad-mirror/issues)
- [Discussions](https://github.com/YOUR_USERNAME/ad-mirror/discussions)
- [Documentation](https://ad-mirror.example.com)

