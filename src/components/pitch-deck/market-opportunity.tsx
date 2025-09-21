"use client";

import { FunnelChart } from "@/components/charts/funnel-chart";
import { LineChart } from "@/components/charts/line-chart";

export function MarketOpportunity() {
  return (
    <section className="mb-16">
      <h2
        id="market-opportunity"
        className="mb-6 text-3xl font-bold text-gray-950 dark:text-white"
      >
        Market Opportunity
      </h2>
      <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
        <li>$437B U.S. Legal Services Market</li>
        <li>70% of attorneys in small firms</li>
        <li>10%+ CAGR in legal tech adoption</li>
        <li>AI tailwinds accelerating automation demand</li>
      </ul>

      {/* TAM/SAM/SOM Funnel Chart */}
      <div className="mt-8 mb-8">
        <h3 className="mb-6 text-2xl font-semibold text-gray-950 dark:text-white">
          Market Size Analysis
        </h3>
        <div className="flex w-full justify-center">
          <FunnelChart
            id="tam-sam-som-funnel"
            series={[
              { name: "TAM", value: 437, color: "var(--color-accent-400)" },
              { name: "SAM", value: 30.6, color: "var(--color-accent-300)" },
              { name: "SOM", value: 0.5, color: "var(--color-accent-200)" },
            ]}
            height={400}
          />
        </div>
        <div className="mt-4 text-center text-base text-gray-600 dark:text-gray-400">
          <p>
            <strong>TAM:</strong> $437B • <strong>SAM:</strong> $30.6B •{" "}
            <strong>SOM:</strong> $500M
          </p>
        </div>
      </div>

      {/* Why Now: Revenue Impact */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Revenue Impact — With Blawby vs Status Quo
        </h3>
        <ul className="mb-6 space-y-3 text-lg text-gray-700 dark:text-gray-300">
          <li><strong>With Blawby:</strong> small firms recover <strong>~21% more net revenue by Year 3</strong> vs status quo.</li>
          <li><strong>For a 5-lawyer firm:</strong> that's <strong>$315k+ per year recaptured</strong> instead of lost to admin.</li>
        </ul>
        <LineChart
          id="adoption-vs-manual"
          series={[
            {
              name: "Status Quo",
              data: [100, 101, 102],
              color: "var(--color-accent-600)",
            },
            {
              name: "With Blawby (Revenue Recaptured)",
              data: [100, 109, 121],
              color: "var(--color-accent-500)",
            },
          ]}
          categories={["Year 1", "Year 2", "Year 3"]}
          height={300}
          yAxisLabel="Index (100 = current net revenue)"
        />
      </div>
    </section>
  );
}
