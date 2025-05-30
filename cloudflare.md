Here's your cleaned-up, **refactored** final implementation plan. I've:

* **Eliminated redundancy**
* **Merged the GitHub Action plan into the main flow**
* **Streamlined your sections** for clarity and dev-readiness

---

# 📘 Blawby: Cloudflare Vector Search Integration Plan

## 🎯 Goal

Enable vector-based semantic search for your Blawby documentation site, built with **Next.js and MDX**, deployed to **Cloudflare Pages**, and powered by:

* A **Cloudflare Worker** for search
* **Cloudflare Workers AI** for embeddings
* **Cloudflare Vectorize** for vector storage and similarity search
* **GitHub Actions** for automated indexing

---

## 🗂 Project Structure

```plaintext
/blawby
├── src/
│   └── data/
│       ├── lessons.ts
│       └── lessons/*.mdx
├── components/
│   └── CommandPalette.tsx  ← UI with search
├── scripts/
│   └── index-mdx-content.js  ← Indexer script
├── .github/
│   └── workflows/
│       └── index-content.yml ← GitHub Action
├── package.json
└── ...
```

---

## 1. 🧠 Search Worker Setup

### 🔹 Create the Worker

```bash
mkdir blawby-search-worker
cd blawby-search-worker
wrangler init
```

### 🔹 `wrangler.toml`

```toml
name = "blawby-search-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[vectorize]]
binding = "VECTORIZE"
index_name = "docs"

[[ai]]
binding = "AI"
```

### 🔹 `src/index.js`

```js
import { Ai } from "@cloudflare/ai";

export default {
  async fetch(request, env) {
    const { query } = await request.json();
    const ai = new Ai(env.AI);
    const vector = await ai.run("@cf/baai/bge-small-en-v1.5", { text: query });

    const results = await env.VECTORIZE.query({
      topK: 5,
      vector,
      namespace: "docs",
      returnMetadata: true,
    });

    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
```

```bash
wrangler deploy
```

---

## 2. 🔎 Frontend Integration (Command Palette)

* Extend your existing `CommandPalette.tsx` component to:

  * Call the Worker URL via `fetch()` with `{ query }`
  * Debounce user input
  * Display `title`, `url`, and `snippet` from the results

No new UI needed — keep it tight to the current UX.

---

## 3. 🔄 Indexing Script (Custom + Automated)

### 📄 `scripts/index-mdx-content.js`

Responsible for:

* Reading `.mdx` files
* Extracting frontmatter + text
* Chunking text
* Generating embeddings via Workers AI
* Uploading to Cloudflare Vectorize

