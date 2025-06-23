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

export const categories: Category[] = [
  {
    id: "compliance",
    name: "Compliance",
    description: "Legal compliance guides and best practices",
    slug: "compliance",
  },
  {
    id: "business-strategy",
    name: "Business Strategy",
    description: "Strategic guidance for law firm growth and operations",
    slug: "business-strategy",
  },
  {
    id: "payment-processing",
    name: "Payment Processing",
    description: "Payment processing guides and tutorials",
    slug: "payment-processing",
  },
  {
    id: "client-management",
    name: "Client Management",
    description: "Client relationship and management best practices",
    slug: "client-management",
  },
  {
    id: "automation",
    name: "Automation",
    description: "Workflow automation and efficiency tips",
    slug: "automation",
  },
];

export const tags: Tag[] = [
  { id: "iolta", name: "IOLTA", slug: "iolta" },
  { id: "trust-accounts", name: "Trust Accounts", slug: "trust-accounts" },
  { id: "legal-compliance", name: "Legal Compliance", slug: "legal-compliance" },
  { id: "payment-processing", name: "Payment Processing", slug: "payment-processing" },
  { id: "revenue-optimization", name: "Revenue Optimization", slug: "revenue-optimization" },
  { id: "flat-fees", name: "Flat Fees", slug: "flat-fees" },
  { id: "payment-plans", name: "Payment Plans", slug: "payment-plans" },
  { id: "automated-billing", name: "Automated Billing", slug: "automated-billing" },
  { id: "cash-flow", name: "Cash Flow", slug: "cash-flow" },
  { id: "client-management", name: "Client Management", slug: "client-management" },
  { id: "invoicing", name: "Invoicing", slug: "invoicing" },
  { id: "payouts", name: "Payouts", slug: "payouts" },
  { id: "credit-cards", name: "Credit Cards", slug: "credit-cards" },
  { id: "ach", name: "ACH", slug: "ach" },
  { id: "bank-transfers", name: "Bank Transfers", slug: "bank-transfers" },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find(cat => cat.id === id);
}

export function getTagById(id: string): Tag | undefined {
  return tags.find(tag => tag.id === id);
}

export function getTagsBySlugs(slugs: string[]): Tag[] {
  return tags.filter(tag => slugs.includes(tag.slug));
} 