import { WORKFLOW_STEPS } from "@/data/home/workflow-steps";
import { Placeholder } from "./placeholder";
import { SectionLabel } from "./section-label";

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
        {WORKFLOW_STEPS.map((r, i) => (
          <div
            key={r.num}
            id={r.anchorId}
            className={"wf-row " + (i % 2 ? "wf-row-rev" : "")}
          >
            <div className="container wf-row-inner">
              <div className="wf-row-text">
                <div className="wf-row-meta">
                  <span className="mono big-num">{r.num}</span>
                  <span className="mono small-caps">{r.kicker}</span>
                </div>
                <h3 className="display h3">{r.detailTitle}</h3>
                <p className="lede">{r.detailBody}</p>
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
                <Placeholder caption={r.shotCaption} ratio="4 / 3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
