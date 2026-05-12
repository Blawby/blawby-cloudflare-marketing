import { SectionLabel } from "./section-label";

export function PricingSection() {
  return (
    <section className="container section-pricing" id="pricing">
      <SectionLabel num="06">Pricing</SectionLabel>
      <h2 className="display h2">
        One price. <em>No surprises.</em>
      </h2>
      <div className="pricing-card">
        <div className="pricing-main">
          <div className="pricing-amount">
            <span className="display price-num">$40</span>
            <div className="price-unit">
              <div className="mono small-caps">per active user</div>
              <div className="mono small-caps dim">per month</div>
            </div>
          </div>
          <p className="pricing-note">
            Pay only for users who logged in this month. No seats sitting idle,
            no annual contract, no setup fee.
          </p>
          <a href="https://ai.blawby.com/register" className="btn btn-primary">
            Start now
          </a>
        </div>
        <div className="pricing-side">
          <div className="pricing-row">
            <span className="mono small-caps">Card</span>
            <span className="display">2.9% + 30¢</span>
          </div>
          <div className="pricing-row">
            <span className="mono small-caps">ACH</span>
            <span className="display">
              0.8% <span className="dim">/ cap $5</span>
            </span>
          </div>
          <div className="pricing-row">
            <span className="mono small-caps">Invoice fee</span>
            <span className="display">0%</span>
          </div>
          <div className="pricing-row pricing-row-last">
            <span className="mono small-caps">IOLTA-compliant</span>
            <span className="display">Yes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
