export function Problem() {
  return (
    <section className="mb-16">
      <h2
        id="problem"
        className="mb-6 text-3xl font-bold text-gray-950 dark:text-white"
      >
        Problem
      </h2>
      <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Small firms run on paper, people, and processes that kill billable time.
      </h3>
      <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
        <li>Many small firms still rely on <strong>paper invoices, mailed checks, and manual retainer billing</strong>.</li>
        <li>Scheduling and intake are <strong>human-intensive</strong> — staff chase down clients, follow up by phone/email, and track time by hand.</li>
        <li><strong>IOLTA compliance is unforgiving</strong> — using Stripe or PayPal can mean disbarment if fees touch trust funds.</li>
        <li>Current tools are either <strong>outdated and clunky (LawPay)</strong> or <strong>overbuilt for small firms (Clio)</strong>.</li>
      </ul>
      <p className="mt-4 text-lg italic font-bold text-gray-700 dark:text-gray-300">
        Lawyers spend hours on work that generates <strong>zero revenue and risks their license</strong>.
      </p>
    </section>
  );
}
