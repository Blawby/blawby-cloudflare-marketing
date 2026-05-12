"use client";

import { useState } from "react";
import { SectionLabel } from "./section-label";

const FAQS = [
  {
    q: "Is Blawby actually IOLTA-compliant?",
    a: "Yes. Trust and operating are separate ledgers per matter, with documented transfers and per-client reconciliation. The card processor recognizes IOLTA accounts so retainers don't get netted against fees.",
  },
  {
    q: "Do you support ACH as well as cards?",
    a: "Both. Card transactions are 2.9% + 30¢; ACH is 0.8% with a $5 cap per payment — useful for larger retainers and invoices.",
  },
  {
    q: "What does setup actually look like?",
    a: "A solo attorney is typically live in an afternoon. Add your IOLTA and operating bank accounts, paste the intake widget on your site, draft one engagement template, and start triaging.",
  },
  {
    q: "Do clients need an account to pay?",
    a: "No. Payment links work from email or text. Clients only sign in if they want the portal — chat, shared files, balances, and signed forms.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You're only billed for users that actually logged in that month. No annual contract.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="container section-faq" id="faq">
      <SectionLabel num="08">Frequently asked</SectionLabel>
      <h2 className="display h2">
        Common objections, <em>answered.</em>
      </h2>
      <div className="faq-list">
        {FAQS.map((f, i) => (
          <button
            key={f.q}
            type="button"
            className={"faq-item " + (open === i ? "is-open" : "")}
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
          >
            <div className="faq-q-row">
              <span className="mono faq-num">Q.0{i + 1}</span>
              <span className="faq-q display">{f.q}</span>
              <span className="faq-toggle mono">{open === i ? "—" : "+"}</span>
            </div>
            <div className="faq-a-wrap">
              <div className="faq-a">{f.a}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
