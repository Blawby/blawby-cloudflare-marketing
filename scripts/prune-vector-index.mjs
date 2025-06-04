import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const CHUNKS_PATH = path.resolve(process.cwd(), 'lesson-chunks.json');
const VECTORIZE_API = 'https://api.cloudflare.com/client/v4/accounts';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const INDEX_NAME = process.env.VECTORIZE_INDEX_NAME || 'docs';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env vars.');
  process.exit(1);
}

async function main() {
  // 1. Read current chunk IDs
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  const currentIds = new Set(chunks.map(c => c.id));
  console.log(`Loaded ${currentIds.size} current chunk IDs.`);

  // 2. List all vector IDs in the index using v2 endpoint
  let allVectorIds = [];
  let cursor = '';
  do {
    const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/get_by_ids`;
    // The v2 API does not support listing all IDs directly, so we must use a workaround if available.
    // If you have a manifest of all upserted IDs, use that. Otherwise, this step may need to be manual.
    // For demonstration, we'll assume you have a manifest file 'vector-manifest.json' with all IDs.
    const manifestPath = path.resolve(process.cwd(), 'vector-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error('vector-manifest.json not found. Please provide a manifest of all upserted vector IDs.');
      process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    allVectorIds = manifest;
    break;
  } while (cursor);
  console.log(`Found ${allVectorIds.length} vectors in manifest.`);

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