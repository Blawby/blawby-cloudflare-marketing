import { SidebarLayoutContent } from "@/components/sidebar-layout";
import TableOfContents from "@/components/table-of-contents";
import PrivacyContent from "@/data/legal/privacy.mdx";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { absoluteUrl } from "@/utils/seo";
import type { Metadata } from "next";

import { mergeMetadata, parseFrontmatter } from "@/utils/frontmatter";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "src/data/legal/privacy.mdx");
  const raw = require("fs").readFileSync(filePath, "utf-8");
  const fm = await parseFrontmatter(raw);

  return mergeMetadata({
    fm,
    path: "/privacy",
  });
}

export default function PrivacyPage() {
  const breadcrumbItems = [
    { name: "Home", url: absoluteUrl() },
    { name: "Privacy Policy", url: absoluteUrl("/privacy") },
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
