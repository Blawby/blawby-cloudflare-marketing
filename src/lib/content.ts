import { parseFrontmatter, type Frontmatter } from "@/utils/frontmatter";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");

export type ContentItem = Frontmatter & {
  slug: string;
  category: string;
  origin: string;
  folder: string;
  href: string;
};

let _cache: ContentItem[] | null = null;

/**
 * Scans src/data/lessons and src/data/articles recursively to build
 * the content registry at build-time. Memoized for performance.
 */
export async function getAllContent(): Promise<ContentItem[]> {
  const isDev = process.env.NODE_ENV === "development";
  if (_cache && !isDev) return _cache;

  const baseDirs = ["lessons", "articles"];
  const items: ContentItem[] = [];

  for (const baseDir of baseDirs) {
    const fullBaseDir = path.join(DATA_DIR, baseDir);
    if (!fs.existsSync(fullBaseDir)) continue;

    const files = getFilesRecursively(fullBaseDir);

    for (const file of files) {
      if (!file.endsWith(".mdx")) continue;
      if (path.basename(file).startsWith("_")) continue; // skip templates

      const raw = fs.readFileSync(file, "utf-8");
      const fm = parseFrontmatter(raw);

      const slug = path.basename(file, ".mdx");

      // Category derivation:
      // 1. Explicitly set in frontmatter (highest priority)
      // 2. Folder name (for articles/category/slug.mdx)
      // 3. Fallback to baseDir name (e.g., 'lessons')
      let category = fm.category;
      if (!category) {
        const relative = path.relative(fullBaseDir, file);
        const parts = relative.split(path.sep);
        category = parts.length > 1 ? parts[0] : baseDir;
      }

      const relativePath = path.relative(fullBaseDir, file);
      const folder = path.dirname(relativePath);

      items.push({
        ...fm,
        slug,
        origin: baseDir,
        folder: folder === "." ? baseDir : folder,
        category: category!,
        href: `/${category}/${slug}`,
      });
    }
  }

  if (items.length === 0) {
    console.warn(`[Content Layer] No content found in: ${DATA_DIR}`);
  }

  // Sort by order (lower first), then title
  _cache = items.sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.title || "").localeCompare(b.title || "");
  });

  return _cache;
}

/** Helper to find a specific piece of content by slug */
export async function getContent(slug: string): Promise<ContentItem | null> {
  const all = await getAllContent();
  return all.find((item) => item.slug === slug) || null;
}

/** Helper to find all content within a specific category */
export async function getContentByCategory(category: string): Promise<ContentItem[]> {
  const all = await getAllContent();
  return all.filter((item) => item.category === category);
}

function getFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const res = path.join(dir, entry.name);
    return entry.isDirectory() ? getFilesRecursively(res) : res;
  });
  return files;
}
