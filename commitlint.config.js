module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI/CD
        'chore',    // Maintenance
        'revert',   // Revert commit
        'config',   // Config changes (selectors)
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'detector',
        'configs',
        'validators',
        'metrics',
        'ui',
        'popup',
        'options',
        'background',
        'content',
        'reddit',
        'google',
        'twitter',
        'facebook',
        'ci',
        'deps',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'header-max-length': [2, 'always', 100],
  },
};

