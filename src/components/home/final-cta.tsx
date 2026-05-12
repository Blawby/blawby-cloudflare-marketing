import { Button } from "../button";

export function FinalCTA() {
  return (
    <section className="section-cta" id="start">
      <div className="container cta-inner">
        <div className="cta-top mono small-caps">
          <span>The Blawby loop</span>
          <span className="rule" />
          <span>Ready when you are</span>
        </div>
        <h2 className="display cta-h">
          Start managing legal intake, matters, and trust-safe payments with{" "}
          <em>Blawby.</em>
        </h2>
        <div className="cta-actions">
          <Button
            href="https://ai.blawby.com/register"
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start now
          </Button>
          <Button href="/docs" variant="ghost" size="lg">
            View docs →
          </Button>
        </div>
        <div className="cta-meta mono small-caps">
          <span>$40 per active user / month</span>
          <span className="dot" />
          <span>No setup fee</span>
          <span className="dot" />
          <span>Cancel any month</span>
        </div>
      </div>
    </section>
  );
}
