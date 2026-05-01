import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { CenteredPageLayout } from "@/components/centered-layout";
import { NextPageLink } from "@/components/next-page-link";
import { TimestampButton, Video } from "@/components/video-player";
import {
  getInterview,
  getInterviews,
  getInterviewTranscript,
} from "@/data/interviews";
import { ClockIcon } from "@/icons/clock-icon";
import { absoluteUrl, getVideoSchema } from "@/utils/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const interviewsEnabled = process.env.SHOW_INTERVIEWS === "true";

function formatDuration(seconds: number): string {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);

  return h > 0 ? (m > 0 ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
}

export async function generateStaticParams() {
  const interviews = getInterviews();
  return interviews.map((interview) => ({
    slug: interview.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!interviewsEnabled) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  let interview = await getInterview((await params).slug);
  if (!interview) return {};

  return {
    title: `Interview with ${interview.name}`,
    description: interview.subtitle,
    openGraph: {
      title: `Interview with ${interview.name}`,
      description: interview.subtitle,
      type: "video.other",
      videos: [
        {
          url: interview.video.hd,
          type: "video/mp4",
        },
      ],
      images: [
        {
          url: interview.video.thumbnail,
          width: 1920,
          height: 1080,
          alt: `Interview with ${interview.name}`,
        },
      ],
    },
    twitter: {
      card: "player",
      title: `Interview with ${interview.name}`,
      description: interview.subtitle,
      images: [interview.video.thumbnail],
    },
    alternates: {
      canonical: absoluteUrl(`/interviews/${interview.id}`),
    },
  };
}

// Add JSON-LD structured data for the video
function generateVideoStructuredData(interview: any) {
  return {
    ...getVideoSchema({
      name: `Interview with ${interview.name}`,
      description: interview.subtitle,
      thumbnailUrl: interview.video.thumbnail,
      duration: interview.video.duration,
      contentUrl: interview.video.hd,
    }),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: 0,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!interviewsEnabled) {
    notFound();
  }
  let interview = await getInterview((await params).slug);

  if (!interview) {
    notFound();
  }

  let transcript = await getInterviewTranscript(interview.id);
  const videoStructuredData = generateVideoStructuredData(interview);

  return (
    <CenteredPageLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb href="/interviews">Interviews</Breadcrumb>
          <BreadcrumbSeparator />
          <Breadcrumb>{interview.name}</Breadcrumb>
        </Breadcrumbs>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(videoStructuredData),
        }}
      />
      <div className="-mx-2 sm:-mx-4">
        <Video
          id="video"
          src={interview.video.hd}
          poster={interview.video.thumbnail}
        />
      </div>
      <div className="mx-auto max-w-2xl py-14">
        <div className="space-y-16">
          <div className="space-y-6">
            <hgroup>
              <p className="text-sm/7 font-semibold text-gray-500">Interview</p>
              <h1 className="text-3xl tracking-tight text-gray-950 dark:text-white">
                {interview.name}
              </h1>
            </hgroup>
            <p className="text-base text-base/7">{interview.intro}</p>
            <div className="flex items-center gap-x-2 text-sm/7 font-semibold text-gray-950 dark:text-white">
              <ClockIcon className="stroke-gray-950/40 dark:stroke-white/40" />
              <span>{formatDuration(interview.video.duration)}</span>
            </div>
          </div>
          <div>
            <h2 className="border-b border-gray-950/5 pb-4 text-2xl font-medium tracking-tight text-gray-950 dark:border-white/10 dark:text-white">
              Chapters
            </h2>
            <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-4">
              {interview.chapters.map(({ start, title }) => (
                <div
                  key={start}
                  className="col-span-2 grid grid-cols-subgrid items-baseline"
                >
                  <TimestampButton
                    start={start}
                    videoId="video"
                    className="justify-self-end"
                  />
                  <p className="text-sm/7 font-semibold text-gray-950 dark:text-white">
                    {title}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="border-b border-gray-950/5 pb-4 text-2xl font-medium tracking-tight text-gray-950 dark:border-white/10 dark:text-white">
              Transcript
            </h2>
            <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-8">
              {transcript.map(({ start, speaker, text }) => (
                <div
                  key={start}
                  className="col-span-2 grid grid-cols-subgrid items-baseline"
                >
                  <TimestampButton
                    start={start}
                    videoId="video"
                    className="justify-self-end"
                  />
                  <div>
                    <p className="text-sm/7 font-semibold text-gray-950 dark:text-white">
                      {speaker}
                    </p>
                    {text.map((p, index) => (
                      <p
                        key={index}
                        className="mt-2 text-sm/7 whitespace-pre-wrap text-gray-700 dark:text-gray-400"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-200 pt-8 dark:border-white/10">
          {interview.next ? (
            <NextPageLink
              title={interview.next.name}
              description={interview.next.subtitle}
              href={`/interviews/${interview.next.id}`}
            />
          ) : (
            <NextPageLink
              title="Resources"
              description="Before you decide where to go, you need to know where you're starting from."
              href="/resources"
            />
          )}
        </div>
      </div>
    </CenteredPageLayout>
  );
}
