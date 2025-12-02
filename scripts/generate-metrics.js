/**
 * Generate project metrics
 * Used for tracking code quality and complexity
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📈 Generating project metrics...\n');

const metrics = {
  timestamp: new Date().toISOString(),
  version: require('../package.json').version,
  totalLines: 0,
  totalFiles: 0,
  selectorRules: 0,
  testFiles: 0,
  coverage: 0
};

// Count lines of code
try {
  const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs wc -l', {
    encoding: 'utf-8'
  });
  const match = srcFiles.match(/\s+(\d+)\s+total/);
  if (match) {
    metrics.totalLines = parseInt(match[1]);
  }
} catch (error) {
  console.warn('Could not count lines of code');
}

// Count files
try {
  const fileCount = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', {
    encoding: 'utf-8'
  });
  metrics.totalFiles = parseInt(fileCount.trim());
} catch (error) {
  console.warn('Could not count files');
}

// Count selector rules
const configsDir = path.join(__dirname, '../src/content/configs');
const platforms = ['reddit', 'google', 'twitter', 'facebook'];

for (const platform of platforms) {
  const configPath = path.join(configsDir, `${platform}.json`);
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      metrics.selectorRules += (config.containerRules?.length || 0) + (config.fieldRules?.length || 0);
    } catch (error) {
      // Skip invalid configs
    }
  }
}

// Count test files
try {
  const testCount = execSync('find src -path "*/__tests__/*.test.ts" | wc -l', {
    encoding: 'utf-8'
  });
  metrics.testFiles = parseInt(testCount.trim());
} catch (error) {
  console.warn('Could not count test files');
}

// Display metrics
console.log('📊 Project Metrics');
console.log('─'.repeat(50));
console.log(`Version: ${metrics.version}`);
console.log(`Total Lines of Code: ${metrics.totalLines.toLocaleString()}`);
console.log(`Total Files: ${metrics.totalFiles}`);
console.log(`Selector Rules: ${metrics.selectorRules}`);
console.log(`Test Files: ${metrics.testFiles}`);
console.log(`Generated: ${metrics.timestamp}`);

// Save metrics
const metricsPath = path.join(__dirname, '../metrics.json');
fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

console.log('\n✅ Metrics saved to metrics.json');

