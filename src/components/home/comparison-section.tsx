import { SectionLabel } from "./section-label";

const ROWS: Array<[string, boolean, boolean]> = [
  ["IOLTA-aware ledger", true, false],
  ["Trust → operating transfers", true, false],
  ["Engagement letter + signature in one link", true, false],
  ["Intake widget with conditional fees", true, false],
  ["Card + ACH processing", true, true],
  ["Generic e-commerce checkout flow", false, true],
  ["Built for solo & small-firm attorneys", true, false],
];

export function ComparisonSection() {
  return (
    <section className="container section-compare" id="compare">
      <SectionLabel num="05">Built for law firms</SectionLabel>
      <h2 className="display h2">
        A payment processor knows <em>checkouts.</em> Blawby knows{" "}
        <em>matters.</em>
      </h2>
      <div className="compare-table">
        <div className="compare-head">
          <div></div>
          <div className="compare-h compare-h-us">
            <span className="display">Blawby</span>
            <span className="mono small-caps">Legal practice platform</span>
          </div>
          <div className="compare-h">
            <span className="display dim">Generic payments</span>
            <span className="mono small-caps">Stripe-style checkout</span>
          </div>
        </div>
        {ROWS.map(([label, us, them]) => (
          <div key={label} className="compare-row">
            <div className="compare-cell compare-cell-label">{label}</div>
            <div className="compare-cell compare-cell-us">
              {us ? (
                <span className="check" role="img" aria-label="Included">
                  ●
                </span>
              ) : (
                <span className="cross" role="img" aria-label="Not included">
                  —
                </span>
              )}
            </div>
            <div className="compare-cell">
              {them ? (
                <span
                  className="check dim-check"
                  role="img"
                  aria-label="Included"
                >
                  ●
                </span>
              ) : (
                <span className="cross" role="img" aria-label="Not included">
                  —
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
