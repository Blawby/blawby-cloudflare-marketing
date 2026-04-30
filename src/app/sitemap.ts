import { siteConfig } from "@/config/site";
import { getAllContent } from "@/lib/content";
import fs from "fs";
import { MetadataRoute } from "next";
import path from "path";

export const dynamic = "force-static";

const interviewsEnabled = process.env.SHOW_INTERVIEWS === "true";

function getFileMtime(filePath: string): string | null {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteConfig.url;
  const urlMap = new Map<string, MetadataRoute.Sitemap[0]>();
  const content = await getAllContent();

  // 1. Add home page (latest mod time of any content)
  const latestContentMod = content.reduce((latest, item) => {
    const mod = item.updatedAt || "";
    return mod > latest ? mod : latest;
  }, "");

  urlMap.set(siteUrl, {
    url: siteUrl,
    lastModified: latestContentMod || new Date().toISOString(),
    changeFrequency: "daily",
    priority: 1.0,
  });

  // 2. Add static pages with real modification times
  const staticPages = [
    { path: "/pricing", file: "src/data/pages/pricing.mdx", priority: 0.8 },
    { path: "/help", file: "src/data/pages/help.mdx", priority: 0.8 },
    {
      path: "/nonprofit-commitment",
      file: "src/data/pages/nonprofit-commitment.mdx",
      priority: 0.8,
    },
  ];

  for (const { path: p, file: f, priority } of staticPages) {
    const url = `${siteUrl}${p}`;
    const mtime = getFileMtime(path.join(process.cwd(), f));
    urlMap.set(url, {
      url,
      lastModified: mtime || new Date().toISOString(),
      changeFrequency: "weekly",
      priority,
    });
  }

  // 3. Add dynamic content (lessons/articles)
  for (const item of content) {
    const url = `${siteUrl}${item.href}`;
    urlMap.set(url, {
      url,
      lastModified:
        item.updatedAt || item.createdAt || new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  // 4. Add Legal pages (Terms, Privacy)
  const legalPages = ["/privacy", "/terms"];
  for (const page of legalPages) {
    const url = `${siteUrl}${page}`;
    urlMap.set(url, {
      url,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.3,
    });
  }

  // 5. Add Interviews (they are still JSON/VTT based)
  if (interviewsEnabled) {
    try {
      const interviewsDir = path.join(process.cwd(), "src/data/interviews");
      if (fs.existsSync(interviewsDir)) {
        const interviewFiles = fs
          .readdirSync(interviewsDir)
          .filter((file) => file.endsWith(".vtt"));
        for (const file of interviewFiles) {
          const slug = file.replace(".vtt", "");
          const url = `${siteUrl}/interviews/${slug}`;
          urlMap.set(url, {
            url,
            lastModified:
              getFileMtime(path.join(interviewsDir, file)) ||
              new Date().toISOString(),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    } catch (e) {
      console.error("[Sitemap] Failed to process interviews directory:", e);
    }
  }

  return Array.from(urlMap.values());
}
