export type FAQ = { question: string; answer: string };

export const HOME_FAQS: FAQ[] = [
  {
    question: "Is Blawby actually IOLTA-compliant?",
    answer:
      "Yes. Trust and operating are separate ledgers per matter, with documented transfers and per-client reconciliation. The card processor recognizes IOLTA accounts so retainers don't get netted against fees.",
  },
  {
    question: "Do you support ACH as well as cards?",
    answer:
      "Both. Card transactions are 2.9% + 30¢; ACH is 0.8% with a $5 cap per payment — useful for larger retainers and invoices.",
  },
  {
    question: "What does setup actually look like?",
    answer:
      "A solo attorney is typically live in an afternoon. Add your IOLTA and operating bank accounts, paste the intake widget on your site, draft one engagement template, and start triaging.",
  },
  {
    question: "Do clients need an account to pay?",
    answer:
      "No. Payment links work from email or text. Clients only sign in if they want the portal — chat, shared files, balances, and signed forms.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You're only billed for users that actually logged in that month. No annual contract.",
  },
];
