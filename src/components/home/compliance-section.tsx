import { SectionLabel } from "./section-label";

export function ComplianceSection() {
  return (
    <section className="section-compliance" id="trust">
      <div className="container compliance-grid">
        <div className="compliance-left">
          <SectionLabel num="04">Trust &amp; IOLTA</SectionLabel>
          <h2 className="display h2">
            Trust math that bar counsel can <em>read in a glance.</em>
          </h2>
          <p className="lede">
            Every dollar lands in the right account from the first swipe.
            Retainers go to trust. Earned fees go to operating. Transfers are
            documented, dated, and reversible.
          </p>
          <ul className="compliance-list">
            <li>
              <span className="mono small-caps light-mono">a.</span>
              Separate trust and operating ledgers, per matter.
            </li>
            <li>
              <span className="mono small-caps light-mono">b.</span>
              Client-by-client trust reconciliation, on demand.
            </li>
            <li>
              <span className="mono small-caps light-mono">c.</span>
              Trust-to-operating transfers documented with the underlying
              invoice.
            </li>
            <li>
              <span className="mono small-caps light-mono">d.</span>
              Card processor that recognizes IOLTA accounts.
            </li>
          </ul>
        </div>
        <div className="compliance-right">
          <div className="compliance-card">
            <div className="cc-row cc-row-head">
              <span className="mono small-caps">Trust ledger — Doe, Jane</span>
              <span className="mono">May 12, 2026</span>
            </div>
            <div className="cc-row">
              <span>Retainer received</span>
              <span className="mono pos">+ $3,500.00</span>
            </div>
            <div className="cc-row">
              <span>Invoice #1041 earned</span>
              <span className="mono">$1,280.00</span>
            </div>
            <div className="cc-row">
              <span>Trust → Operating transfer</span>
              <span className="mono neg">− $1,280.00</span>
            </div>
            <div className="cc-row cc-row-foot">
              <span>Trust balance</span>
              <span className="mono">$2,220.00</span>
            </div>
            <div className="cc-stamp mono small-caps">
              Documented · reversible · audit-ready
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
