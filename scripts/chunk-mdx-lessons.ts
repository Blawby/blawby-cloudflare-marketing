import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import crypto from 'crypto';

const LESSONS_DIR = path.resolve(process.cwd(), 'src/data/lessons');
const OUTPUT_PATH = path.resolve(process.cwd(), 'lesson-chunks.json');
const MAX_CHUNK_TOKENS = 300; // Adjust as needed
const MAX_ID_BYTES = 64;

function getAllMdxFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => path.join(dir, f));
}

function splitParagraph(paragraph: string, maxTokens: number): string[] {
  // Naive tokenization: split by space, then join back up to maxTokens
  const words = paragraph.split(/\s+/);
  if (words.length <= maxTokens) return [paragraph];
  const chunks = [];
  for (let i = 0; i < words.length; i += maxTokens) {
    chunks.push(words.slice(i, i + maxTokens).join(' '));
  }
  return chunks;
}

function makeSafeId(file: string, section: string, idx: number): string {
  const base = path.basename(file, '.mdx');
  const raw = `${base}:${section}:${idx}`;
  // Use sha256 and hex, then slice to 64 bytes (128 hex chars, but we only need 64 bytes max)
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 64);
  return hash;
}

function chunkMarkdownByParagraph(content: string, file: string, title: string): any[] {
  const tree = unified().use(remarkParse).parse(content);
  let section = '';
  let chunks: any[] = [];
  let paraBuffer: string[] = [];
  let chunkIdx = 0;
  visit(tree, (node: any) => {
    if (node.type === 'heading' && node.depth === 2) {
      // Flush previous section
      if (paraBuffer.length) {
        const paraText = paraBuffer.join('\n\n');
        splitParagraph(paraText, MAX_CHUNK_TOKENS).forEach((chunk) => {
          const id = makeSafeId(file, section || 'intro', chunkIdx++);
          chunks.push({
            id,
            text: chunk,
            metadata: { title, file: path.basename(file), section, url: `/lessons/${path.basename(file, '.mdx')}` }
          });
        });
        paraBuffer = [];
      }
      section = node.children.map((c: any) => c.value).join(' ');
    } else if (node.type === 'paragraph') {
      paraBuffer.push(node.children.map((c: any) => c.value || '').join(' '));
    }
  });
  // Flush last section
  if (paraBuffer.length) {
    const paraText = paraBuffer.join('\n\n');
    splitParagraph(paraText, MAX_CHUNK_TOKENS).forEach((chunk) => {
      const id = makeSafeId(file, section || 'intro', chunkIdx++);
      chunks.push({
        id,
        text: chunk,
        metadata: { title, file: path.basename(file), section, url: `/lessons/${path.basename(file, '.mdx')}` }
      });
    });
  }
  return chunks;
}

function main() {
  const files = getAllMdxFiles(LESSONS_DIR);
  let allChunks: any[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data: frontmatter, content } = matter(raw);
    const title = frontmatter.title || path.basename(file, '.mdx');
    const chunks = chunkMarkdownByParagraph(content, file, title);
    allChunks.push(...chunks);
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2));
  console.log(`Wrote ${allChunks.length} chunks to ${OUTPUT_PATH}`);
}

main(); 