👉 See [your script above](#) — already complete.

Install dependencies:

```bash
npm install gray-matter unified remark-parse unist-util-visit
```

---

## 4. 🚀 GitHub Action Automation

### 📄 `.github/workflows/index-content.yml`

```yaml
name: Index MDX Docs to Vectorize

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Nightly

jobs:
  index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install

      - name: Run Indexing Script
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: node scripts/index-mdx-content.js
```

🔐 Add `CLOUDFLARE_API_TOKEN` in GitHub > Settings > Secrets > Actions

---

## 5. 🧾 Cloudflare Setup

* Create your index:

  ```bash
  npx wrangler vectorize create docs --dimensions=384 --metric=cosine
  ```

* Use Workers AI embedding model:

  ```
  @cf/baai/bge-small-en-v1.5
  ```

---

## ✅ Final Checklist

| Item                          | Status |
| ----------------------------- | ------ |
| Worker created and deployed   | ✅      |
| Worker returns search results | ✅      |
| VECTORIZE binding configured  | ✅      |
| Search integrated into UI     | ✅      |
| Indexing script implemented   | ✅      |
| GitHub Action created         | ✅      |
| Vector index populated        | ✅      |
| Token set in GitHub secrets   | ✅      |
| Deployments via CLI confirmed | ✅      |

---

## 🔚 Summary Benefits

* **Full Cloudflare stack**: Pages + Workers + Vectorize + AI
* **Command palette UX**: No new components, seamless feel
* **Automated indexing**: CI/CD friendly, hands-off once live
* **Future-ready**: Easy to extend to interviews, notes, blog, etc.

---

## 🛡️ Implementation Review & Next Actions

### 1. Worker & API
- **Authentication:** Worker is currently public. For production, consider Cloudflare Firewall Rules, Turnstile, or token-based auth for admin endpoints.
- **CORS:** Change `Access-Control-Allow-Origin` to your production domain (e.g., `https://blawby-cloudflare-marketing.pages.dev`).
- **Error Handling:** Wrap embedding and query logic in `try/catch` and return structured error JSON (e.g., `{ error: "..." }`).

### 2. Embeddings & Vectorize
- **Model Choice:** Default is `@cf/baai/bge-small-en-v1.5`. Consider testing OpenAI or multilingual models if needed.
- **Chunking Strategy:** Improve by using heading-based segmentation, token overlap (~30 tokens), and a tokenizer for accurate chunking.
- **Metadata:** Store `section`, `timestamp` (for interviews), `type`, and normalize chunk text for better previews.

### 3. Indexing & Automation
- **Reindexing & Deletes:** Track indexed IDs and prune unused vectors, or wipe namespace on full reindex.
- **Manual Trigger:** Add CLI or admin Worker route for manual reindexing.
- **Index Consistency:** Use a local staging file to batch uploads and avoid partial state on failure.

### 4. Frontend Integration
- **Debounce & UX:** Use 300–400ms debounce, add loading spinner, and fallback text for no results.
- **Result Ranking:** Optionally filter by score threshold (e.g., `score > 0.8`).
- **Snippet Generation:** Highlight query terms and add position metadata for better context.

### 5. Security & Secrets
- **API Tokens:** Store `CLOUDFLARE_API_TOKEN` securely in GitHub Actions and local `.env`.
- **Environment Separation:** Use different vector namespaces for dev/prod (e.g., `docs` vs `docs-dev`).

### 6. Extensibility & Future Features
- **Content Flexibility:** Script structure supports adding interviews, `.vtt`, etc.
- **LLM / RAG Integration:** Store richer metadata (e.g., `context_id`) for future LLM prompts.
- **Admin Tools:** Consider CLI or `/admin/reindex` route (authenticated), and dashboard for monitoring.

### 7. Cost & Quotas
- **Cloudflare Free Tier:** 100,000 vectors/namespace (Free), limited Workers AI invocations. Monitor via Cloudflare dashboard.
- **Monitoring:** Optionally log embedding/vector operations for observability.

---

### ✅ Suggested Next Actions

| Task                              | Owner | Status |
| --------------------------------- | ----- | ------ |
| Restrict CORS in Worker           | You   | 🔜     |
| Add structured error handling     | You   | 🔜     |
| Evaluate chunking/token strategy  | You   | 🔜     |
| Add cleanup logic to index script | You   | 🔜     |
| Implement GitHub Action & secrets | You   | ✅      |
| Add RAG metadata fields           | You   | ⏳      |

---

Would you like help updating your indexing script for section/overlap logic, adding admin reindex support, or LLM answer endpoint? Let me know!

---

## 🐞 Cloudflare Vectorize Binding Bug: Debugging & Workaround

### Problem
- When using the Cloudflare Workers Vectorize binding, queries with a valid 384-dimension vector (from Workers AI) failed with:
  - `VECTOR_QUERY_ERROR (code = 40006): invalid query vector, expected 384 dimensions, and got 0 dimensions`
- Extensive logging confirmed the vector was a valid `number[384]` array.
- The same vector worked with the Vectorize REST API, but not with the Worker binding.

### Root Cause
- The Vectorize binding in Workers has a serialization bug: even a valid array is sometimes sent as an empty array to the Vectorize backend.
- This is likely due to how typed arrays or proxies from Workers AI are handled internally.

### Solution / Workaround
- **Do not use the Vectorize binding for queries.**
- Instead, call the Vectorize v2 REST API directly from your Worker using `fetch` and pass the vector as JSON.
- Example:
  ```ts
  const vector = JSON.parse(JSON.stringify(embedding.data[0]));
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/docs/query`;
  const body = { vector, topK: 5, namespace: 'docs', return_metadata: true };
  const apiRes = await fetch(url, { ... });
  ```
- This approach works reliably and is production-safe.

### Debugging Process
- Verified vector shape and type at every step.
- Confirmed REST API worked while binding did not.
- Used extensive logging and a minimal Node.js script to isolate the issue.

### Recommendation
- Use the REST API for all Vectorize operations in Workers until Cloudflare fixes the binding.
- Document this workaround for all future devs.

---

## 🟢 Production Indexing & Pruning Automation (2025)

- **Indexing script**: TypeScript, runs in CI/CD, reads all MDX, chunks by heading, embeds with Workers AI, upserts to Vectorize via REST API.
- **Pruning**: Uses a manifest file (`scripts/vector-manifest.json`) to track all upserted vector IDs. On each run, deletes any vectors not present in the current content set. This is required because Vectorize v2 REST API does not support listing all vectors.
- **GitHub Actions**: Workflow runs on push to `master` and nightly. If you see '0 workflow runs', check that your workflow triggers on the correct branch (e.g., `master` not `main`).
- **Secrets**: Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in repo secrets.
- **Best practice**: Always use REST API for Vectorize, not the binding. See below for the binding bug and workaround.

---
