import { ImageGallery } from "@/components/image-gallery";
import { Button } from "@/components/button";
import {
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export function ProductFeatures() {
  return (
    <section className="mb-16">
      <h2
        id="product-features"
        className="mb-6 text-3xl font-bold text-gray-950 dark:text-white"
      >
        Product Features
      </h2>
      <ul className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
        <li className="flex items-start gap-3">
          <CreditCardIcon className="h-6 w-6 shrink-0 text-gray-700 dark:text-gray-300 " />
          <div>
            <strong>Payments & Billing:</strong> Seamless invoicing, secure client
            payment links, and highly competitive 1.4% transaction fees with{" "}
            <a
              href="/compliance/iolta-compliance"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              full IOLTA compliance
            </a>
            .
          </div>
        </li>
        <li className="flex items-start gap-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6 shrink-0 text-gray-700 dark:text-gray-300 " />
          <div>
            <strong>AI Intake Agent:</strong> Intelligent, conversational intake
            capturing critical legal context, classifying matters, and
            facilitating immediate fee capture.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-gray-700 dark:text-gray-300 " />
          <div>
            <strong>Automated Escalation:</strong> Proactively flags sensitive or
            complex matters for immediate human review, ensuring compliance and
            quality.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <Cog6ToothIcon className="h-6 w-6 shrink-0 text-gray-700 dark:text-gray-300 " />
          <div>
            <strong>Configurable Admin Panel:</strong> Empowering firms to
            customize services, pricing, jurisdictions, and branding with
            unparalleled ease and speed.
          </div>
        </li>
      </ul>

      <div className="mt-6">
        <a 
          href="https://github.com/Blawby/preact-cloudflare-intake-chatbot/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button>
            Open‑Source GitHub
          </Button>
        </a>
      </div>

      <div className="mt-8">
        <h3
          id="ai-intake-interface"
          className="mb-4 text-2xl font-semibold text-gray-950 dark:text-white"
        >
          AI Intake Interface
        </h3>
        <ImageGallery
          images={[
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/cf0fdc1f-4662-4aec-3277-82acc7561400/public",
              alt: "AI Intake Form Interface",
              caption:
                "Figure 1: AI-powered intake chatbot interface showing intelligent conversation flow and matter classification",
            },
          ]}
          columns={1}
        />
      </div>
    </section>
  );
}
