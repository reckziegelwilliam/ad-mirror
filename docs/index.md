# Ad Mirror Documentation

Welcome to the Ad Mirror documentation! This guide will help you understand, use, and contribute to Ad Mirror - your private gallery of ads shown to you online.

## Quick Navigation

### 🚀 Getting Started

New to Ad Mirror? Start here:

- **[Installation Guide](getting-started/installation.md)** - Set up the extension for development or production
- **[Quick Start](getting-started/quick-start.md)** - Basic usage tutorial and testing
- **[Architecture Overview](getting-started/architecture.md)** - How Ad Mirror works under the hood

### 🛠️ Development

Contributing to Ad Mirror:

- **[Development Setup](development/setup.md)** - Set up your development environment
- **[Contributing Guide](development/contributing.md)** - Contribution guidelines and workflows
- **[Adding Platforms](development/adding-platforms.md)** - Add support for new websites
- **[Testing Guide](development/testing.md)** - Write and run tests

### ✨ Features

Deep dives into Ad Mirror's capabilities:

- **[Detection Engine](features/detection-engine.md)** - Layered ad detection system (v2.0)
- **[Selector Improvements](features/selector-improvements.md)** - Advanced selector features (v2.1)
- **[Privacy Features](features/privacy.md)** - Privacy-first design philosophy

### 🔧 Operations

Deployment and CI/CD:

- **[CI/CD Pipeline](operations/ci-cd.md)** - GitHub Actions workflow and automation
- **[Deployment Guide](operations/deployment.md)** - Release process and distribution

### 📖 Reference

Technical references:

- **[Configuration](reference/configuration.md)** - Config file formats and schemas
- **[Troubleshooting](reference/troubleshooting.md)** - Common issues, debugging, and FAQ

## Documentation Overview

### For Users

If you want to use Ad Mirror:
1. Follow the **[Installation Guide](getting-started/installation.md)** to set up
2. Read the **[Quick Start](getting-started/quick-start.md)** to learn basic features
3. Check **[Privacy Features](features/privacy.md)** to understand data handling

### For Contributors

If you want to contribute to Ad Mirror:
1. Set up your environment with **[Development Setup](development/setup.md)**
2. Read the **[Contributing Guide](development/contributing.md)** for guidelines
3. Learn about **[Adding Platforms](development/adding-platforms.md)** to extend support
4. Follow the **[Testing Guide](development/testing.md)** to ensure quality

### For Maintainers

If you maintain Ad Mirror:
1. Understand the **[CI/CD Pipeline](operations/ci-cd.md)** for automation
2. Follow the **[Deployment Guide](operations/deployment.md)** for releases
3. Use **[Troubleshooting](reference/troubleshooting.md)** for common issues

## Key Concepts

### What is Ad Mirror?

Ad Mirror is a privacy-first Chrome extension that captures and archives ads shown to you on social media and search platforms. All data stays local on your device - no servers, no tracking, no cloud storage.

**Supported Platforms:**
- Reddit
- Google Search
- Twitter/X
- Facebook (experimental)

### Core Features

- **Ad Detection**: Automatic detection using layered selector system
- **Private Gallery**: Local searchable archive in IndexedDB
- **Export**: JSON/CSV export of your ad data
- **Privacy Controls**: Toggle what data gets stored
- **Customizable Selectors**: Edit detection rules via UI

### Architecture

Ad Mirror uses a plugin-based architecture with:
- **Content Scripts**: Platform-specific detection
- **Detection Engine**: Unified detection pipeline with scoring
- **Background Service Worker**: Message routing and deduplication
- **Offscreen Document**: Stable IndexedDB storage
- **React Dashboard**: Popup and options UI

Learn more in the **[Architecture Overview](getting-started/architecture.md)**.

## Quick Links

- [Main README](../README.md)
- [GitHub Repository](https://github.com/yourusername/ad-mirror)
- [Issue Tracker](https://github.com/yourusername/ad-mirror/issues)
- [Discussions](https://github.com/yourusername/ad-mirror/discussions)

## Contributing to Documentation

Found an error or want to improve the docs? Contributions are welcome!

1. Edit the relevant markdown file in `docs/`
2. Follow the **[Contributing Guide](development/contributing.md)**
3. Submit a pull request

## Getting Help

- Check **[Troubleshooting](reference/troubleshooting.md)** for common issues
- Search existing [GitHub Issues](https://github.com/yourusername/ad-mirror/issues)
- Open a new issue if you need help
- Join our community discussions

---

**Last Updated**: December 2025 | **Documentation Version**: 1.0.0

