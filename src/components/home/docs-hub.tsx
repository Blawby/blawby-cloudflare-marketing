import { SectionLabel } from "./section-label";

const ITEMS = [
  {
    area: "Intake",
    href: "/features/set-up-client-intake",
    lines: "Configure your client intake widget and triage new leads.",
  },
  {
    area: "Engagements",
    href: "/features/engagements-overview",
    lines: "Send scope, fee, and acknowledgment terms for client signature.",
  },
  {
    area: "Matters",
    href: "/features/matters-overview",
    lines: "Track work, files, time, billing, invoices, and client activity.",
  },
  {
    area: "Trust & Compliance",
    href: "/features/trust-to-operating-transfer-workflow",
    lines: "Document earned fees and trust-to-operating transfers.",
  },
];

export function DocsHub() {
  return (
    <section className="container section-docs" id="docs">
      <SectionLabel num="07">Learn how Blawby works</SectionLabel>
      <div className="docs-head">
        <h2 className="display h2">
          Short, practical guides for <em>each workflow.</em>
        </h2>
        <a href="/docs" className="btn btn-ghost">
          View all docs →
        </a>
      </div>
      <div className="docs-grid">
        {ITEMS.map((item, idx) => (
          <a key={item.area} className="docs-card" href={item.href}>
            <div className="docs-card-top">
              <span className="mono small-caps">Guide · 0{idx + 1}</span>
              <span className="mono small-caps">Read →</span>
            </div>
            <div className="docs-card-name display">{item.area}</div>
            <div className="docs-card-lines">{item.lines}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
