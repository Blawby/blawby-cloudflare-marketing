import { siteConfig } from "@/config/site";

type SchemaAuthor = { name: string; url: string; image?: string } | string;

function normalizeAuthor(author: SchemaAuthor) {
  if (typeof author === "string") {
    return { name: author, url: siteConfig.url };
  }

  return author;
}

function getAuthorSchema(author: SchemaAuthor) {
  const norm = normalizeAuthor(author);
  return {
    "@type": "Person",
    name: norm.name,
    url: norm.url,
    ...(norm.image ? { image: norm.image } : {}),
  };
}

function formatDate(dateStr: string) {
  if (!dateStr) return undefined;
  if (dateStr.includes("T") || dateStr.includes("Z")) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
}

// Generate Article schema.org JSON-LD for blog posts and guides
export function getArticleSchema({
  name,
  description,
  url,
  author = { name: siteConfig.name, url: siteConfig.url },
  datePublished,
  dateModified,
  image,
  category,
  tags = [],
}: {
  name: string;
  description: string;
  url: string;
  author?: SchemaAuthor;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  category?: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    name,
    description,
    url,
    author: getAuthorSchema(author),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: siteConfig.defaultImage,
      },
    },
    ...(datePublished ? { datePublished: formatDate(datePublished) } : {}),
    ...(dateModified ? { dateModified: formatDate(dateModified) } : {}),
    ...(image
      ? {
          image: {
            "@type": "ImageObject",
            url: image,
          },
        }
      : {
          image: {
            "@type": "ImageObject",
            url: siteConfig.defaultImage,
          },
        }),
    ...(category ? { articleSection: category } : {}),
    ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

// Generate BlogPosting schema for more specific blog content
export function getBlogPostingSchema({
  name,
  description,
  url,
  author = { name: siteConfig.name, url: siteConfig.url },
  datePublished,
  dateModified,
  image,
  category,
  tags = [],
}: {
  name: string;
  description: string;
  url: string;
  author?: SchemaAuthor;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  category?: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: name,
    name,
    description,
    url,
    author: getAuthorSchema(author),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: siteConfig.defaultImage,
      },
    },
    ...(datePublished ? { datePublished: formatDate(datePublished) } : {}),
    ...(dateModified ? { dateModified: formatDate(dateModified) } : {}),
    ...(image
      ? {
          image: {
            "@type": "ImageObject",
            url: image,
          },
        }
      : {
          image: {
            "@type": "ImageObject",
            url: siteConfig.defaultImage,
          },
        }),
    ...(category ? { articleSection: category } : {}),
    ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
