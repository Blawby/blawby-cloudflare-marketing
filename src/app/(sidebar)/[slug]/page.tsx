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
import { getLesson, getLessonContent, getModules } from "@/data/lessons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { parseHowToStepsFromMarkdown, getHowToSchema } from "@/utils/howto-schema";
import { parseFAQFromMarkdown, getFAQSchema } from "@/utils/faq-schema";
import { getCourseSchema } from "@/utils/course-schema";
import fs from "fs";
import path from "path";

export async function generateStaticParams() {
  const modules = getModules();
  const validSlugs = modules.flatMap(module => 
    module.lessons.map(lesson => ({
      slug: lesson.id,
    }))
  );
  
  // Filter out any non-lesson slugs
  return validSlugs.filter(({ slug }) => 
    !slug.endsWith('.png') && 
    !slug.endsWith('.ico') && 
    !slug.endsWith('.webmanifest')
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  let lesson = await getLesson((await params).slug);
  if (!lesson) return {};

  return {
    title: `${lesson.title}`,
    description: lesson.description,
    openGraph: lesson.video
      ? {
          title: `${lesson.title}`,
          description: lesson.description,
          type: 'video.other',
          videos: [
            {
              url: lesson.video.url,
              type: 'video/mp4',
            },
          ],
          images: [
            {
              url: lesson.video.thumbnail,
              width: 1920,
              height: 1080,
              alt: lesson.title,
            },
          ],
        }
      : {
          title: `${lesson.title}`,
          description: lesson.description,
          type: 'article',
          images: [
            // You may want to provide a default image for articles
          ],
        },
    twitter: {
      card: lesson.video ? 'player' : 'summary',
      title: `${lesson.title}`,
      description: lesson.description,
      ...(lesson.video && {
        images: [lesson.video.thumbnail],
      }),
    },
    alternates: {
      canonical: `https://blawby.com/${lesson.id}`,
    },
  };
}

// Add JSON-LD structured data for the lesson
function generateLessonStructuredData(lesson: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.description,
    provider: {
      '@type': 'Organization',
      name: 'Blawby',
      logo: {
        '@type': 'ImageObject',
        url: 'https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public',
      },
    },
    learningResourceType: 'Lesson',
    educationalLevel: 'Beginner',
    audience: {
      '@type': 'Audience',
      audienceType: 'General public',
    },
  };

  if (lesson.video) {
    return {
      ...baseData,
      '@type': ['LearningResource', 'VideoObject'],
      thumbnailUrl: lesson.video.thumbnail,
      uploadDate: new Date().toISOString().split('T')[0],
      duration: `PT${Math.floor(lesson.video.duration / 60)}M${lesson.video.duration % 60}S`,
      contentUrl: lesson.video.url,
      embedUrl: lesson.video.url,
    };
  }

  return baseData;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  let slug = (await params).slug;
  let lesson = await getLesson(slug);

  if (!lesson) {
    notFound();
  }

  let Content = await getLessonContent(slug);
  const lessonStructuredData = generateLessonStructuredData(lesson);
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: lesson.module.title, url: `https://blawby.com/#${lesson.module.id}` },
    { name: lesson.title, url: `https://blawby.com/${lesson.id}` },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  // HowTo schema: parse steps from MDX file
  let howToSchema = null;
  let faqSchema = null;
  try {
    const lessonPath = path.join(process.cwd(), "src/data/lessons", `${slug}.mdx`);
    const mdxContent = fs.readFileSync(lessonPath, "utf-8");
    const steps = parseHowToStepsFromMarkdown(mdxContent);
    if (steps.length >= 2) {
      howToSchema = getHowToSchema({
        name: lesson.title,
        description: lesson.description,
        steps,
      });
    }
    // FAQ schema
    const faqs = parseFAQFromMarkdown(mdxContent);
    if (faqs.length > 0) {
      faqSchema = getFAQSchema({
        faqs,
        name: lesson.title,
        description: lesson.description,
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
          <Breadcrumb href={`/#${lesson.module.id}`} className="max-md:hidden">
            {lesson.module.title}
          </Breadcrumb>
          <BreadcrumbSeparator />
          <Breadcrumb>{lesson.title}</Breadcrumb>
        </Breadcrumbs>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lessonStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getCourseSchema({
              name: lesson.title,
              description: lesson.description,
              url: `https://blawby.com/${lesson.id}`,
            })
          ),
        }}
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
      <div className="mx-auto max-w-7xl">
        <div className="-mx-2 sm:-mx-4">
          {lesson.video && (
            <Video
              id="video"
              src={lesson.video.url}
              poster={lesson.video.thumbnail}
            />
          )}
        </div>
        <div className="mx-auto flex max-w-2xl gap-x-10 py-10 sm:py-14 lg:max-w-5xl">
          <div className="w-full flex-1">
            <div id="content" className="prose">
              <Content />
            </div>
            <div className="mt-16 border-t border-gray-200 pt-8 dark:border-white/10">
              {lesson.next ? (
                <NextPageLink
                  title={lesson.next.title}
                  description={lesson.next.description}
                  href={`/${lesson.next.id}`}
                />
              ) : (
                <NextPageLink
                  title="Payments with Blawby"
                  description="Learn how to accept and manage payments securely and compliantly."
                  href="/payments"
                />
              )}
            </div>
          </div>
          <div className="hidden w-66 lg:block">
            <TableOfContents contentId="content" />
          </div>
        </div>
      </div>
    </SidebarLayoutContent>
  );
}
