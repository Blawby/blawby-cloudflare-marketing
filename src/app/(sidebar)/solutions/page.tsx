import { SidebarLayoutContent } from "@/components/sidebar-layout";
import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import TableOfContents from "@/components/table-of-contents";
import SolutionsContent from "@/data/pages/solutions.mdx";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { absoluteUrl } from "@/utils/seo";
import type { Metadata } from "next";

import { mergeMetadata, parseFrontmatter } from "@/utils/frontmatter";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "src/data/pages/solutions.mdx"),
    "utf-8",
  );
  const fm = parseFrontmatter(raw);

  return mergeMetadata({
    fm,
    path: "/solutions",
  });
}

export default function SolutionsPage() {
  const breadcrumbItems = [
    { name: "Home", url: absoluteUrl() },
    { name: "Solutions", url: absoluteUrl("/solutions") },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb>Solutions</Breadcrumb>
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
            <SolutionsContent />
          </div>
        </div>
        <div className="hidden w-66 lg:block">
          <TableOfContents contentId="content" />
        </div>
      </div>
    </SidebarLayoutContent>
  );
}
