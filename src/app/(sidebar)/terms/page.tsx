import { SidebarLayoutContent } from "@/components/sidebar-layout";
import TermsContent from "@/data/legal/terms.mdx";
import TableOfContents from "@/components/table-of-contents";
import type { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Blawby Terms of Service to understand your rights and responsibilities.",
  alternates: { canonical: "https://blawby.com/terms" },
};

export default function TermsPage() {
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: "Terms of Service", url: "https://blawby.com/terms" },
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
            <TermsContent />
          </div>
        </div>
        <div className="hidden w-66 lg:block">
          <TableOfContents contentId="content" />
        </div>
      </div>
    </SidebarLayoutContent>
  );
} 