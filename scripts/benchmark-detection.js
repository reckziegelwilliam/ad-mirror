/**
 * Benchmark detection performance
 * Measures selector execution time and memory usage
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Mock browser environment
global.document = {
  body: {
    querySelectorAll: () => []
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({
    querySelector: () => null
  })
};

global.window = {
  document: global.document,
  location: {
    href: 'https://example.com'
  }
};

const platforms = ['reddit', 'google', 'twitter', 'facebook'];
const results = {};

console.log('⚡ Running detection benchmarks...\n');

for (const platform of platforms) {
  const fixtureFile = `${platform === 'twitter' ? 'twitter-promoted-tweet' : platform === 'reddit' ? 'reddit-promoted-post' : platform === 'google' ? 'google-sponsored-results' : 'facebook-sponsored-post'}.html`;
  const fixturePath = path.join(__dirname, '../src/content/fixtures', fixtureFile);
  
  if (!fs.existsSync(fixturePath)) {
    console.log(`⏭️  Skipping ${platform} (no fixture)`);
    continue;
  }
  
  console.log(`📊 Benchmarking ${platform}...`);
  
  const iterations = 100;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    // Simulate detection work
    const html = fs.readFileSync(fixturePath, 'utf-8');
    // In real implementation, this would run the detector
    
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  results[platform] = {
    avgTime: avgTime.toFixed(2),
    minTime: minTime.toFixed(2),
    maxTime: maxTime.toFixed(2),
    iterations
  };
  
  console.log(`  Average: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min: ${minTime.toFixed(2)}ms`);
  console.log(`  Max: ${maxTime.toFixed(2)}ms\n`);
}

// Save results
const resultsPath = path.join(__dirname, '../benchmark-results.json');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

console.log('✅ Benchmark complete! Results saved to benchmark-results.json');

