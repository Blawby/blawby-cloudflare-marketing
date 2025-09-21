import { ImageGallery } from "@/components/image-gallery";
import { PieChart } from "@/components/charts/pie-chart";

export function BusinessModel() {
  return (
    <section className="mb-16">
      <h2 id="business-model" className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Business Model</h2>
      <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-lg mb-6">
        <li>• SaaS: $40 / user / month</li>
        <li>• Payments: 1.4% fee per transaction</li>
        <li>• Social Impact: 50% discount for nonprofits</li>
        <li>• Expansion: AI legal support, multilingual, compliance</li>
      </ul>
      
      <div className="mb-6">
        <a 
          href="https://blawby.com/pricing"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
        >
          Pricing Details
        </a>
      </div>
      
      {/* Revenue Breakdown Pie Chart */}
      <div className="mt-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-950 dark:text-white mb-4">Revenue Model (Yr 2 Projection)</h3>
        <div className="flex justify-center">
          <PieChart
            id="revenue-breakdown-chart"
            data={[378000, 96000]}
            labels={["Payment Processing (1.4%)", "SaaS Subscriptions"]}
            colors={["var(--color-accent-400)", "var(--color-accent-300)"]}
            height={400}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          <p><strong>$378K</strong> from payments • <strong>$96K</strong> from subscriptions</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 id="product-interface-gallery" className="text-xl font-semibold text-gray-950 dark:text-white mb-4">Product Interface Gallery</h3>
        <ImageGallery
          images={[
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/5866096f-419e-4bec-dacf-c1b3f89caf00/public",
              alt: "Create Invoice Interface",
              caption: "Figure 2: Streamlined invoice creation interface with automated client and matter selection"
            },
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/6bc5a28b-692b-463a-f2ca-34acdf597200/public",
              alt: "Send Invoice Interface",
              caption: "Figure 3: Professional invoice delivery system with customizable messaging and secure payment links"
            },
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/ae8ad36c-abeb-4a5b-7ae1-a5f782ba1700/public",
              alt: "Invoice List Interface",
              caption: "Figure 4: Comprehensive invoice management dashboard with real-time payment status tracking"
            },
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/3b389c0d-c76e-49c1-c826-ac76d9612000/public",
              alt: "Payment Portal Interface",
              caption: "Figure 5: Client-facing payment portal with secure IOLTA-compliant transaction processing"
            }
          ]}
          columns={2}
        />
      </div>
    </section>
  );
}
