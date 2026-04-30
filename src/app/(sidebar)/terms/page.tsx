import { SidebarLayoutContent } from "@/components/sidebar-layout";
import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import TableOfContents from "@/components/table-of-contents";
import TermsContent from "@/data/legal/terms.mdx";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { absoluteUrl } from "@/utils/seo";
import type { Metadata } from "next";

import { mergeMetadata, parseFrontmatter } from "@/utils/frontmatter";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "src/data/legal/terms.mdx");
  const raw = fs.readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(raw);

  return mergeMetadata({
    fm,
    path: "/terms",
  });
}

export default function TermsPage() {
  const breadcrumbItems = [
    { name: "Home", url: absoluteUrl() },
    { name: "Terms of Service", url: absoluteUrl("/terms") },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb>Terms of Service</Breadcrumb>
        </Breadcrumbs>
      }
    >
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
