import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const CHUNKS_PATH = path.resolve(process.cwd(), 'lesson-chunks.json');
const VECTORIZE_API = 'https://api.cloudflare.com/client/v4/accounts';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const INDEX_NAME = process.env.VECTORIZE_INDEX_NAME || 'documentation';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env vars.');
  process.exit(1);
}

async function main() {
  // 1. Read current chunk IDs
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  const currentIds = new Set(chunks.map(c => c.id));
  console.log(`Loaded ${currentIds.size} current chunk IDs.`);

  // 2. Enumerate all vector IDs in the index using v2 API
  let allVectorIds = [];
  let cursor = '';
  let total = 0;
  do {
    const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/list?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) {
      console.error('Failed to list vectors:', await resp.text());
      process.exit(1);
    }
    const data = await resp.json();
    const ids = (data.result?.vectors || []).map(v => v.id);
    allVectorIds.push(...ids);
    total += ids.length;
    cursor = data.result?.cursor || '';
    if (!cursor) break;
  } while (true);
  console.log(`Enumerated ${total} vectors in index.`);

  // 3. Find stale IDs
  const staleIds = allVectorIds.filter(id => !currentIds.has(id));
  if (staleIds.length === 0) {
    console.log('No stale vectors to delete. Index is clean!');
    return;
  }
  console.log(`Pruning ${staleIds.length} stale vectors...`);
  await deleteVectors(staleIds);
}

async function deleteVectors(staleIds) {
  const batchSize = 100;
  for (let i = 0; i < staleIds.length; i += batchSize) {
    const batch = staleIds.slice(i, i + batchSize);
    const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/delete_by_ids`;
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
      const data = await resp.json();
      console.log(`Deleted ${batch.length} vectors. Mutation ID: ${data.result?.mutationId}`);
    }
  }
  console.log('Pruning complete.');
}

main().catch(err => {
  console.error('Error during pruning:', err);
  process.exit(1);
}); 