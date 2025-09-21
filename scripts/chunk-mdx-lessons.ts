import crypto from "crypto";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const LESSONS_DIR = path.resolve(process.cwd(), "src/data/lessons");
const ARTICLES_DIR = path.resolve(process.cwd(), "src/data/articles");
const PAGES_DIR = path.resolve(process.cwd(), "src/data/pages");
const OUTPUT_PATH = path.resolve(process.cwd(), "lesson-chunks.json");
const MAX_CHUNK_TOKENS = 300; // Adjust as needed
const MAX_ID_BYTES = 64;

// Files to exclude from indexing
const EXCLUDED_FILES = ["privacy.mdx", "terms.mdx"];

// Recursively get all .mdx files in a directory
function getAllMdxFiles(dir: string): string[] {
  let results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }
  return results;
}

function splitParagraph(paragraph: string, maxTokens: number): string[] {
  // Naive tokenization: split by space, then join back up to maxTokens
  const words = paragraph.split(/\s+/);
  if (words.length <= maxTokens) return [paragraph];
  const chunks = [];
  for (let i = 0; i < words.length; i += maxTokens) {
    chunks.push(words.slice(i, i + maxTokens).join(" "));
  }
  return chunks;
}

function makeSafeId(file: string, section: string, idx: number): string {
  const base = path.basename(file, ".mdx");
  const raw = `${base}:${section}:${idx}`;
  // Use sha256 and hex, then slice to 64 bytes (128 hex chars, but we only need 64 bytes max)
  const hash = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex")
    .slice(0, 64);
  return hash;
}

function chunkMarkdownByParagraph(
  content: string,
  file: string,
  title: string,
  urlPrefix: string,
  docType: string,
): any[] {
  const tree = unified().use(remarkParse).parse(content);
  let section = "";
  let chunks: any[] = [];
  let paraBuffer: string[] = [];
  let chunkIdx = 0;
  let summaryAdded = false;
  // Find the first non-heading paragraph and always include it in the first chunk
  let firstParagraph = "";
  visit(tree, (node: any) => {
    if (!summaryAdded && node.type === "paragraph") {
      firstParagraph = node.children.map((c: any) => c.value || "").join(" ");
      summaryAdded = true;
    }
  });
  // Now walk again for normal chunking
  visit(tree, (node: any) => {
    if (node.type === "heading" && node.depth === 2) {
      // Flush previous section
      if (paraBuffer.length) {
        let paraText = paraBuffer.join("\n\n");
        // Prepend summary if this is the first chunk and summary not already in buffer
        if (
          chunks.length === 0 &&
          firstParagraph &&
          !paraText.includes(firstParagraph)
        ) {
          paraText = firstParagraph + "\n\n" + paraText;
        }
        splitParagraph(paraText, MAX_CHUNK_TOKENS).forEach((chunk) => {
          const id = makeSafeId(file, section || "intro", chunkIdx++);
          chunks.push({
            id,
            text: chunk,
            metadata: {
              title,
              file: path.basename(file),
              section,
              url: `${urlPrefix}/${path.basename(file, ".mdx")}`,
              docType,
            },
          });
        });
        paraBuffer = [];
      }
      section = node.children.map((c: any) => c.value).join(" ");
    } else if (node.type === "paragraph") {
      paraBuffer.push(node.children.map((c: any) => c.value || "").join(" "));
    }
  });
  // Flush last section
  if (paraBuffer.length) {
    let paraText = paraBuffer.join("\n\n");
    if (
      chunks.length === 0 &&
      firstParagraph &&
      !paraText.includes(firstParagraph)
    ) {
      paraText = firstParagraph + "\n\n" + paraText;
    }
    splitParagraph(paraText, MAX_CHUNK_TOKENS).forEach((chunk) => {
      const id = makeSafeId(file, section || "intro", chunkIdx++);
      chunks.push({
        id,
        text: chunk,
        metadata: {
          title,
          file: path.basename(file),
          section,
          url: `${urlPrefix}/${path.basename(file, ".mdx")}`,
          docType,
        },
      });
    });
  }
  return chunks;
}

function main() {
  let allChunks: any[] = [];

  // Process lessons
  const lessonFiles = getAllMdxFiles(LESSONS_DIR);
  for (const file of lessonFiles) {
    const filename = path.basename(file);
    if (EXCLUDED_FILES.includes(filename)) continue;

    const raw = fs.readFileSync(file, "utf8");
    const { data: frontmatter, content } = matter(raw);
    const title = frontmatter.title || path.basename(file, ".mdx");
    const chunks = chunkMarkdownByParagraph(
      content,
      file,
      title,
      "/lessons",
      "lesson",
    );
    allChunks.push(...chunks);
  }

  // Process articles (with category-based URLs)
  const articleFiles = getAllMdxFiles(ARTICLES_DIR);
  for (const file of articleFiles) {
    const filename = path.basename(file);
    if (EXCLUDED_FILES.includes(filename)) continue;

    const raw = fs.readFileSync(file, "utf8");
    const { data: frontmatter, content } = matter(raw);
    const title = frontmatter.title || path.basename(file, ".mdx");

    // Extract category from file path: src/data/articles/[category]/[file].mdx
    const relativePath = path.relative(ARTICLES_DIR, file);
    const pathParts = relativePath.split(path.sep);
    const category = pathParts[0]; // First directory is the category
    const urlPrefix = `/${category}`;

    const chunks = chunkMarkdownByParagraph(
      content,
      file,
      title,
      urlPrefix,
      "article",
    );
    allChunks.push(...chunks);
  }

  // Process standalone pages
  const pageFiles = getAllMdxFiles(PAGES_DIR);
  for (const file of pageFiles) {
    const filename = path.basename(file);
    if (EXCLUDED_FILES.includes(filename)) continue;

    const raw = fs.readFileSync(file, "utf8");
    const { data: frontmatter, content } = matter(raw);
    const title = frontmatter.title || path.basename(file, ".mdx");

    // Pages have direct URLs: /pricing, /help, etc.
    const urlPrefix = "";
    const chunks = chunkMarkdownByParagraph(
      content,
      file,
      title,
      urlPrefix,
      "page",
    );
    allChunks.push(...chunks);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2));
  console.log(`Wrote ${allChunks.length} chunks to ${OUTPUT_PATH}`);

  // Write vector-manifest.json for pruning
  const manifestPath = path.resolve(process.cwd(), "vector-manifest.json");
  const allIds = allChunks.map((chunk) => chunk.id);
  fs.writeFileSync(manifestPath, JSON.stringify(allIds, null, 2));
  console.log(`Wrote ${allIds.length} vector IDs to ${manifestPath}`);
}

main();
