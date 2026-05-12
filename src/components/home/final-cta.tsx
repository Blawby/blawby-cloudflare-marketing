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
          <a
            href="https://ai.blawby.com/register"
            className="btn btn-primary btn-lg"
          >
            Start now
          </a>
          <a href="/docs" className="btn btn-ghost btn-lg">
            View docs →
          </a>
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
