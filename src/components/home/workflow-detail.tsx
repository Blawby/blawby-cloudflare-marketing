import { Placeholder } from "./placeholder";
import { SectionLabel } from "./section-label";

const ROWS = [
  {
    num: "01",
    kicker: "Capture",
    title: "Intake that sounds like you wrote it.",
    body: "Drop a widget on your site, ask the questions you actually need, and price-screen with conditional fees before anything hits your inbox.",
    bullets: [
      "Custom fields & conditions",
      "Conflict check on submit",
      "Auto-route by practice area",
    ],
    shot: "Intake widget — composer view",
  },
  {
    num: "02",
    kicker: "Triage",
    title: "Decide in 30 seconds, not 30 minutes.",
    body: "Every submission lands in a triage queue with an AI second opinion. Accept and convert to a matter, decline with a templated note, or ask AI to dig deeper.",
    bullets: [
      "Accept · Decline · Ask AI",
      "Conflict & jurisdiction flags",
      "One-click matter creation",
    ],
    shot: "Triage queue — submission detail",
  },
  {
    num: "03",
    kicker: "Engage",
    title: "Scope, fees, and signature in one link.",
    body: "Generate an engagement letter from a template, include the fee terms, and send a single signing link. The retainer is collected the moment they sign.",
    bullets: [
      "Reusable engagement templates",
      "Risk & acknowledgment clauses",
      "Retainer collected on signature",
    ],
    shot: "Engagement letter — signer view",
  },
  {
    num: "04",
    kicker: "Manage",
    title: "Every matter has a single page of record.",
    body: "Tabs for activity, files, time, billing, and the client portal. Whatever happens on the matter happens here — no second tab, no second tool.",
    bullets: [
      "Time entries on the matter",
      "Shared files & client chat",
      "Activity log of everything",
    ],
    shot: "Matter detail — tabbed view",
  },
  {
    num: "05",
    kicker: "Collect",
    title: "Invoice, get paid, sweep to trust — cleanly.",
    body: "Generate the invoice from time entries, send a payment link that accepts card or ACH, and route earned funds from trust to operating in one signed step.",
    bullets: [
      "Card 2.9% + 30¢ · ACH 0.8%",
      "Trust-aware ledger",
      "Documented trust transfers",
    ],
    shot: "Invoice & trust transfer",
  },
];

export function WorkflowDetail() {
  return (
    <section className="section-workflow" id="workflow">
      <div className="container">
        <SectionLabel num="02">The five-step loop</SectionLabel>
        <h2 className="display h2 workflow-h2">
          One ledger from <em>first hello</em> to <em>final transfer</em>.
        </h2>
      </div>
      <div className="workflow-rows">
        {ROWS.map((r, i) => (
          <div key={r.num} className={"wf-row " + (i % 2 ? "wf-row-rev" : "")}>
            <div className="container wf-row-inner">
              <div className="wf-row-text">
                <div className="wf-row-meta">
                  <span className="mono big-num">{r.num}</span>
                  <span className="mono small-caps">{r.kicker}</span>
                </div>
                <h3 className="display h3">{r.title}</h3>
                <p className="lede">{r.body}</p>
                <ul className="wf-bullets">
                  {r.bullets.map((b) => (
                    <li key={b}>
                      <span className="bullet-mark mono">·</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="wf-row-shot">
                <Placeholder caption={r.shot} ratio="4 / 3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
