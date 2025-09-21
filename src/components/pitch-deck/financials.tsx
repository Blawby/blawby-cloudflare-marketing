import { PieChart } from "@/components/charts/pie-chart";
import { BarChart } from "@/components/charts/bar-chart";

export function Financials() {
  return (
    <section className="mb-16">
      <h2 id="financials-use-of-funds" className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Financials & Use of Funds</h2>
      
      <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-lg mb-8">
        <li>• <strong>Projected Burn:</strong> ~$145k annually</li>
        <li>• <strong>Revenue Ramp:</strong> $173k (Yr 1) → $474k (Yr 2)</li>
        <li>• <strong>Revenue Mix:</strong> SaaS + 1.4% payments</li>
      </ul>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-4">Use of Funds ($200k raise):</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li>• 37% Key Personnel</li>
          <li>• 25% Growth & Acquisition</li>
          <li>• 15% Product Development</li>
          <li>• 10% Infrastructure & Tools</li>
          <li>• 8% Admin & Legal</li>
          <li>• 5% Contingency</li>
        </ul>
      </div>
      
      {/* Revenue Sources Bar Chart */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-950 dark:text-white mb-4">Revenue Sources Comparison</h4>
        <BarChart
          id="revenue-sources-chart"
          series={[
            {
              name: "Payment Revenue (1.4%)",
              data: [134400, 378000],
              color: "var(--color-accent-400)",
            },
            {
              name: "SaaS Revenue",
              data: [38400, 96000],
              color: "var(--color-accent-300)",
            },
          ]}
          categories={["Year 1", "Year 2"]}
          height={350}
          stacked={true}
        />
      </div>
      
      {/* Use of Funds Pie Chart */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-950 dark:text-white mb-4">Use of Funds ($200k Investment)</h4>
        <div className="flex justify-center">
          <PieChart
            id="use-of-funds-chart"
            data={[74, 50, 30, 20, 16, 10]}
            labels={["Key Personnel", "Growth & Acquisition", "Product Development", "Infrastructure & Tools", "Admin & Legal", "Contingency"]}
            colors={["var(--color-accent-400)", "var(--color-accent-200)", "var(--color-accent-300)", "var(--color-accent-600)", "var(--color-accent-500)", "var(--color-accent-700)"]}
            height={400}
          />
        </div>
      </div>
    </section>
  );
}
