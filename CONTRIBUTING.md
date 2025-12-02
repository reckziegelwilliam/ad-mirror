# Contributing to Ad Mirror

Thank you for your interest in contributing! This guide provides quick guidelines - see the **[full Contributing Guide](docs/development/contributing.md)** for complete details.

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/ad-mirror.git
cd ad-mirror

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
```

## Ways to Contribute

### 1. Report Bugs

**Before submitting**:
- Check existing issues
- Try latest version
- Reproduce consistently

**Include**:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors

[Create Bug Report →](https://github.com/yourusername/ad-mirror/issues/new)

### 2. Update Selector Configs

**Most valuable contribution!**

When platforms update their HTML, selectors break:

```bash
# 1. Enable debug mode in extension
# 2. Identify the issue
# 3. Edit config file
vim src/content/configs/reddit.json

# 4. Validate
npm run validate:configs

# 5. Test
npm run build
# Reload extension and verify

# 6. Commit
git commit -m "config(reddit): update promoted post selector"
```

See: **[Configuration Reference](docs/reference/configuration.md)**

### 3. Add New Platforms

Want to add support for a new website?

See: **[Adding Platforms Guide](docs/development/adding-platforms.md)**

### 4. Improve Documentation

Documentation improvements welcome:
- Fix typos
- Clarify confusing sections
- Add examples
- Update outdated information

## Code Standards

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

Examples:
- feat(detector): add context-aware extraction
- fix(reddit): correct advertiser selector
- config(twitter): add negative filters
- docs(setup): update installation steps
- test(validator): add edge cases
```

**Types**: feat, fix, config, docs, test, refactor, perf, chore

### Code Style

- TypeScript with strict typing
- ESLint + Prettier (auto-configured)
- Test new features
- Document complex functions

```bash
# Check style
npm run lint
npm run format:check

# Auto-fix
npm run lint:fix
npm run format
```

## Pull Request Process

1. **Create feature branch**:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes and test**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Commit with conventional format**:
   ```bash
   git commit -m "feat(scope): description"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feat/my-feature
   ```

5. **Fill out PR template** completely

6. **Wait for review** (typically 3-7 days)

### PR Checklist

- [ ] Tests passing
- [ ] No linter errors
- [ ] Types check
- [ ] Config validated (if changed)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Maintain 80%+ coverage.

## Development Resources

- **[Development Setup](docs/development/setup.md)** - Complete setup guide
- **[Testing Guide](docs/development/testing.md)** - Writing and running tests
- **[Architecture](docs/getting-started/architecture.md)** - How Ad Mirror works
- **[Full Contributing Guide](docs/development/contributing.md)** - Detailed guidelines

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/yourusername/ad-mirror/discussions)
- **Bugs**: [Issue Tracker](https://github.com/yourusername/ad-mirror/issues)
- **Documentation**: [docs/](docs/)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Welcome newcomers
- Keep discussions on-topic

## Recognition

Contributors are recognized in:
- Git commit history
- GitHub contributors page
- Release notes
- CONTRIBUTORS.md (for significant contributions)

---

Thank you for contributing to Ad Mirror! 🎉

For complete guidelines, see **[Full Contributing Guide](docs/development/contributing.md)**

