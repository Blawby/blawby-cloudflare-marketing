export type Page = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export function getPages(): Page[] {
  return pages;
}

const pages: Page[] = [
  {
    id: "pricing",
    title: "Pricing",
    description: "Simple, transparent pricing with no hidden fees.",
    href: "/pricing",
  },
  {
    id: "help",
    title: "Help & Support",
    description: "Get help and support for Blawby.",
    href: "/help",
  },
]; 