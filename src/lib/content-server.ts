import { notFound } from "next/navigation";
import path from "path";

/**
 * Unified server-side helper to fetch the actual React component for an MDX file.
 * This decouples the filesystem location from the SEO category.
 */
export async function getContentComponent(
  origin: string,
  folder: string,
  slug: string,
) {
  // Path traversal protection: allow alphanumeric, hyphens, and underscores
  const validToken = /^[a-zA-Z0-9_-]+$/;
  if (!validToken.test(origin) || !validToken.test(slug)) {
    console.error(
      `[Content Server] Rejected potentially malicious tokens: origin=${origin}, slug=${slug}`,
    );
    return notFound();
  }

  // Nested folders allow slashes but not traversal
  if (folder !== "." && !/^[a-zA-Z0-9_\-\/]+$/.test(folder)) {
    console.error(`[Content Server] Rejected invalid folder: ${folder}`);
    return notFound();
  }

  const MDX_ROOT = path.join(process.cwd(), "src/data");
  const resolvedPath = path.resolve(MDX_ROOT, origin, folder, `${slug}.mdx`);

  if (!resolvedPath.startsWith(MDX_ROOT)) {
    console.error(
      `[Content Server] Path traversal attempt blocked: ${resolvedPath}`,
    );
    return notFound();
  }

  try {
    if (origin === "lessons") {
      if (folder !== ".") {
        console.warn(`[Content Server] Folder "${folder}" ignored for lessons`);
      }
      return (await import(`@/data/lessons/${slug}.mdx`)).default;
    }

    if (origin === "docs") {
      if (folder === "docs" || folder === ".") {
        return (await import(`@/data/docs/${slug}.mdx`)).default;
      }

      return (await import(`@/data/docs/${folder}/${slug}.mdx`)).default;
    }

    if (origin === "solutions") {
      return (await import(`@/data/solutions/${folder === "solutions" ? "" : folder}/${slug}.mdx`)).default;
    }

    console.error(`[Content Server] Unknown origin: ${origin}`);
    return notFound();
  } catch (e) {
    console.error(
      `[Content Server] Failed to import MDX: ${origin}/${folder}/${slug}`,
      e,
    );
    return notFound();
  }
}
