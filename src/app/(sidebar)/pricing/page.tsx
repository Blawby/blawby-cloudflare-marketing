import { SidebarLayoutContent } from "@/components/sidebar-layout";
import PricingContent from "@/data/pages/pricing.mdx";
import TableOfContents from "@/components/table-of-contents";
import type { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Access a complete payments platform with simple, pay-as-you-go pricing. No setup fees, or hidden fees.",
  alternates: { canonical: "https://blawby.com/pricing" },
};

export default function PrivacyPage() {
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: "Pricing", url: "https://blawby.com/pricing" },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <SidebarLayoutContent breadcrumbs={null}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto flex max-w-2xl gap-x-10 py-10 sm:py-14 lg:max-w-5xl">
        <div className="w-full flex-1">
          <div id="content" className="prose">
            <PricingContent />
          </div>
        </div>
        <div className="hidden w-66 lg:block">
          <TableOfContents contentId="content" />
        </div>
      </div>
    </SidebarLayoutContent>
  );
} 