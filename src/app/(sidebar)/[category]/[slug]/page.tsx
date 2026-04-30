import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { NextPageLink } from "@/components/next-page-link";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import TableOfContents from "@/components/table-of-contents";
import { Video } from "@/components/video-player";
import { getLesson } from "@/data/lessons";
import { siteConfig } from "@/config/site";
import { getAllContent, getContent } from "@/lib/content";
import { getContentComponent } from "@/lib/content-server";
import { getArticleSchema } from "@/utils/article-schema";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { getFAQSchema, parseFAQFromMarkdown } from "@/utils/faq-schema";
import {
  getHowToSchema,
  parseHowToStepsFromMarkdown,
} from "@/utils/howto-schema";
import {
  mergeMetadata,
  normalizeKeywords,
} from "@/utils/frontmatter";
import {
  absoluteUrl,
  getLearningResourceSchema,
} from "@/utils/seo";
import fs from "fs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import path from "path";

export async function generateStaticParams() {
  const content = await getAllContent();

  return content.map((item) => ({
    category: item.category,
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const content = await getContent(slug);

  if (!content) return {};

  return mergeMetadata({
    fm: content,
    path: `/${category}/${slug}`,
    fallback: {
      title: content.title || "",
      description: content.description || "",
      keywords: normalizeKeywords(content.keywords),
    },
  });
}

// Add JSON-LD structured data
function generateContentStructuredData(content: any) {
  if (!content) return null;

  if (content.contentType === "lesson") {
    return getLearningResourceSchema({
      name: content.title || "",
      description: content.desc || content.description || "",
    });
  } else {
    return getArticleSchema({
      name: content.title || "",
      description: content.desc || content.description || "",
      url: absoluteUrl(content.href),
      category: content.category,
      tags: normalizeKeywords(content.tags),
      datePublished: content.createdAt,
      dateModified: content.updatedAt || content.createdAt,
      author: content.author ? {
        name: content.author,
        url: siteConfig.url,
        image: content.authorImage,
      } : undefined,
      image: content.image,
    });
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const content = await getContent(slug);

  if (!content) {
    notFound();
  }

  const isLesson = content.origin === "lessons";
  const Content = await getContentComponent(content.origin, content.folder, slug);

  // For breadcrumbs/navigation, we still need module context if it's a lesson
  const lessonData = isLesson ? await getLesson(slug) : null;
  const structuredData = generateContentStructuredData(content);

  const breadcrumbItems = [
    { name: "Home", url: absoluteUrl() },
    ...(isLesson && lessonData?.module
      ? [{ name: lessonData.module.title, url: absoluteUrl(`/#${lessonData.module.id}`) }]
      : []),
    { name: content.title || "", url: absoluteUrl(content.href) },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  // HowTo/FAQ schemas
  let howToSchema = null;
  let faqSchema = null;

  // 1. FAQ schema: Prioritize frontmatter array, then parse MDX
  if (content.faq && content.faq.length > 0) {
    faqSchema = getFAQSchema({
      faqs: content.faq,
      name: content.title || "",
      description: content.desc || content.description || "",
    });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      isLesson ? "src/data/lessons" : `src/data/articles/${category}`,
      `${slug}.mdx`,
    );
    const mdxContent = fs.readFileSync(filePath, "utf-8");
    
    const steps = parseHowToStepsFromMarkdown(mdxContent);
    if (steps.length >= 2) {
      howToSchema = getHowToSchema({
        name: content.title || "",
        description: content.desc || content.description || "",
        steps,
      });
    }

    // Only parse FAQ from markdown if not already found in frontmatter
    if (!faqSchema) {
      const faqs = parseFAQFromMarkdown(mdxContent);
      if (faqs.length > 0) {
        faqSchema = getFAQSchema({
          faqs,
          name: content.title || "",
          description: content.desc || content.description || "",
        });
      }
    }
    } catch (e: any) {
      if (e.code !== "ENOENT") {
        console.warn(`[Structured Data] Failed to parse MDX for ${category}/${slug}:`, e.message);
      }
    }

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          {isLesson && lessonData?.module && (
            <>
              <BreadcrumbSeparator className="max-md:hidden" />
              <Breadcrumb
                href={`/#${lessonData.module.id}`}
                className="max-md:hidden"
              >
                {lessonData.module.title}
              </Breadcrumb>
            </>
          )}
          <BreadcrumbSeparator />
          <Breadcrumb>{content.title}</Breadcrumb>
        </Breadcrumbs>
      }
    >
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Content area */}
      <div className="mx-auto flex max-w-2xl gap-x-10 py-10 sm:py-14 lg:max-w-5xl">
        <div className="w-full flex-1">
          <div id="content" className="prose">
            <Content />
          </div>
        </div>
        <div className="hidden w-66 lg:block">
          <TableOfContents contentId="content" />
        </div>
      </div>

      {/* Next page link - lessons only */}
      {isLesson && lessonData && (
        <div className="mx-auto max-w-4xl">
          <div className="mt-16 border-t border-gray-200 pt-8 dark:border-white/10">
            {lessonData.next ? (
              <NextPageLink
                title={lessonData.next.title}
                description={lessonData.next.description}
                href={`/${lessonData.next.category || "lessons"}/${lessonData.next.id}`}
              />
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You've reached the end of this module.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </SidebarLayoutContent>
  );
}
