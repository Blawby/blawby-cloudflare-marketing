export function CompetitiveLandscape() {
  return (
    <section className="mb-16">
      <h2
        id="competitive-landscape"
        className="mb-6 text-3xl font-bold text-gray-950 dark:text-white"
      >
        Competitive Landscape
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="border border-gray-300 px-4 py-2 text-left text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                Product
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                Strengths
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                Weaknesses
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                Blawby's Advantage
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                Clio
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Robust feature set
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Complex, limited AI functionality
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                AI intake + modern UX tailored to small firms
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                LawPay
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Trusted for legal payments
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                No intake, matter, or scheduling tools
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Unified platform from intake to payment
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-lg font-semibold text-gray-950 dark:border-gray-600 dark:text-white">
                Rocket Matter
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Legal-specific workflows
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Outdated interface, expensive tiers
              </td>
              <td className="border border-gray-300 px-4 py-2 text-lg text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Competitive pricing + clean, efficient UX
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
        Blawby stands out by delivering a lightweight, purpose-built, and
        vertical-first solution that combines modern UX with deep legal-specific
        automation, offering unparalleled efficiency and ease of adoption.
      </p>
      {/* TODO: Insert visual: Competitive matrix (Adoption vs Features) */}
    </section>
  );
}
