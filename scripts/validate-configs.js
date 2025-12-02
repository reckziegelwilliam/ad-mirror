/**
 * Validate all platform selector configs
 * Used in CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');

// Import validator
const { validateConfig, formatValidationResults } = require('../src/content/engine/configValidator');

const configsDir = path.join(__dirname, '../src/content/configs');
const platforms = ['reddit', 'google', 'twitter', 'facebook'];

let hasErrors = false;
const results = [];

console.log('🔍 Validating platform configurations...\n');

for (const platform of platforms) {
  const configPath = path.join(configsDir, `${platform}.json`);
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${platform}.json`);
    hasErrors = true;
    continue;
  }
  
  try {
    const configJson = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configJson);
    
    // Mock document for selector validation
    global.document = {
      createElement: () => ({
        querySelector: () => null
      })
    };
    
    const validation = validateConfig(config);
    const formatted = formatValidationResults(validation);
    
    console.log(`\n📋 ${platform.toUpperCase()}`);
    console.log('─'.repeat(50));
    console.log(formatted);
    
    results.push({
      platform,
      valid: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    });
    
    if (!validation.valid) {
      hasErrors = true;
    }
    
  } catch (error) {
    console.error(`❌ Error validating ${platform}:`, error.message);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY');
console.log('='.repeat(50));

for (const result of results) {
  const status = result.valid ? '✅' : '❌';
  console.log(`${status} ${result.platform}: ${result.errorCount} errors, ${result.warningCount} warnings`);
}

if (hasErrors) {
  console.error('\n❌ Validation failed. Please fix the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ All configurations valid!');
  process.exit(0);
}

