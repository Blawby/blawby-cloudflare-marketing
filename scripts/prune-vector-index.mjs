import "dotenv/config";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const CHUNKS_PATH = path.resolve(process.cwd(), "lesson-chunks.json");
const MANIFEST_PATH = path.resolve(process.cwd(), "vector-manifest.json");
const VECTORIZE_API = "https://api.cloudflare.com/client/v4/accounts";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const INDEX_NAME = process.env.VECTORIZE_INDEX_NAME || "documentation";

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error(
    "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env vars.",
  );
  process.exit(1);
}

async function main() {
  // 1. Read current chunk IDs
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf-8"));
  const currentIds = new Set(chunks.map((c) => c.id));
  console.log(`Loaded ${currentIds.size} current chunk IDs.`);

  // 2. Read all previously upserted vector IDs from manifest
  let allVectorIds = [];
  if (fs.existsSync(MANIFEST_PATH)) {
    allVectorIds = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  console.log(`Loaded ${allVectorIds.length} vector IDs from manifest.`);

  // 3. Find stale IDs
  const staleIds = allVectorIds.filter((id) => !currentIds.has(id));
  if (staleIds.length === 0) {
    console.log("No stale vectors to delete. Index is clean!");
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
    console.log("Deleting batch:", url, batch);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: batch }),
    });
    if (!resp.ok) {
      console.error("Failed to delete batch:", await resp.text());
    } else {
      const data = await resp.json();
      console.log(
        `Deleted ${batch.length} vectors. Mutation ID: ${data.result?.mutationId}`,
      );
    }
  }
  console.log("Pruning complete.");
}

main().catch((err) => {
  console.error("Error during pruning:", err);
  process.exit(1);
});
