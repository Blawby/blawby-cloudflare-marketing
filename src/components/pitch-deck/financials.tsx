import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { LineChart } from "@/components/charts/line-chart";

export function Financials() {
  return (
    <section className="mb-16">
      <h2
        id="financials-use-of-funds"
        className="mb-6 text-3xl font-bold text-gray-950 dark:text-white"
      >
        Financials & Use of Funds
      </h2>

      {/* Combined Financial Projections Chart */}
      <div className="mb-8">
        <h4 className="mb-4 text-2xl font-semibold text-gray-950 dark:text-white">
          Financial Projections & Runway Analysis
        </h4>
        <LineChart
          id="financial-projections-chart"
          series={[
            {
              name: "Revenue",
              data: [173, 474, 800, 1200, 1600],
              color: "var(--chart-primary)",
            },
            {
              name: "Annual Burn (OpEx)",
              data: [220, 260, 300, 360, 420],
              color: "var(--chart-danger)",
            },
            {
              name: "Cash Balance",
              data: [84, 108, 288, 648, 1188],
              color: "var(--chart-success)",
            },
          ]}
          categories={["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]}
          height={380}
          yAxisLabel="Amount ($k)"
        />
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          Revenue grows 174% in Year 2, reaching $1.6M by Year 5. Controlled burn scaling with team growth ensures 16+ months runway and positive cash flow from Year 3.
        </p>
      </div>


      {/* Revenue Sources Bar Chart */}
      <div className="mt-8">
        <h4 className="mb-4 text-2xl font-semibold text-gray-950 dark:text-white">
          Revenue Sources Comparison
        </h4>
        <BarChart
          id="revenue-sources-chart"
          series={[
            {
              name: "Payment Revenue (1.4%)",
              data: [134.4, 378],
              color: "var(--chart-primary)",
            },
            {
              name: "SaaS Revenue",
              data: [38.4, 96],
              color: "var(--chart-secondary)",
            },
          ]}
          categories={["Year 1", "Year 2"]}
          height={350}
          stacked={true}
        />
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          Payment processing drives 78% of revenue in Year 1, scaling to 80% by Year 2. SaaS subscriptions provide predictable recurring revenue foundation.
        </p>
      </div>

      {/* Use of Funds Pie Chart */}
      <div className="mt-8">
        <h4 className="mb-4 text-2xl font-semibold text-gray-950 dark:text-white">
          Use of Funds ($200k Investment)
        </h4>
        <div className="flex justify-center">
          <PieChart
            id="use-of-funds-chart"
            data={[74, 50, 30, 20, 16, 10]}
            labels={[
              "Key Personnel",
              "Growth & Acquisition",
              "Product Development",
              "Infrastructure & Tools",
              "Admin & Legal",
              "Contingency",
            ]}
            colors={[
              "var(--chart-primary)",    // Key Personnel
              "var(--chart-secondary)",  // Growth & Acquisition
              "var(--chart-success)",    // Product Development
              "var(--chart-info)",       // Infrastructure & Tools
              "var(--chart-warning)",    // Admin & Legal
              "var(--chart-purple)",     // Contingency
            ]}
            height={400}
          />
        </div>
      </div>
    </section>
  );
}
