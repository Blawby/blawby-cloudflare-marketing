import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { Button } from "@/components/button";
import { ContentLink } from "@/components/content-link";
import { CTASection } from "@/components/cta-section";
import { PageSection } from "@/components/page-section";
import { Pricing } from "@/components/pricing";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import { siteConfig } from "@/config/site";
import { getModules, type Module } from "@/data/lessons";
import { BookIcon } from "@/icons/book-icon";
import { ClockIcon } from "@/icons/clock-icon";
import { LessonsIcon } from "@/icons/lessons-icon";
import { PlayIcon } from "@/icons/play-icon";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { getCoursePathwaySchema } from "@/utils/course-schema";
import { absoluteUrl, getSoftwareApplicationSchema } from "@/utils/seo";
import fs from "fs";
import type { Metadata } from "next";
import path from "path";

export const metadata: Metadata = {
  title: "Blawby Documentation | Legal Payments & Intake",
  description:
    "Master your legal practice with Blawby's step-by-step guides. Learn how to set up compliant payments, automate client intake, and streamline firm operations.",
  alternates: {
    canonical: absoluteUrl("/docs"),
  },
};

function formatDuration(seconds: number): string {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);

  return h > 0 ? (m > 0 ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
}

function getLessonReadingDuration(slug: string): number {
  try {
    const filePath = path.join(
      process.cwd(),
      "src/data/lessons",
      `${slug}.mdx`,
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    // 200 words per minute reading speed
    return Math.ceil((wordCount / 200) * 60); // seconds
  } catch {
    return 0;
  }
}

function getLessonHref(lesson: { slug: string; category?: string }) {
  const category = lesson.category ?? "guides";
  return `/${category}/${lesson.slug}`;
}

export default async function DocsPage() {
  const modules = await getModules();
  const lessons = modules.flatMap(({ lessons }) => lessons);
  const duration = lessons.reduce((sum, lesson) => {
    if (lesson.video?.duration) return sum + lesson.video.duration;
    return sum + getLessonReadingDuration(lesson.slug);
  }, 0);

  const breadcrumbItems = [
    { name: "Home", url: absoluteUrl() },
    { name: "Docs", url: absoluteUrl("/docs") },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb>Docs</Breadcrumb>
        </Breadcrumbs>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getCoursePathwaySchema({
              name: "Blawby Legal Payments Curriculum",
              description:
                "A comprehensive set of lessons for legal professionals to master compliant payments.",
              lessons: lessons
                .filter(
                  (lesson): lesson is typeof lesson & { title: string } =>
                    !!lesson.title,
                )
                .map((lesson) => ({
                  name: lesson.title,
                  description: lesson.description || "No description available",
                  url: absoluteUrl(getLessonHref(lesson)),
                })),
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getSoftwareApplicationSchema()),
        }}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Blawby Documentation
        </h1>
        <p className="mt-7 max-w-lg text-base/7 text-pretty text-ink">
          {siteConfig.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm/7 font-semibold text-ink sm:gap-3">
          <div className="flex items-center gap-1.5">
            <BookIcon className="stroke-ink/40" />
            {modules.length} modules
          </div>
          <span className="hidden text-ink/25 sm:inline">&middot;</span>
          <div className="flex items-center gap-1.5">
            <LessonsIcon className="stroke-ink/40" />
            {lessons.length} lessons
          </div>
          <span className="hidden text-ink/25 sm:inline">&middot;</span>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="stroke-ink/40" />
            {formatDuration(duration)}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-4">
          {modules[0]?.lessons[0] && (
            <Button href={getLessonHref(modules[0].lessons[0])}>
              Get started
            </Button>
          )}
          <Button
            href="/payments/accepting-payments"
            className="inline-flex items-center gap-x-2"
          >
            <PlayIcon className="h-4 w-4 fill-gray-900" />
            Start accepting payments with Blawby
          </Button>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Payments Built for Lawyers Who Value Their Time
          </h2>
          <p className="mt-6 text-lg leading-8 text-ink-2">
            Legal professionals didn't go to law school to spend hours sending
            invoices, chasing payments, or navigating complex billing systems.
            That's why we built Blawby—a fast, secure, and effortless way for
            attorneys and law firms to collect payments online.
          </p>
          <p className="mt-4 text-lg leading-8 text-ink-2">
            With Blawby, you get a reusable, secure payment link that works for
            every client. Just update the amount in the URL, send the link, and
            get paid. No logins, no custom software, no back-and-forth.
          </p>

          <h3 className="mt-10 text-xl font-semibold text-ink">
            Send Payment Requests Instantly—Without Logging In
          </h3>
          <p className="mt-4 text-base text-ink-2">
            Traditional legal billing software can be bloated and time-consuming.
            Blawby simplifies everything:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-2 text-base text-ink-2">
            <li>
              Share your link with any client, anytime—via email, text, or chat.
            </li>
            <li>
              Edit the payment amount in the URL on the fly. One link, infinite
              flexibility.
            </li>
            <li>No invoice generation, no dashboard navigation, no delay.</li>
          </ul>
          <p className="mt-4 text-base text-ink-2">
            Whether you're billing for a flat-fee consultation or hourly work,
            Blawby keeps it simple and secure.
          </p>

          <h3 className="mt-10 text-xl font-semibold text-ink">
            No Setup. No Code. No Problem.
          </h3>
          <p className="mt-4 text-base text-ink-2">
            You don't need Zapier. You don't need APIs. You don't need to be a
            developer. Blawby works out of the box with end-to-end encryption
            and compliance built for legal practices. No manual configuration or
            technical setup required—just instant onboarding so you can start
            sending payment links within minutes.
          </p>
          <p className="mt-4 text-base text-ink-2">
            You're busy enough. We make it easy to start, stay secure, and scale
            with your practice.
          </p>

          <h3 className="mt-10 text-xl font-semibold text-ink">
            More Time for Clients, Less Time on Admin
          </h3>
          <ul className="mt-4 list-inside list-disc space-y-2 text-base text-ink-2">
            <li>
              Lawyers using Blawby report saving hours every week by eliminating
              repetitive billing tasks. That's time you can reinvest in client
              service, case strategy, or even just ending your day on time.
            </li>
            <li>Reduce admin overhead by automating payment collection.</li>
            <li>Stop chasing clients with one-touch payment reminders.</li>
            <li>
              See payments land faster, with no friction for your clients.
            </li>
          </ul>

          <h3 className="mt-10 text-xl font-semibold text-ink">
            Built for Legal. Trusted by Professionals.
          </h3>
          <p className="mt-4 text-base text-ink-2">
            Whether you're a solo attorney, small firm, or growing legal team,
            Blawby was designed for the unique needs of the legal industry. We
            understand how important it is to protect client data, operate
            ethically, and keep billing crystal clear.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-2 text-base text-ink-2">
            <li>
              Secure by design with PCI compliance and data privacy best
              practices.
            </li>
            <li>
              Transparent pricing with no hidden fees or surprise charges.
            </li>
            <li>
              Designed for attorneys, not just generic service providers.
            </li>
          </ul>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            IOLTA Compliance: Simplified for Modern Legal Practices
          </h2>
          <p className="mt-6 text-lg leading-8 text-ink-2">
            Trust accounts are fundamental to legal ethics. Whether you're
            holding client retainers, court filing fees, or settlement funds,
            the rules are clear: those funds must be handled with care and kept
            separate from operating funds. Mistakes, even honest ones, can carry
            serious consequences.
          </p>
          <p className="mt-4 text-base text-ink-2">
            Blawby is designed to make this easier. Our platform routes 100% of
            every client payment to your connected trust account. We never
            deduct fees from those funds. Instead, processing and platform fees
            are charged separately to a card tied to your firm's operating
            account. No complex setup. No risk of accidental non-compliance.
          </p>
          <h3 className="mt-10 text-xl font-semibold text-ink">
            How Blawby Helps
          </h3>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-base text-ink-2">
            <li>
              The entire payment amount is deposited into your connected trust
              account.
            </li>
            <li>Processing fees are not deducted from that payment.</li>
            <li>
              Instead, those fees are billed to a credit or debit card linked to
              your firm's operating account.
            </li>
          </ol>
          <p className="mt-4 text-base text-ink-2">
            This flow ensures that client funds remain whole, and compliance
            isn't left to manual tracking or trust in the wrong software
            configuration.
          </p>
          <h3 className="mt-10 text-xl font-semibold text-ink">
            Why Firms Use Blawby
          </h3>
          <ul className="mt-4 list-inside list-disc space-y-2 text-base text-ink-2">
            <li>No fees deducted from trust</li>
            <li>No complex multi-account setup</li>
            <li>
              Simple configuration for trust payouts and operating account
              billing
            </li>
            <li>Transparent monthly billing structure</li>
          </ul>
          <p className="mt-4 text-base text-ink-2">
            We're not reinventing legal payments—we're refining the flow so it
            aligns with compliance.
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Simple no-tricks pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-ink-2">
            Access a complete payments platform with simple, pay-as-you-go
            pricing. No setup fees, or hidden fees.
          </p>
        </div>

        <Pricing price={40} />

        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Explore Blawby Documentation & Lessons
          </h2>
          <p className="mt-4 mb-10 max-w-2xl text-lg text-ink-2">
            Dive into our comprehensive guides and video lessons to master
            compliant payments, client management, and more. Whether you're just
            getting started or looking to deepen your expertise, you'll find
            step-by-step modules and practical resources below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-16 pb-10 sm:px-4">
          {modules.map((module: Module, index: number) => (
            <PageSection
              key={module.id}
              id={module.id}
              title={`Part ${index + 1}`}
            >
              <div className="max-w-2xl">
                <h2 className="text-2xl/7 font-medium tracking-tight text-pretty text-ink">
                  {module.title}
                </h2>
                <p className="mt-4 text-base/7 text-ink-2 sm:text-sm/7">
                  {module.description}
                </p>

                <ol className="mt-6 space-y-4">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.slug}>
                      <ContentLink
                        title={lesson.title || "Untitled Lesson"}
                        description={
                          lesson.description || "No description available"
                        }
                        href={getLessonHref(lesson)}
                        type={lesson.video ? "video" : "article"}
                        duration={
                          lesson.video?.duration ||
                          getLessonReadingDuration(lesson.slug)
                        }
                      />
                    </li>
                  ))}
                </ol>
              </div>
            </PageSection>
          ))}
        </div>

        <CTASection
          title="Ready to get started?"
          description="Blawby makes compliant credit card payments easy for legal professionals. Start your journey to secure, streamlined, and ABA-compliant payments today."
          buttonText="Register for Blawby"
          buttonHref="https://ai.blawby.com/register"
        />
      </div>
    </SidebarLayoutContent>
  );
}
