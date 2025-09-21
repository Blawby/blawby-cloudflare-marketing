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

      {/* Why Now: Dual Adoption vs Manual Processes */}
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-semibold text-gray-950 dark:text-white">
          Why Now: Legal Tech Adoption vs Manual Processes
        </h3>
        <LineChart
          id="adoption-vs-manual"
          series={[
            {
              name: "Legal Tech/AI Adoption (%)",
              data: [15, 18, 22, 28, 35, 42, 50, 58, 66, 74],
              color: "var(--color-accent-500)",
            },
            {
              name: "Manual/Legacy Processes (%)",
              data: [85, 80, 75, 68, 62, 55, 48, 42, 35, 28],
              color: "var(--color-accent-600)",
            },
          ]}
          categories={[
            "2020",
            "2021",
            "2022",
            "2023",
            "2024",
            "2025",
            "2026",
            "2027",
            "2028",
            "2029",
          ]}
          height={300}
        />
        <div className="mt-4 text-center text-base text-gray-600 dark:text-gray-400">
          <p>
            <strong>Market Shift:</strong> AI adoption rising • Manual processes
            declining • 10%+ CAGR
          </p>
        </div>
      </div>
    </section>
  );
}
