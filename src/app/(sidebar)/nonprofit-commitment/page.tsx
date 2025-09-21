import { SidebarLayoutContent } from "@/components/sidebar-layout";
import TableOfContents from "@/components/table-of-contents";
import NonprofitCommitmentContent from "@/data/pages/nonprofit-commitment.mdx";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nonprofit Commitment",
  description:
    "Dedicated to reducing digital barriers for nonprofit legal aid organizations through open-source development and affordable tools.",
  alternates: { canonical: "https://blawby.com/nonprofit-commitment" },
};

export default function NonprofitCommitmentPage() {
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    {
      name: "Nonprofit Commitment",
      url: "https://blawby.com/nonprofit-commitment",
    },
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
            <NonprofitCommitmentContent />
          </div>
        </div>
        <div className="hidden w-66 lg:block">
          <TableOfContents contentId="content" />
        </div>
      </div>
    </SidebarLayoutContent>
  );
}
