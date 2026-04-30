#!/usr/bin/env node

/**
 * upload-content-to-r2.mjs
 *
 * Uploads all MDX content files from src/data to an R2 bucket so that
 * Cloudflare AI Search can index them automatically.
 *
 * Frontmatter fields (title, description, keywords, summary, author, category)
 * are embedded as R2 custom metadata headers so AI Search has structured
 * signals for ranking — not just raw text chunks.
 *
 * Usage:
 *   node scripts/upload-content-to-r2.mjs <bucket-name>
 *   R2_CONTENT_BUCKET=my-bucket node scripts/upload-content-to-r2.mjs
 *   R2_CONTENT_BUCKET=my-bucket DRY_RUN=true node scripts/upload-content-to-r2.mjs
 *
 * Options (environment variables):
 *   R2_CONTENT_BUCKET  — bucket name (or pass as first CLI argument)
 *   DRY_RUN=true       — print what would be uploaded without doing it
 *   CONCURRENCY=10     — max parallel uploads (default: 10)
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(process.cwd(), "src/data");
const BUCKET = process.env.R2_CONTENT_BUCKET || process.argv[2];
const DRY_RUN = process.env.DRY_RUN === "true";

let parsedConcurrency = parseInt(process.env.CONCURRENCY || "10", 10);
if (isNaN(parsedConcurrency) || parsedConcurrency <= 0) {
  parsedConcurrency = 10;
}
const CONCURRENCY = Math.max(1, parsedConcurrency);

if (!BUCKET) {
  console.error(
    "Error: Missing bucket name.\n" +
      "Set R2_CONTENT_BUCKET in the environment or pass it as the first argument.\n\n" +
      "  R2_CONTENT_BUCKET=my-bucket node scripts/upload-content-to-r2.mjs",
  );
  process.exit(1);
}

if (DRY_RUN) {
  console.log("Dry run mode — no files will be uploaded.\n");
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Frontmatter parser
// Inlined here so the script has zero extra dependencies.
import yaml from "js-yaml";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function parseFrontmatter(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return {};
  try {
    return yaml.load(match[1]) || {};
  } catch (e) {
    console.error("YAML parse error:", e);
    return {};
  }
}

function normalizeKeywords(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim());
  return String(raw).split(",").map((v) => v.trim()).filter(Boolean);
}

function normalizeDate(raw) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  const [m, d, y] = s.split("/");
  if (m && d && y) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return s;
}

function fmToR2Meta(fm) {
  const m = {};
  if (fm.title)         m["title"]          = String(fm.title).slice(0, 256);
  const description = fm.desc || fm.description;
  if (description)      m["description"]    = String(description).slice(0, 512);
  if (fm.author)        m["author"]         = String(fm.author).slice(0, 128);
  if (fm.category)      m["category"]       = String(fm.category).slice(0, 64);
  
  const pubDate = normalizeDate(fm.createdAt || fm.datePublished);
  const modDate = normalizeDate(fm.updatedAt || fm.dateModified || fm.createdAt);
  
  if (pubDate) m["date-published"]  = pubDate;
  if (modDate) m["date-modified"]   = modDate;
  
  if (fm.summary)       m["summary"]        = String(fm.summary).slice(0, 1024);
  if (fm.difficulty)    m["difficulty"]     = String(fm.difficulty).slice(0, 32);
  if (fm.noindex)       m["noindex"]        = "true";
  if (fm.order !== undefined) m["order"]    = String(fm.order);
  if (fm.contentType)   m["content-type"]   = String(fm.contentType);
  
  const kw = normalizeKeywords(fm.keywords);
  const tags = normalizeKeywords(fm.tags);
  const allKeywords = Array.from(new Set([...kw, ...tags]));
  if (allKeywords.length) m["keywords"] = allKeywords.join(", ").slice(0, 512);

  if (fm.faq && Array.isArray(fm.faq)) {
    let faqToStore: any[] = [];
    for (const item of fm.faq) {
      const nextSlice = [...faqToStore, item];
      if (JSON.stringify(nextSlice).length <= 1024) {
        faqToStore = nextSlice;
      } else {
        break;
      }
    }
    if (faqToStore.length > 0) {
      m["faq"] = JSON.stringify(faqToStore);
    }
  }

  return m;
}

// ---------------------------------------------------------------------------
// R2 key derivation
//
// Preserves the folder prefix so files from different sections never collide.
// AI Search will use the full path as the source reference anyway.
//
// src/data/lessons/getting-started.mdx  → lessons/getting-started.mdx
// src/data/articles/pricing.mdx         → articles/pricing.mdx
// src/data/pages/about.mdx             → pages/about.mdx
// src/data/legal/privacy.mdx           → legal/privacy.mdx
// ---------------------------------------------------------------------------

function toR2Key(filePath) {
  return path.relative(DATA_DIR, filePath).replaceAll(path.sep, "/");
}

// ---------------------------------------------------------------------------
// Wrangler runner
// ---------------------------------------------------------------------------

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["exec", "wrangler", ...args], {
      stdio: "pipe", // capture output so parallel runs don't interleave
      env: process.env,
    });

    const stderr = [];
    child.stderr.on("data", (chunk) => stderr.push(chunk));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `wrangler exited with code ${code}\n${Buffer.concat(stderr).toString().trim()}`,
          ),
        );
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Upload with concurrency control
// ---------------------------------------------------------------------------

async function uploadFile(file) {
  const key = toR2Key(file);
  const objectPath = `${BUCKET}/${key}`;
  const relPath = path.relative(process.cwd(), file);

  // Parse frontmatter for structured metadata
  let metaFlags = [];
  try {
    const source = readFileSync(file, "utf-8");
    const fm = parseFrontmatter(source);
    const meta = fmToR2Meta(fm);
    for (const [k, v] of Object.entries(meta)) {
      // Wrangler custom metadata: --header "x-amz-meta-<key>: <value>"
      metaFlags.push("--header", `x-amz-meta-${k}: ${v}`);
    }
  } catch {
    // If parsing fails, upload without metadata
  }

  if (DRY_RUN) {
    const metaPreview = metaFlags.length
      ? ` [meta: ${metaFlags.filter((_, i) => i % 2 === 1).join(", ")}]`
      : "";
    console.log(`  [dry-run] ${relPath} → ${objectPath}${metaPreview}`);
    return { file, key, ok: true };
  }

  try {
    await runWrangler([
      "r2",
      "object",
      "put",
      objectPath,
      "--file",
      file,
      "--content-type",
      "text/plain; charset=utf-8",
      ...metaFlags,
    ]);
    console.log(`  ✓  ${relPath} → ${objectPath}`);
    return { file, key, ok: true };
  } catch (err) {
    console.error(`  ✗  ${relPath} — ${err.message}`);
    return { file, key, ok: false, error: err.message };
  }
}

async function uploadAll(files) {
  const results = [];

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(uploadFile));
    results.push(...batchResults);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const files = await walk(DATA_DIR);

  if (files.length === 0) {
    console.log("No MDX files found in", DATA_DIR);
    process.exit(0);
  }

  console.log(`Found ${files.length} MDX file(s) in ${DATA_DIR}`);
  console.log(
    `Uploading to R2 bucket: ${BUCKET} (concurrency: ${CONCURRENCY})\n`,
  );

  const results = await uploadAll(files);

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log(
    `\n${DRY_RUN ? "Would upload" : "Uploaded"} ${succeeded.length}/${files.length} file(s).`,
  );

  if (failed.length > 0) {
    console.error(`\n${failed.length} upload(s) failed:`);
    for (const { file, error } of failed) {
      console.error(`  - ${path.relative(process.cwd(), file)}: ${error}`);
    }
    process.exit(1);
  }
}

process.on("unhandledRejection", (err) => {
  console.error("Fatal (unhandledRejection):", err);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("Fatal (uncaughtException):", err);
  process.exit(1);
});

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
