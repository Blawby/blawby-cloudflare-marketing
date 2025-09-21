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
    id: "nonprofit-commitment",
    title: "Nonprofit Commitment",
    description:
      "Dedicated to supporting nonprofit legal aid organizations with affordable digital infrastructure.",
    href: "/nonprofit-commitment",
  },
  {
    id: "pitch-deck",
    title: "Blawby Investor Pitch",
    description:
      "Unified Platform for Legal Payments & AI‑Driven Client Intake",
    href: "/pitch-deck",
  },
  {
    id: "help",
    title: "Help & Support",
    description: "Get help and support for Blawby.",
    href: "/help",
  },
];
