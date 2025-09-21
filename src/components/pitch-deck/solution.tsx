import { PlayIcon } from "@/icons/play-icon";

export function Solution() {
  return (
    <section className="mb-16">
      <h2
        id="solution"
        className="mb-6 text-3xl font-bold text-gray-950 dark:text-white"
      >
        Solution
      </h2>
      <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Blawby: The modern operating system for small law firms.
      </h3>
      <ul className="mb-6 space-y-3 text-lg text-gray-700 dark:text-gray-300">
        <li><strong>IOLTA-compliant payments</strong> that protect client trust funds and attorney licenses.</li>
        <li><strong>AI-driven intake, scheduling, and follow-up</strong> that replaces manual staff work.</li>
        <li><strong>Automated retainer management & billing</strong> — no more paper checks or spreadsheet chasing.</li>
        <li><strong>Lightweight matter management</strong> that small firms actually adopt.</li>
      </ul>
      <p className="mt-4 text-lg italic font-bold text-gray-700 dark:text-gray-300">
        Blawby frees lawyers from admin so they can <strong>bill more, stress less, and stay compliant</strong>.
      </p>

      <div className="mt-6">
        <a
          href="https://ai.blawby.com/?teamId=north-carolina-legal-services&position=inline"
          className="inline-flex items-center gap-x-2 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <PlayIcon className="fill-current" />
          Live AI Intake Demo
        </a>
      </div>
    </section>
  );
}
