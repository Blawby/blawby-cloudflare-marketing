import { notFound } from "next/navigation";

/**
 * Unified server-side helper to fetch the actual React component for an MDX file.
 * This decouples the filesystem location from the SEO category.
 */
export async function getContentComponent(origin: string, folder: string, slug: string) {
  try {
    if (origin === "lessons") {
      return (await import(`@/data/lessons/${slug}.mdx`)).default;
    }
    
    return (await import(`@/data/articles/${folder}/${slug}.mdx`)).default;
  } catch (e) {
    console.error(`[Content Server] Failed to import MDX: ${origin}/${folder}/${slug}`, e);
    return notFound();
  }
}
