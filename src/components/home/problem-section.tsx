import { SectionLabel } from "./section-label";

const STITCHED = [
  "Intake form",
  "Engagement PDF",
  "Time tracker",
  "QuickBooks",
  "Stripe link",
  "Trust ledger",
  "Email files",
];

export function ProblemSection() {
  return (
    <section className="container section-problem" id="problem">
      <SectionLabel num="01">The problem</SectionLabel>
      <div className="problem-grid">
        <h2 className="display h2">
          A solo practice runs on <em>seven tabs</em>, three vendors, and a
          prayer that the trust math works out.
        </h2>
        <div className="problem-side">
          <p className="lede">
            Intake forms in one tool. Engagement letters in another. Time
            tracking in a spreadsheet. Invoices in QuickBooks. Card processing
            that doesn't understand IOLTA. Files in email.
          </p>
          <p className="lede">
            Blawby replaces the stack with one ledger of record — from the first
            inquiry to the final transfer out of trust.
          </p>
        </div>
      </div>
      <div className="stitched-row">
        {STITCHED.map((t) => (
          <span key={t} className="stitched-pill mono">
            <span className="stitched-x">×</span>
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
