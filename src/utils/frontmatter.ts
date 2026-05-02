import { siteConfig } from "@/config/site";
import yaml from "js-yaml";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Single source of truth for MDX frontmatter metadata.
 * These fields power SEO, JSON-LD, and AI Search indexing.
 */
export type Frontmatter = {
  // Core fields
  title?: string;
  description?: string; // used as fallback for desc
  category?: string;
  order?: number;
  contentType?: "lesson" | "article" | "guide" | "reference";
  noindex?: boolean;
  summary?: string;
  video?: {
    url: string;
    duration: number;
    thumbnail: string;
    hd?: string;
  } | null;

  // SEO & Social
  // metaTitle removed: SEO title now always derived from title
  /** Primary meta description — overrides summary and description */
  desc?: string;
  /** OpenGraph/Twitter image URL */
  image?: string;
  /** Alt text for the OG image */
  alt?: string;

  // Structured Data & Logic
  /** Override the automatic schema.org type (Article, HowTo, etc.) */
  schemaType?: string;
  /** Human-readable publish date (MM/DD/YYYY) — normalized to ISO on read */
  createdAt?: string;
  /** Human-readable modified date (MM/DD/YYYY) */
  updatedAt?: string;
  /** Display tags — shown in UI, used for related content */
  tags?: string[];
  /** Long-tail keyword phrases for meta keywords and AI Search */
  keywords?: string | string[];
  /** Inline FAQ entries for FAQPage JSON-LD */
  faq?: Array<{ question: string; answer: string }>;

  // Author Metadata
  author?: string;
  authorImage?: string;

  // Education Metadata (Lessons/Guides)
  /** Difficulty level: Beginner | Intermediate | Advanced */
  difficulty?: string;
  /** Array of prerequisite slugs or titles */
  prerequisites?: string[];
  /** Estimated completion time shown in docs UI */
  timeToComplete?: string;
  /** Follow-up content slugs for docs flows */
  nextSteps?: string[];
};

// ─── Parser ───────────────────────────────────────────────────────────────────

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;

export function parseFrontmatter(source: string): Frontmatter {
  const match = source.match(FRONTMATTER_REGEX);
  if (!match) return {};

  try {
    const parsed = yaml.load(match[1]) as Record<string, any>;
    if (!parsed || typeof parsed !== "object") return {};

    if (parsed.createdAt) parsed.createdAt = normalizeDate(parsed.createdAt);
    if (parsed.updatedAt) parsed.updatedAt = normalizeDate(parsed.updatedAt);

    return parsed as Frontmatter;
  } catch (e) {
    console.error("Error parsing frontmatter:", e);
    return {};
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  const parts = s.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    if (m && d && y) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s;
}

export function normalizeKeywords(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw))
    return raw.map((v) => String(v).trim()).filter(Boolean);
  return String(raw)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function mergeMetadata({
  fm,
  path: currentPath,
}: {
  fm: Frontmatter;
  path: string;
}) {
  const title = fm.title;
  const description = fm.desc || fm.description;

  if (!title) {
    throw new Error(`Missing title in frontmatter for: ${currentPath}`);
  }

  if (!description) {
    throw new Error(`Missing description for: ${currentPath}`);
  }

  const canonical = `https://blawby.com${currentPath}`;

  const keywords = [
    ...normalizeKeywords(fm.tags),
    ...normalizeKeywords(fm.keywords),
  ];
  const uniqueKeywords = Array.from(new Set(keywords));

  return {
    title,
    description,
    ...(uniqueKeywords.length ? { keywords: uniqueKeywords.join(", ") } : {}),
    authors: fm.author ? [{ name: fm.author }] : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: fm.image || siteConfig.defaultImage,
          alt: fm.alt || title,
          width: 1200,
          height: 630,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fm.image || siteConfig.defaultImage],
    },
    alternates: {
      canonical,
    },
    robots: fm.noindex ? { index: false, follow: true } : undefined,
  };
}

export function frontmatterToR2Metadata(fm: Frontmatter) {
  const meta: Record<string, string> = {};

  if (fm.title) meta["title"] = fm.title;
  if (fm.desc || fm.description)
    meta["description"] = fm.desc || fm.description || "";
  if (fm.author) meta["author"] = fm.author;
  if (fm.category) meta["category"] = fm.category;
  if (fm.createdAt) meta["date-published"] = fm.createdAt;
  if (fm.updatedAt) meta["date-modified"] = fm.updatedAt;
  if (fm.summary) meta["summary"] = fm.summary;
  if (fm.difficulty) meta["difficulty"] = fm.difficulty;
  if (fm.noindex) meta["noindex"] = "true";
  if (fm.order !== undefined) meta["order"] = String(fm.order);
  if (fm.contentType) meta["content-type"] = fm.contentType;

  const kw = normalizeKeywords(fm.keywords);
  const tags = normalizeKeywords(fm.tags);
  const allKeywords = Array.from(new Set([...kw, ...tags]));
  if (allKeywords.length)
    meta["keywords"] = allKeywords.join(", ").slice(0, 512);

  if (fm.faq && fm.faq.length) {
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
      meta["faq"] = JSON.stringify(faqToStore);
    }
  }

  return meta;
}
