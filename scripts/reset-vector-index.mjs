import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const CHUNKS_PATH = path.resolve(process.cwd(), "lesson-chunks.json");
const VECTORIZE_API = "https://api.cloudflare.com/client/v4/accounts";
const VECTORIZE_VERSION = "v2";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const INDEX_NAME = process.env.VECTORIZE_INDEX_NAME || "documentation";

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error(
    "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env vars.",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};

async function deleteIndex() {
  const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/${VECTORIZE_VERSION}/indexes/${INDEX_NAME}`;
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok && res.status !== 404) {
    throw new Error(
      `Failed to delete index: ${res.status} ${await res.text()}`,
    );
  }
  console.log("Index deleted (or did not exist).");
}

async function createIndex() {
  const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/${VECTORIZE_VERSION}/indexes`;
  const body = JSON.stringify({
    name: INDEX_NAME,
    description: "Documentation index for Blawby",
    config: {
      dimensions: 384, // bge-small-en-v1.5 is 384 dims
      metric: "cosine",
    },
  });
  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) {
    throw new Error(
      `Failed to create index: ${res.status} ${await res.text()}`,
    );
  }
  console.log("Index created.");
}

async function upsertChunks() {
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf8"));
  if (!Array.isArray(chunks))
    throw new Error("lesson-chunks.json is not an array");
  // Upsert in batches of 50
  for (let i = 0; i < chunks.length; i += 50) {
    const batch = chunks.slice(i, i + 50);
    const url = `${VECTORIZE_API}/${ACCOUNT_ID}/vectorize/${VECTORIZE_VERSION}/indexes/${INDEX_NAME}/upsert`;
    const vectors = batch.map((chunk) => ({
      id: chunk.id,
      values: chunk.values || [], // You may need to embed if not present
      metadata: chunk.metadata || {},
    }));
    // If values are missing, skip (should be embedded before this step)
    if (vectors.some((v) => !v.values.length)) {
      throw new Error(
        "Some chunks are missing embedding values. Run embedding first.",
      );
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ vectors }),
    });
    if (!res.ok) {
      throw new Error(`Upsert failed: ${res.status} ${await res.text()}`);
    }
    console.log(`Upserted batch ${i / 50 + 1}`);
  }
  console.log("All chunks upserted.");
}

(async () => {
  try {
    await deleteIndex();
    await createIndex();
    await upsertChunks();
    console.log("Vectorize index reset and upserted.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
