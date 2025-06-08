import { SidebarLayoutContent } from "@/components/sidebar-layout";
import PrivacyContent from "@/data/legal/privacy.mdx";
import TableOfContents from "@/components/table-of-contents";
import type { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";

export const metadata: Metadata = {
  title: "Privacy Policy - Blawby",
  description: "Read the Blawby Privacy Policy to learn how we handle your data.",
  alternates: { canonical: "https://blawby.com/privacy" },
};

export default function PrivacyPage() {
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: "Privacy Policy", url: "https://blawby.com/privacy" },
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
            <PrivacyContent />
          </div>
        </div>
        <div className="hidden w-66 lg:block">
          <TableOfContents contentId="content" />
        </div>
      </div>
    </SidebarLayoutContent>
  );
} 