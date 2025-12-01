#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Ensure .data directory exists
const dataDir = path.join(__dirname, '.data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function crawlAndSaveLogs(city, state) {
  const url = `https://weathered-resonance-d595.paulchrisluke.workers.dev/crawl?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;

  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer qGqIoWhf8SetlDGJOfU1aoClcwRm5hICigiDm8Yr7bg=',
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          // Save the full response to .data folder
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `crawl-${city.toLowerCase()}-${state.toLowerCase()}-${timestamp}.json`;
          const filepath = path.join(dataDir, filename);

          fs.writeFileSync(filepath, JSON.stringify(response, null, 2));

          console.log(`✅ Crawl completed for ${city}, ${state}`);
          console.log(`📊 Results: ${response.results_found} lawyers found`);
          console.log(`📁 Logs saved to: ${filepath}`);

          if (response.logs) {
            console.log(`📋 Log data included in response`);
          }

          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Get city and state from command line arguments
const city = process.argv[2] || 'Miami';
const state = process.argv[3] || 'FL';

console.log(`Arguments:`, process.argv);
console.log(`City: "${city}", State: "${state}"`);

console.log(`🚀 Starting crawl for ${city}, ${state}...`);
crawlAndSaveLogs(city, state)
  .then(() => {
    console.log('✅ Done!');
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
