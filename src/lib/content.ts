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
 * Scans src/data/lessons, src/data/articles, and src/data/docs recursively to build
 * the content registry at build-time. Memoized for performance.
 */
export async function getAllContent(): Promise<ContentItem[]> {
  const isDev = process.env.NODE_ENV === "development";
  if (_cache && !isDev) return _cache;

  const baseDirs = ["lessons", "solutions", "docs", "articles"];
  const items: ContentItem[] = [];
  const seenHrefs = new Set<string>();

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

      // Strict required fields
      if (!fm.title)
        throw new Error(`Missing title in frontmatter for ${file}`);
      if (!fm.desc && !fm.description)
        throw new Error(`Missing description in frontmatter for ${file}`);
      if (!fm.category)
        throw new Error(`Missing category in frontmatter for ${file}`);

      const relativePath = path.relative(fullBaseDir, file);
      const folder = path.dirname(relativePath);

      const href = `/${fm.category.toLowerCase()}/${slug}`;
      if (seenHrefs.has(href)) {
        throw new Error(`Duplicate routing detected: ${href} (found in ${file})`);
      }
      seenHrefs.add(href);

      items.push({
        ...fm,
        slug,
        origin: baseDir,
        folder: folder === "." ? baseDir : folder,
        category: fm.category,
        href,
        author: fm.author || "Team Blawby",
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

/** Helper to find a specific piece of content by slug and optional category */
export async function getContent(
  slug: string,
  category?: string,
): Promise<ContentItem | null> {
  const all = await getAllContent();

  if (category) {
    return (
      all.find(
        (item) =>
          item.slug === slug &&
          item.category.toLowerCase() === category.toLowerCase(),
      ) || null
    );
  }

  return all.find((item) => item.slug === slug) || null;
}

/** Helper to find all content within a specific category */
export async function getContentByCategory(
  category: string,
): Promise<ContentItem[]> {
  const all = await getAllContent();
  return all.filter(
    (item) => item.category.toLowerCase() === category.toLowerCase(),
  );
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
