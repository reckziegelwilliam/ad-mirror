#!/usr/bin/env node

/**
 * Validate a single config file
 * Used by lint-staged for pre-commit hooks
 */

const fs = require('fs');
const path = require('path');

const configFile = process.argv[2];

if (!configFile) {
  console.error('Usage: validate-single-config.js <config-file>');
  process.exit(1);
}

try {
  const configJson = fs.readFileSync(configFile, 'utf-8');
  const config = JSON.parse(configJson);
  
  // Basic validation
  const required = ['platform', 'version', 'hostnames', 'containerRules', 'fieldRules'];
  const missing = required.filter(field => !config[field]);
  
  if (missing.length > 0) {
    console.error(`❌ ${path.basename(configFile)}: Missing required fields: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Check for duplicate rule IDs
  const containerIds = new Set();
  for (const rule of config.containerRules) {
    if (containerIds.has(rule.id)) {
      console.error(`❌ ${path.basename(configFile)}: Duplicate container rule ID: ${rule.id}`);
      process.exit(1);
    }
    containerIds.add(rule.id);
  }
  
  const fieldIds = new Set();
  for (const rule of config.fieldRules) {
    if (fieldIds.has(rule.id)) {
      console.error(`❌ ${path.basename(configFile)}: Duplicate field rule ID: ${rule.id}`);
      process.exit(1);
    }
    fieldIds.add(rule.id);
  }
  
  console.log(`✅ ${path.basename(configFile)} is valid`);
  process.exit(0);
  
} catch (error) {
  console.error(`❌ ${path.basename(configFile)}: ${error.message}`);
  process.exit(1);
}

