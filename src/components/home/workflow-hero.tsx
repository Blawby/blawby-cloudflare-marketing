"use client";

import { WORKFLOW_STEPS } from "@/data/home/workflow-steps";
import { useEffect, useState } from "react";

export function WorkflowHero() {
  const [revealed, setRevealed] = useState(-1);
  const [lineProgress, setLineProgress] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    WORKFLOW_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealed(i), 350 + i * 220));
    });
    timers.push(setTimeout(() => setLineProgress(1), 400));
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStepClick = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="workflow-hero">
      <div className="workflow-meta">
        <span className="mono small-caps">Fig. 01</span>
        <span className="mono small-caps">The Blawby loop</span>
        <span className="mono small-caps">Intake → Trust transfer</span>
      </div>
      <div className="workflow-track">
        <svg
          className="workflow-line"
          viewBox="0 0 1000 2"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="1"
            x2="1000"
            y2="1"
            stroke="var(--rule)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1="1"
            x2="1000"
            y2="1"
            stroke="var(--accent)"
            strokeWidth="1.5"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000 - lineProgress * 1000,
              transition: "stroke-dashoffset 1800ms cubic-bezier(0.7,0,0.2,1)",
            }}
          />
        </svg>
        <div className="workflow-steps">
          {WORKFLOW_STEPS.map((s, i) => (
            <div
              key={s.num}
              className={"wf-step " + (revealed >= i ? "is-in" : "")}
            >
              <div className="wf-node">
                <span className="wf-dot" />
              </div>
              <button
                type="button"
                className="wf-card"
                onClick={() => handleStepClick(s.anchorId)}
                aria-label={`Jump to ${s.kicker} step detail`}
              >
                <div className="wf-num mono">{s.num}</div>
                <div className="wf-label">{s.kicker}</div>
                <div className="wf-desc">{s.cardDesc}</div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
