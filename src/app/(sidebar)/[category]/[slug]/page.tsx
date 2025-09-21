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
import { getArticle, getArticleContent, getArticles } from "@/data/articles";
import { getCategoryById } from "@/data/categories";
import { getLesson, getLessonContent, getModules } from "@/data/lessons";
import { getArticleSchema } from "@/utils/article-schema";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { getCourseSchema } from "@/utils/course-schema";
import { getFAQSchema, parseFAQFromMarkdown } from "@/utils/faq-schema";
import {
  getHowToSchema,
  parseHowToStepsFromMarkdown,
} from "@/utils/howto-schema";
import fs from "fs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import path from "path";

export async function generateStaticParams() {
  const modules = getModules();
  const articles = getArticles();

  // Get lesson slugs from modules with "lessons" category
  const lessonSlugs = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      category: lesson.category || "lessons",
      slug: lesson.id,
    })),
  );

  // Get article slugs with their categories
  const articleSlugs = articles.map((article) => ({
    category: article.category,
    slug: article.id,
  }));

  // Combine all slugs
  const allSlugs = [...lessonSlugs, ...articleSlugs];

  // Filter out any non-content slugs
  return allSlugs.filter(
    ({ slug }) =>
      !slug.endsWith(".png") &&
      !slug.endsWith(".ico") &&
      !slug.endsWith(".webmanifest"),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  let { category, slug } = await params;
  let lesson = await getLesson(slug);
  let article = await getArticle(slug);

  if (!lesson && !article) return {};

  const content = lesson || article;
  const isArticle = !!article;

  if (!content) return {};

  return {
    title: `${content.title}`,
    description: content.description,
    openGraph: content.video
      ? {
          title: `${content.title}`,
          description: content.description,
          type: "video.other",
          videos: [
            {
              url: content.video.url,
              type: "video/mp4",
            },
          ],
          images: [
            {
              url: content.video.thumbnail,
              width: 1920,
              height: 1080,
              alt: content.title,
            },
          ],
        }
      : {
          title: `${content.title}`,
          description: content.description,
          type: "article",
          images: [
            {
              url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
              width: 1200,
              height: 630,
              alt: "Blawby - Compliant Credit Card Payments for Legal Practices",
            },
          ],
        },
    twitter: {
      card: content.video ? "player" : "summary_large_image",
      title: `${content.title}`,
      description: content.description,
      images: content.video
        ? [content.video.thumbnail]
        : [
            "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
          ],
    },
    alternates: {
      canonical: `https://blawby.com/${category}/${slug}`,
    },
  };
}

// Add JSON-LD structured data for the lesson
function generateLessonStructuredData(lesson: any, category: string) {
  // Use Course schema for lessons, Article schema for guides
  if (lesson.contentType === "lesson") {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: lesson.title,
      description: lesson.description,
      provider: {
        "@type": "Organization",
        name: "Blawby",
        logo: {
          "@type": "ImageObject",
          url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
        },
      },
      learningResourceType: "Lesson",
      educationalLevel: "Beginner",
      audience: {
        "@type": "Audience",
        audienceType: "General public",
      },
    };

    if (lesson.video) {
      return {
        ...baseData,
        "@type": ["LearningResource", "VideoObject"],
        thumbnailUrl: lesson.video.thumbnail,
        uploadDate: new Date().toISOString().split("T")[0],
        duration: `PT${Math.floor(lesson.video.duration / 60)}M${lesson.video.duration % 60}S`,
        contentUrl: lesson.video.url,
        embedUrl: lesson.video.url,
      };
    }

    return baseData;
  } else {
    // Use Article schema for guides and articles
    const categoryData = lesson.category
      ? getCategoryById(lesson.category)
      : undefined;
    return getArticleSchema({
      name: lesson.title,
      description: lesson.description,
      url: `https://blawby.com/${category}/${lesson.id}`,
      category: categoryData?.name,
      tags: lesson.tags,
      datePublished: lesson.datePublished,
      dateModified: lesson.dateModified,
      author: lesson.author,
      image: lesson.image,
    });
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  let { category, slug } = await params;

  // Try to find content in both lessons and articles
  let lesson = await getLesson(slug);
  let article = await getArticle(slug);

  if (!lesson && !article) {
    notFound();
  }

  // Use lesson or article data
  const content = lesson || article;
  const isArticle = !!article;

  if (!content) {
    notFound();
  }

  let Content;
  if (isArticle) {
    Content = await getArticleContent(category, slug);
  } else {
    Content = await getLessonContent(slug);
  }

  const lessonStructuredData = generateLessonStructuredData(content, category);

  // Handle breadcrumbs differently for articles vs lessons
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    {
      name: isArticle ? "Articles" : lesson?.module?.title || "Content",
      url: isArticle
        ? "https://blawby.com/articles"
        : `https://blawby.com/#${lesson?.module?.id || ""}`,
    },
    { name: content.title, url: `https://blawby.com/${category}/${slug}` },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  // HowTo schema: parse steps from MDX file
  let howToSchema = null;
  let faqSchema = null;
  try {
    // Determine the correct file path based on content type
    let contentPath: string;
    if (
      isArticle ||
      content.contentType === "guide" ||
      content.contentType === "article"
    ) {
      contentPath = path.join(
        process.cwd(),
        "src/data/articles",
        `${slug}.mdx`,
      );
    } else {
      contentPath = path.join(process.cwd(), "src/data/lessons", `${slug}.mdx`);
    }

    const mdxContent = fs.readFileSync(contentPath, "utf-8");
    const steps = parseHowToStepsFromMarkdown(mdxContent);
    if (steps.length >= 2) {
      howToSchema = getHowToSchema({
        name: content.title,
        description: content.description,
        steps,
      });
    }
    // FAQ schema
    const faqs = parseFAQFromMarkdown(mdxContent);
    if (faqs.length > 0) {
      faqSchema = getFAQSchema({
        faqs,
        name: content.title,
        description: content.description,
      });
    }
  } catch (e) {
    // Ignore if file not found or parse error
  }

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator className="max-md:hidden" />
          <Breadcrumb
            href={isArticle ? "/articles" : `/#${lesson?.module?.id || ""}`}
            className="max-md:hidden"
          >
            {isArticle ? "Articles" : lesson?.module?.title || "Content"}
          </Breadcrumb>
          <BreadcrumbSeparator />
          <Breadcrumb>{content.title}</Breadcrumb>
        </Breadcrumbs>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lessonStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {!isArticle && content.contentType === "lesson" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              getCourseSchema({
                name: content.title,
                description: content.description,
                url: `https://blawby.com/${category}/${slug}`,
              }),
            ),
          }}
        />
      )}
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

      {/* Video section */}
      <div className="mx-auto max-w-7xl">
        <div className="-mx-2 sm:-mx-4">
          {content.video && (
            <Video
              id="video"
              src={content.video.url}
              poster={content.video.thumbnail}
            />
          )}
        </div>
      </div>

      {/* Content section with sidebar layout */}
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

      {/* Next page link - only for lessons */}
      {!isArticle && lesson && (
        <div className="mx-auto max-w-4xl">
          <div className="mt-16 border-t border-gray-200 pt-8 dark:border-white/10">
            {lesson.next ? (
              <NextPageLink
                title={lesson.next.title}
                description={lesson.next.description}
                href={`/${lesson.next.category || "lessons"}/${lesson.next.id}`}
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
