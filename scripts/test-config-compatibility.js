/**
 * Test config compatibility across versions
 * Ensures configs maintain backward compatibility
 */

const fs = require('fs');
const path = require('path');

const configsDir = path.join(__dirname, '../src/content/configs');
const platforms = ['reddit', 'google', 'twitter', 'facebook'];

console.log('🔄 Testing config compatibility...\n');

let hasIssues = false;

for (const platform of platforms) {
  const configPath = path.join(configsDir, `${platform}.json`);
  
  if (!fs.existsSync(configPath)) continue;
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    console.log(`\n📋 ${platform.toUpperCase()}`);
    console.log('─'.repeat(50));
    
    // Check required fields
    const requiredFields = ['platform', 'version', 'hostnames', 'containerRules', 'fieldRules', 'validators', 'minConfidence'];
    const missing = requiredFields.filter(field => !config[field]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required fields: ${missing.join(', ')}`);
      hasIssues = true;
    } else {
      console.log(`✅ All required fields present`);
    }
    
    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(config.version)) {
      console.error(`❌ Invalid version format: ${config.version}`);
      hasIssues = true;
    } else {
      console.log(`✅ Version: ${config.version}`);
    }
    
    // Check container rules
    const containerRuleIds = new Set();
    for (const rule of config.containerRules) {
      if (containerRuleIds.has(rule.id)) {
        console.error(`❌ Duplicate container rule ID: ${rule.id}`);
        hasIssues = true;
      }
      containerRuleIds.add(rule.id);
    }
    console.log(`✅ ${config.containerRules.length} container rules (no duplicates)`);
    
    // Check field rules
    const fieldRuleIds = new Set();
    for (const rule of config.fieldRules) {
      if (fieldRuleIds.has(rule.id)) {
        console.error(`❌ Duplicate field rule ID: ${rule.id}`);
        hasIssues = true;
      }
      fieldRuleIds.add(rule.id);
    }
    console.log(`✅ ${config.fieldRules.length} field rules (no duplicates)`);
    
    // Check critical field coverage
    const extractedFields = new Set(config.fieldRules.map(r => r.field));
    const criticalFields = ['advertiser', 'destinationUrl', 'label'];
    const missingCritical = criticalFields.filter(f => !extractedFields.has(f));
    
    if (missingCritical.length > 0) {
      console.warn(`⚠️  Missing extractors for critical fields: ${missingCritical.join(', ')}`);
    } else {
      console.log(`✅ All critical fields covered`);
    }
    
  } catch (error) {
    console.error(`❌ Error reading ${platform} config:`, error.message);
    hasIssues = true;
  }
}

console.log('\n' + '='.repeat(50));

if (hasIssues) {
  console.error('❌ Compatibility issues found!');
  process.exit(1);
} else {
  console.log('✅ All configs compatible!');
  process.exit(0);
}

