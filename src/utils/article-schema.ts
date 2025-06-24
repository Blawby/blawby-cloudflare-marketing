// Generate Article schema.org JSON-LD for blog posts and guides
export function getArticleSchema({
  name,
  description,
  url,
  author = { name: "Blawby", url: "https://blawby.com" },
  datePublished,
  dateModified,
  image,
  category,
  tags = [],
}: {
  name: string;
  description: string;
  url: string;
  author?: { name: string; url: string };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  category?: string;
  tags?: string[];
}) {
  // Convert date strings to ISO format with timezone if they're just dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    // If it's already in ISO format with timezone, return as is
    if (dateStr.includes('T') || dateStr.includes('Z')) return dateStr;
    // If it's just a date (YYYY-MM-DD), add time and timezone
    return `${dateStr}T00:00:00.000Z`;
  };

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    name,
    description,
    url,
    author: {
      "@type": "Organization",
      name: author.name,
      url: author.url,
    },
    publisher: {
      "@type": "Organization",
      name: "Blawby",
      url: "https://blawby.com",
      logo: {
        "@type": "ImageObject",
        url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
      },
    },
    ...(datePublished ? { datePublished: formatDate(datePublished) } : {}),
    ...(dateModified ? { dateModified: formatDate(dateModified) } : {}),
    ...(image ? { 
      image: {
        "@type": "ImageObject",
        url: image,
      }
    } : {
      image: {
        "@type": "ImageObject",
        url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
      }
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
  author = { name: "Blawby", url: "https://blawby.com" },
  datePublished,
  dateModified,
  image,
  category,
  tags = [],
}: {
  name: string;
  description: string;
  url: string;
  author?: { name: string; url: string };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  category?: string;
  tags?: string[];
}) {
  // Convert date strings to ISO format with timezone if they're just dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    // If it's already in ISO format with timezone, return as is
    if (dateStr.includes('T') || dateStr.includes('Z')) return dateStr;
    // If it's just a date (YYYY-MM-DD), add time and timezone
    return `${dateStr}T00:00:00.000Z`;
  };

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: name,
    name,
    description,
    url,
    author: {
      "@type": "Organization",
      name: author.name,
      url: author.url,
    },
    publisher: {
      "@type": "Organization",
      name: "Blawby",
      url: "https://blawby.com",
      logo: {
        "@type": "ImageObject",
        url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
      },
    },
    ...(datePublished ? { datePublished: formatDate(datePublished) } : {}),
    ...(dateModified ? { dateModified: formatDate(dateModified) } : {}),
    ...(image ? { 
      image: {
        "@type": "ImageObject",
        url: image,
      }
    } : {
      image: {
        "@type": "ImageObject",
        url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
      }
    }),
    ...(category ? { articleSection: category } : {}),
    ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
} 