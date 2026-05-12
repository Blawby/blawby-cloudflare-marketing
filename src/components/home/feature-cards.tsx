import { SectionLabel } from "./section-label";

const CARDS = [
  {
    tag: "01",
    name: "Intake",
    href: "/features/set-up-client-intake",
    lines:
      "Widget, templates, conditions, fees, conflict-checks, jurisdiction routing.",
  },
  {
    tag: "02",
    name: "Engagements",
    href: "/features/engagements-overview",
    lines:
      "Scope, fee, risk, acknowledgments, e-signature, retainer collection.",
  },
  {
    tag: "03",
    name: "Matters",
    href: "/features/matters-overview",
    lines:
      "Activity, files, time, billing, invoices, client chat — one canonical page.",
  },
  {
    tag: "04",
    name: "Billing",
    href: "/features/manage-matters",
    lines:
      "Time entries to invoices to statements, with a real receivables view.",
  },
  {
    tag: "05",
    name: "Payments",
    href: "/payments/accepting-payments",
    lines: "Card and ACH. 2.9% + 30¢ on cards, 0.8% on ACH, capped at $5.",
  },
  {
    tag: "06",
    name: "Trust & Compliance",
    href: "/features/trust-to-operating-transfer-workflow",
    lines: "IOLTA-aware ledger. Documented trust-to-operating transfers.",
  },
  {
    tag: "07",
    name: "Client Portal",
    href: "/features/join-client-conversation",
    lines:
      "A clean login for your clients — chat, documents, balances, signed forms.",
  },
];

export function FeatureCards() {
  return (
    <section className="container section-features" id="features">
      <SectionLabel num="03">What's in the box</SectionLabel>
      <h2 className="display h2">
        Seven surfaces. <em>One ledger.</em>
      </h2>
      <div className="feature-grid">
        {CARDS.map((c) => (
          <a key={c.tag} className="feature-card" href={c.href}>
            <div className="feature-top">
              <span className="mono small-caps">{c.tag} · Feature</span>
              <span className="feature-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="feature-name display">{c.name}</div>
            <div className="feature-lines">{c.lines}</div>
            <div className="feature-foot mono small-caps">View docs →</div>
          </a>
        ))}
      </div>
    </section>
  );
}
