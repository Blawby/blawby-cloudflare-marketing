import { ComparisonSection } from "@/components/home/comparison-section";
import { ComplianceSection } from "@/components/home/compliance-section";
import { DocsHub } from "@/components/home/docs-hub";
import { FAQSection } from "@/components/home/faq-section";
import { FeatureCards } from "@/components/home/feature-cards";
import { FinalCTA } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import "@/components/home/homepage.css";
import { PricingSection } from "@/components/home/pricing-section";
import { ProblemSection } from "@/components/home/problem-section";
import { WorkflowDetail } from "@/components/home/workflow-detail";
import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/config/site";
import { HOME_FAQS } from "@/data/home/faq";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { getFAQSchema } from "@/utils/faq-schema";
import { absoluteUrl, getSoftwareApplicationSchema } from "@/utils/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blawby - Compliant Credit Card Payments for Legal Practices",
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function Page() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: absoluteUrl() },
  ]);
  const faqSchema = getFAQSchema({
    faqs: HOME_FAQS.map((f) => ({ question: f.question, answer: f.answer })),
    name: "Blawby — Frequently Asked Questions",
    description: "Common questions about Blawby for legal practices.",
  });

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getSoftwareApplicationSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="home">
        <Hero />
        <ProblemSection />
        <WorkflowDetail />
        <FeatureCards />
        <ComplianceSection />
        <ComparisonSection />
        <PricingSection />
        <DocsHub />
        <FAQSection />
        <FinalCTA />
      </main>
    </>
  );
}
