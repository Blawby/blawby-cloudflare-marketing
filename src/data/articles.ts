import { getContent, getAllContent, type ContentItem } from "@/lib/content";

// Compatibility layer: Map new ContentItem back to old Article type where needed
export async function getArticles(): Promise<ContentItem[]> {
  const all = await getAllContent();
  return all.map(item => ({ ...item, id: item.slug }));
}

export type Article = ContentItem & { id: string };

export async function getArticle(slug: string): Promise<Article | null> {
  const content = await getContent(slug);
  if (!content) return null;
  return {
    ...content,
    id: content.slug,
  };
}

