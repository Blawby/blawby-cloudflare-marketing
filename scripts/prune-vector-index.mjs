import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const CHUNKS_PATH = path.resolve(process.cwd(), 'lesson-chunks.json');
const VECTORIZE_API = 'https://api.cloudflare.com/client/v4/accounts';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const INDEX_NAME = process.env.VECTORIZE_INDEX_NAME || 'blawby';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env vars.');
  process.exit(1);
}

async function main() {
  // 1. Read current chunk IDs
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  const currentIds = new Set(chunks.map(c => c.id));
  console.log(`Loaded ${currentIds.size} current chunk IDs.`);

  // 2. List all vector IDs in the index
  let allVectorIds = [];
  let cursor = '';
  do {
    const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/indexes/${INDEX_NAME}/vectors?limit=1000${cursor ? `&cursor=${cursor}` : ''}`;
    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    if (!resp.ok) {
      console.error('Failed to list vectors:', await resp.text());
      process.exit(1);
    }
    const data = await resp.json();
    allVectorIds.push(...data.result.vectors.map(v => v.id));
    cursor = data.result?.cursor || '';
  } while (cursor);
  console.log(`Found ${allVectorIds.length} vectors in index.`);

  // 3. Find stale IDs
  const staleIds = allVectorIds.filter(id => !currentIds.has(id));
  if (staleIds.length === 0) {
    console.log('No stale vectors to delete. Index is clean!');
    return;
  }
  console.log(`Pruning ${staleIds.length} stale vectors...`);

  // 4. Delete stale vectors in batches
  const batchSize = 100;
  for (let i = 0; i < staleIds.length; i += batchSize) {
    const batch = staleIds.slice(i, i + batchSize);
    const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/indexes/${INDEX_NAME}/vectors/delete`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: batch }),
    });
    if (!resp.ok) {
      console.error('Failed to delete batch:', await resp.text());
    } else {
      console.log(`Deleted ${batch.length} vectors.`);
    }
  }
  console.log('Pruning complete.');
}

main().catch(err => {
  console.error('Error during pruning:', err);
  process.exit(1);
}); 