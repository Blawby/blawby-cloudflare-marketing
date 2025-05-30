// scripts/index-content.ts

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';
import { remark } from 'remark';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const LESSONS_DIR = path.resolve(process.cwd(), 'src/data/lessons');
const INTERVIEWS_DIR = path.resolve(process.cwd(), 'src/data/interviews');
const VECTORIZE_INDEX = 'docs';
const VECTORIZE_NAMESPACE = 'docs';
const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5';
const BATCH_SIZE = 20;

// --- Env ---
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  throw new Error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in env');
}

// --- Manifest ---
const MANIFEST_PATH = path.resolve(process.cwd(), 'scripts/vector-manifest.json');

function readManifest(): Set<string> {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const data = fs.readFileSync(MANIFEST_PATH, 'utf8');
      return new Set(JSON.parse(data));
    } catch (e) {
      console.warn('Failed to read manifest, starting fresh:', e);
      return new Set();
    }
  }
  return new Set();
}

function writeManifest(ids: string[]) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(ids, null, 2));
}

// --- Main ---
async function main() {
  // 1. Read all MDX and VTT files
  const mdxFiles: string[] = [];
  const vttFiles: string[] = [];

  function walkDir(dir: string, ext: string, out: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, ext, out);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        out.push(fullPath);
      }
    }
  }

  walkDir(LESSONS_DIR, '.mdx', mdxFiles);
  walkDir(INTERVIEWS_DIR, '.vtt', vttFiles);

  // Print summary
  console.log(`Found ${mdxFiles.length} MDX files:`);
  mdxFiles.forEach(f => console.log('  -', f));
  console.log(`\nFound ${vttFiles.length} VTT files:`);
  vttFiles.forEach(f => console.log('  -', f));

  // 2. Extract and chunk text
  // For MDX, extract frontmatter, headings, and chunk content
  type MdxChunk = {
    file: string;
    title: string;
    section: string;
    text: string;
  };
  const mdxChunks: MdxChunk[] = [];
  for (const file of mdxFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data: frontmatter, content } = matter(raw);
    let title = frontmatter.title || path.basename(file, '.mdx');
    // Use remark to parse and chunk by heading
    const tree = remark().parse(content);
    let currentSection = '';
    let currentText = '';
    visit(tree, (node: any) => {
      if (node.type === 'heading') {
        if (currentText.trim()) {
          mdxChunks.push({ file, title, section: currentSection, text: currentText.trim() });
        }
        currentSection = node.children.map((c: any) => c.value).join(' ');
        currentText = '';
      } else if (node.type === 'paragraph' || node.type === 'list') {
        currentText += remark().stringify(node) + '\n';
      }
    });
    if (currentText.trim()) {
      mdxChunks.push({ file, title, section: currentSection, text: currentText.trim() });
    }
  }
  // Print summary of chunks
  console.log(`\nMDX Chunks:`);
  mdxChunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}: [${chunk.title}] [${chunk.section}] (${chunk.text.length} chars)`);
  });

  // 3. Generate embeddings for each chunk
  const limit = pLimit(5); // up to 5 concurrent requests
  async function embedText(text: string): Promise<number[]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/baai/bge-small-en-v1.5`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json() as any;
    if (!res.ok || !data.result || !data.result.data) {
      console.error('Embedding API error:', { status: res.status, statusText: res.statusText, body: data });
      throw new Error(`Embedding failed: ${res.status} ${JSON.stringify(data)}`);
    }
    return data.result.data[0]; // [384]
  }

  const embeddedChunks = await Promise.all(
    mdxChunks.map(chunk =>
      limit(async () => {
        try {
          const vector = await embedText(chunk.text);
          console.log(`Embedded chunk: [${chunk.title}] [${chunk.section}] -> vector[${vector.length}]`);
          return { ...chunk, vector };
        } catch (err) {
          console.error('Embedding error:', err, chunk);
          return null;
        }
      })
    )
  );
  // Filter out failed embeddings
  const validChunks = (embeddedChunks.filter(Boolean) as Array<NonNullable<typeof embeddedChunks[0]>>);

  // 4. Upsert to Vectorize
  async function upsertChunks(chunks: typeof validChunks) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${VECTORIZE_INDEX}/upsert`; 
    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = batch.map((chunk: any) => ({
        id: `${chunk.title}:${chunk.section}`.replace(/\s+/g, '-').toLowerCase(),
        values: chunk.vector,
        metadata: {
          title: chunk.title,
          section: chunk.section,
          file: chunk.file,
          type: 'lesson',
          content: chunk.text.slice(0, 500), // preview
        },
        namespace: VECTORIZE_NAMESPACE,
      }));
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vectors }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upsert error:', errorText);
        // Log headers and body for debugging
        const headers = res.headers;
        const body = JSON.stringify({ vectors });
        console.error('Upsert request headers:', headers);
        console.error('Upsert request body:', body);
      } else {
        console.log(`Upserted batch ${i / batchSize + 1}: ${vectors.length} vectors`);
      }
    }
  }
  await upsertChunks(validChunks);

  // 5. Prune deleted content
  async function deleteVectors(ids: string[]) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${VECTORIZE_INDEX}/delete`;
    const batchSize = 100;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: batch }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete error:', errorText);
      } else {
        console.log(`Deleted batch ${i / batchSize + 1}: ${batch.length} vectors`);
      }
    }
  }

  // Prune logic using manifest
  const currentIds = validChunks.map(chunk => `${chunk.title}:${chunk.section}`.replace(/\s+/g, '-').toLowerCase());
  const prevIds = readManifest();
  const toDelete = Array.from(prevIds).filter(id => !currentIds.includes(id));
  if (toDelete.length) {
    console.log(`Pruning ${toDelete.length} deleted vectors...`);
    await deleteVectors(toDelete);
  } else {
    console.log('No vectors to prune.');
  }
  writeManifest(currentIds);
}

main().catch((err) => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
