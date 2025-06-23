export type Article = {
  id: string;
  title: string;
  description: string;
  contentType: "article" | "guide";
  category: string;
  tags: string[];
  datePublished: string;
  dateModified: string;
  author?: string;
  video: {
    thumbnail: string;
    duration: number;
    url: string;
  } | null;
};

export function getArticles(): Article[] {
  return articles;
}

export async function getArticle(
  slug: string,
): Promise<Article | null> {
  return articles.find(article => article.id === slug) || null;
}

export async function getArticleContent(category: string, slug: string) {
  return (await import(`@/data/articles/${category}/${slug}.mdx`)).default;
}

const articles: Article[] = [
  {
    id: "iolta-compliance",
    title: "IOLTA Compliance Guide",
    description: "Understanding trust account requirements for legal payments.",
    contentType: "guide",
    category: "compliance",
    tags: ["iolta", "trust-accounts", "legal-compliance", "payment-processing"],
    datePublished: "2024-01-15",
    dateModified: "2024-01-15",
    video: null,
  },
  {
    id: "future-proof-revenue",
    title: "Future-Proof Revenue",
    description: "How to use flat fees, payment plans, and automated billing to stabilize your law firm's cash flow.",
    contentType: "guide",
    category: "business-strategy",
    tags: ["revenue-optimization", "flat-fees", "payment-plans", "automated-billing", "cash-flow"],
    datePublished: "2024-01-20",
    dateModified: "2024-01-20",
    video: null,
  }
]; 