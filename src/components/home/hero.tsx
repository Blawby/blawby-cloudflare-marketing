import { Button } from "../button";
import { WorkflowHero } from "./workflow-hero";

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-meta">
          <span className="dot" />
          <span className="mono small-caps">Blawby · v. 2026.5</span>
          <span className="mono small-caps dim">Last verified May 7, 2026</span>
        </div>
        <div className="hero-grid">
          <div>
            <h1 className="display h1">
              Run a law practice, <em>not a software stack.</em>
            </h1>
          </div>
          <div className="hero-side">
            <p className="hero-sub">
              Blawby is the one place to capture intake, send engagement
              letters, manage matters, invoice clients, and collect
              IOLTA-compliant payments. Built for solo attorneys and small law
              firms.
            </p>
            <div className="hero-ctas">
              <Button
                href="https://ai.blawby.com/register"
                size="lg"
                variant="primary"
              >
                Start now
              </Button>
              <Button href="#workflow" size="lg" variant="ghost">
                See the loop →
              </Button>
            </div>
          </div>
        </div>
        <WorkflowHero />
      </div>
    </section>
  );
}
