import { ImageGallery } from "@/components/image-gallery";

export function ProductFeatures() {
  return (
    <section className="mb-16">
      <h2 id="product-features" className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Product Features</h2>
      <ul className="space-y-4 text-gray-700 dark:text-gray-300">
        <li>
            <strong>Payments & Billing:</strong> Seamless invoicing, secure client payment links, and highly competitive 1.4% transaction fees with <a href="/compliance/iolta-compliance" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">full IOLTA compliance</a>.
        </li>
        <li>
            <strong>AI Intake Agent:</strong> Intelligent, conversational intake capturing critical legal context, classifying matters, and facilitating immediate fee capture.
        </li>
        <li>
            <strong>Automated Escalation:</strong> Proactively flags sensitive or complex matters for immediate human review, ensuring compliance and quality.
        </li>
        <li>
            <strong>Configurable Admin Panel:</strong> Empowering firms to customize services, pricing, jurisdictions, and branding with unparalleled ease and speed.
        </li>
      </ul>
      
      <div className="mt-6">
        <a 
          href="https://github.com/Blawby/preact-cloudflare-intake-chatbot/"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
        >
          Open‑Source GitHub
        </a>
      </div>
      
      <div className="mt-8">
        <h3 id="ai-intake-interface" className="text-2xl font-semibold text-gray-950 dark:text-white mb-4">AI Intake Interface</h3>
        <ImageGallery
          images={[
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/cf0fdc1f-4662-4aec-3277-82acc7561400/public",
              alt: "AI Intake Form Interface",
              caption: "Figure 1: AI-powered intake chatbot interface showing intelligent conversation flow and matter classification"
            }
          ]}
          columns={1}
        />
      </div>
    </section>
  );
}
