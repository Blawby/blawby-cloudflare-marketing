export type Category = {
  id: string;
  name: string;
  description: string;
  slug: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

// SEO-focused article categories for blog traffic capture
export const articleCategories: Category[] = [
  {
    id: "compliance",
    name: "Compliance",
    description: "IOLTA compliance, trust accounts, and legal trust account management",
    slug: "compliance",
  },
  {
    id: "ai-chat",
    name: "AI Chat & Client Acquisition",
    description: "AI-powered conversations, client intake automation, and lead generation",
    slug: "ai-chat",
  },
  {
    id: "business-strategy",
    name: "Business Strategy",
    description: "Law firm operations, revenue optimization, and growth strategies",
    slug: "business-strategy",
  },
  {
    id: "legal-tech",
    name: "Legal Technology",
    description: "Modern legal tech trends, automation, and digital transformation",
    slug: "legal-tech",
  },
];

// User journey documentation categories for active users
export const userJourneyCategories: Category[] = [
  {
    id: "quick-start",
    name: "Quick Start",
    description: "Get started with Blawby in minutes",
    slug: "quick-start",
  },
  {
    id: "features",
    name: "Features",
    description: "A deeper dive into the platform.",
    slug: "features",
  },
  {
    id: "advanced-features",
    name: "Advanced Features",
    description: "Powerful features for growing practices",
    slug: "advanced-features",
  },
  {
    id: "reference",
    name: "Reference",
    description: "API documentation, webhooks, and technical reference",
    slug: "reference",
  },
];

export const categories = [...articleCategories, ...userJourneyCategories];

// SEO-focused tags for article content
export const articleTags: Tag[] = [
  { id: "iolta", name: "IOLTA", slug: "iolta" },
  { id: "trust-accounts", name: "Trust Accounts", slug: "trust-accounts" },
  { id: "legal-compliance", name: "Legal Compliance", slug: "legal-compliance" },
  { id: "payment-processing", name: "Payment Processing", slug: "payment-processing" },
  { id: "revenue-optimization", name: "Revenue Optimization", slug: "revenue-optimization" },
  { id: "flat-fees", name: "Flat Fees", slug: "flat-fees" },
  { id: "payment-plans", name: "Payment Plans", slug: "payment-plans" },
  { id: "automated-billing", name: "Automated Billing", slug: "automated-billing" },
  { id: "cash-flow", name: "Cash Flow", slug: "cash-flow" },
  { id: "ai-chat", name: "AI Chat", slug: "ai-chat" },
  { id: "automation", name: "Automation", slug: "automation" },
  { id: "client-intake", name: "Client Intake", slug: "client-intake" },
  { id: "lead-generation", name: "Lead Generation", slug: "lead-generation" },
  { id: "client-acquisition", name: "Client Acquisition", slug: "client-acquisition" },
  { id: "practice-management", name: "Practice Management", slug: "practice-management" },
  { id: "legal-tech", name: "Legal Tech", slug: "legal-tech" },
  { id: "law-firm-operations", name: "Law Firm Operations", slug: "law-firm-operations" },
  { id: "solo-practice", name: "Solo Practice", slug: "solo-practice" },
];

// User journey documentation tags
export const userJourneyTags: Tag[] = [
  { id: "setup", name: "Setup", slug: "setup" },
  { id: "installation", name: "Installation", slug: "installation" },
  { id: "configuration", name: "Configuration", slug: "configuration" },
  { id: "widget", name: "Widget", slug: "widget" },
  { id: "payments", name: "Payments", slug: "payments" },
  { id: "conversations", name: "Conversations", slug: "conversations" },
  { id: "client-management", name: "Client Management", slug: "client-management" },
  { id: "api", name: "API", slug: "api" },
  { id: "webhooks", name: "Webhooks", slug: "webhooks" },
  { id: "integration", name: "Integration", slug: "integration" },
  { id: "troubleshooting", name: "Troubleshooting", slug: "troubleshooting" },
];

export const tags = [...articleTags, ...userJourneyTags];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

export function getTagById(id: string): Tag | undefined {
  return tags.find((tag) => tag.id === id);
}

export function getTagsBySlugs(slugs: string[]): Tag[] {
  return tags.filter((tag) => slugs.includes(tag.slug));
}
