#!/usr/bin/env node

/**
 * Compare current benchmark with baseline
 * Used to detect performance regressions
 */

const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, '../benchmark-results.json');
const baselinePath = path.join(__dirname, '../benchmark-baseline.json');

if (!fs.existsSync(resultsPath)) {
  console.error('❌ No benchmark results found. Run npm run benchmark first.');
  process.exit(1);
}

const current = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// Create baseline if it doesn't exist
if (!fs.existsSync(baselinePath)) {
  console.log('📝 Creating new benchmark baseline...');
  fs.writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log('✅ Baseline created!');
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

console.log('📊 Comparing with baseline...\n');

let hasRegressions = false;
const regressionThreshold = 1.2; // 20% slower is a regression

for (const platform in current) {
  if (!baseline[platform]) {
    console.log(`📈 ${platform}: NEW (avg: ${current[platform].avgTime}ms)`);
    continue;
  }
  
  const currentAvg = parseFloat(current[platform].avgTime);
  const baselineAvg = parseFloat(baseline[platform].avgTime);
  const ratio = currentAvg / baselineAvg;
  const percentChange = ((ratio - 1) * 100).toFixed(1);
  
  let icon = '✅';
  if (ratio > regressionThreshold) {
    icon = '❌';
    hasRegressions = true;
  } else if (ratio > 1.1) {
    icon = '⚠️';
  } else if (ratio < 0.9) {
    icon = '🚀';
  }
  
  console.log(`${icon} ${platform}: ${currentAvg.toFixed(2)}ms (${percentChange > 0 ? '+' : ''}${percentChange}%)`);
  console.log(`   Baseline: ${baselineAvg.toFixed(2)}ms | Current: ${currentAvg.toFixed(2)}ms`);
}

console.log('\n' + '='.repeat(50));

if (hasRegressions) {
  console.error('❌ Performance regressions detected!');
  console.error(`Threshold: ${((regressionThreshold - 1) * 100).toFixed(0)}% slower than baseline`);
  process.exit(1);
} else {
  console.log('✅ No performance regressions!');
  
  // Update baseline with current results
  fs.writeFileSync(baselinePath, JSON.stringify(current, null, 2));
  console.log('📝 Baseline updated.');
  process.exit(0);
}

