import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { ContentLink } from "@/components/content-link";
import { Logo } from "@/components/logo";
import { PageSection } from "@/components/page-section";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import { getModules, type Module } from "@/data/lessons";
import { BookIcon } from "@/icons/book-icon";
import { ClockIcon } from "@/icons/clock-icon";
import { LessonsIcon } from "@/icons/lessons-icon";
import { PlayIcon } from "@/icons/play-icon";
import type { Metadata } from "next";
import Link from "next/link";
import { CTASection } from "@/components/cta-section";
import { Button } from "@/components/button";
import { Pricing } from "@/components/pricing";
// import { LogoCloud } from "@/components/logo-cloud";
import fs from "fs";
import path from "path";
import Image from "next/image";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { getCoursePathwaySchema } from "@/utils/course-schema";

export const metadata: Metadata = {
  title: "Blawby - Compliant Credit Card Payments for Legal Practices",
  description: "Compliant credit card payments for legal practices",
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
      `${slug}.mdx`
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    // 200 words per minute reading speed
    return Math.ceil((wordCount / 200) * 60); // seconds
  } catch (e) {
    // If file not found or error, fallback to 0
    return 0;
  }
}

export default async function Page() {
  let modules = await getModules();
  let lessons = modules.flatMap(({ lessons }) => lessons);
  let duration = lessons.reduce((sum, lesson) => {
    if (lesson.video?.duration) return sum + lesson.video.duration;
    return sum + getLessonReadingDuration(lesson.id);
  }, 0);

  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: "Overview", url: "https://blawby.com/" },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb>Overview</Breadcrumb>
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
              lessons: lessons.map((lesson) => ({
                name: lesson.title,
                description: lesson.description,
                url: `https://blawby.com/${lesson.id}`,
              })),
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Blawby",
            operatingSystem: "Web",
            applicationCategory: "BusinessApplication",
            description:
              "Blawby is the all-in-one, ABA and IOLTA-compliant credit card payment solution for law firms and legal professionals. Accept payments securely, streamline billing, and ensure full trust account compliance.",
            url: "https://blawby.com",
            image: "https://blawby.com/favicon.ico",
            offers: {
              "@type": "Offer",
              price: "40",
              priceCurrency: "USD",
            },
          }),
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="absolute -inset-x-2 top-0 -z-10 h-80 overflow-hidden rounded-t-2xl mask-b-from-60% sm:h-88 md:h-112 lg:-inset-x-4 lg:h-128">
          <Image
            alt=""
            src="https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/26a43a4d-6e82-4078-ea9c-2c11b3d77600/public"
            fill
            className="absolute inset-0 h-full w-full mask-l-from-60% object-cover object-center opacity-40"
            priority
            unoptimized
          />
          <div className="absolute inset-0 rounded-t-2xl outline-1 -outline-offset-1 outline-gray-950/10 dark:outline-white/10" />
        </div>
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <div className="px-4 pt-48 pb-12 lg:py-24">
              <div className="flex items-center gap-3">
                <Logo className="h-8 dark:text-white" />
              </div>
              <h1 className="sr-only">Course overview</h1>
              <p className="mt-7 max-w-lg text-base/7 text-pretty text-gray-950 dark:text-gray-300">
                Blawby is the all-in-one, ABA and IOLTA-compliant credit card
                payment solution for law firms and legal professionals. Accept
                payments securely, streamline billing, and ensure full trust
                account compliance with industry-leading security and ease of
                use.
              </p>
              <p className="mt-4 text-base/7 text-pretty body-text"></p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm/7 font-semibold text-gray-950 sm:gap-3 dark:text-white">
                <div className="flex items-center gap-1.5">
                  <BookIcon className="stroke-gray-950/40 dark:stroke-white/40" />
                  {modules.length} modules
                </div>
                <span className="hidden text-gray-950/25 sm:inline dark:text-white/25">
                  &middot;
                </span>
                <div className="flex items-center gap-1.5">
                  <LessonsIcon className="stroke-gray-950/40 dark:stroke-white/40" />
                  {lessons.length} lessons
                </div>
                <span className="hidden text-gray-950/25 sm:inline dark:text-white/25">
                  &middot;
                </span>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="stroke-gray-950/40 dark:stroke-white/40" />
                  {formatDuration(duration)}
                </div>
              </div>
              <div className="mt-10">
                <Button
                  href={`/${modules[0].lessons[0].id}`}
                  className="inline-flex items-center gap-x-2"
                >
                  <PlayIcon className="fill-gray-900" />
                  Start accepting payments with Blawby
                </Button>
              </div>

              <div className="mt-16">
                {/*
                  Payments Value Proposition Section
                  ---------------------------------
                  This section highlights Blawby's unique value for legal professionals: time savings, simplicity, and legal-specific compliance. It is intentionally placed above the logo cloud to ensure visitors see the core differentiators before social proof. Only key features that benefit from scannability are in lists; the rest use clear headings and paragraphs for narrative flow.
                */}
                <h2 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                  Payments Built for Lawyers Who Value Their Time
                </h2>
                <p className="mt-6 text-lg leading-8 body-text text-gray-700 dark:text-gray-300">
                  Legal professionals didn't go to law school to spend hours
                  sending invoices, chasing payments, or navigating complex
                  billing systems. That's why we built Blawby—a fast, secure,
                  and effortless way for attorneys and law firms to collect
                  payments online.
                </p>
                <p className="mt-4 text-lg leading-8 body-text text-gray-700 dark:text-gray-300">
                  With Blawby, you get a reusable, secure payment link that
                  works for every client. Just update the amount in the URL,
                  send the link, and get paid. No logins, no custom software, no
                  back-and-forth.
                </p>

                <h3 className="mt-10 text-xl font-semibold text-gray-950 dark:text-white">
                  Send Payment Requests Instantly—Without Logging In
                </h3>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  Traditional legal billing software can be bloated and
                  time-consuming. Blawby simplifies everything:
                </p>
                <ul className="mt-2 space-y-2 body-text list-disc list-inside text-gray-700 dark:text-gray-300">
                  <li>
                    Share your link with any client, anytime—via email, text, or
                    chat.
                  </li>
                  <li>
                    Edit the payment amount in the URL on the fly. One link,
                    infinite flexibility.
                  </li>
                  <li>
                    No invoice generation, no dashboard navigation, no delay.
                  </li>
                </ul>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  Whether you're billing for a flat-fee consultation or hourly
                  work, Blawby keeps it simple and secure.
                </p>

                <h3 className="mt-10 text-xl font-semibold text-gray-950 dark:text-white">
                  No Setup. No Code. No Problem.
                </h3>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  You don't need Zapier. You don't need APIs. You don't need to
                  be a developer. Blawby works out of the box with end-to-end
                  encryption and compliance built for legal practices. No manual
                  configuration or technical setup required—just instant
                  onboarding so you can start sending payment links within
                  minutes.
                </p>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  You're busy enough. We make it easy to start, stay secure, and
                  scale with your practice.
                </p>

                <h3 className="mt-10 text-xl font-semibold text-gray-950 dark:text-white">
                  More Time for Clients, Less Time on Admin
                </h3>
                <ul className="mt-4 space-y-2 body-text list-disc list-inside text-gray-700 dark:text-gray-300">
                  <li>
                    Lawyers using Blawby report saving hours every week by
                    eliminating repetitive billing tasks. That's time you can
                    reinvest in client service, case strategy, or even just
                    ending your day on time.
                  </li>
                  <li>
                    Reduce admin overhead by automating payment collection.
                  </li>
                  <li>
                    Stop chasing clients with one-touch payment reminders.
                  </li>
                  <li>
                    See payments land faster, with no friction for your clients.
                  </li>
                </ul>

                <h3 className="mt-10 text-xl font-semibold text-gray-950 dark:text-white">
                  Built for Legal. Trusted by Professionals.
                </h3>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  Whether you're a solo attorney, small firm, or growing legal
                  team, Blawby was designed for the unique needs of the legal
                  industry. We understand how important it is to protect client
                  data, operate ethically, and keep billing crystal clear.
                </p>
                <ul className="mt-2 space-y-2 body-text list-disc list-inside text-gray-700 dark:text-gray-300">
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
              {/* TODO: Add logo cloud with light and dark svgs */}
              {/* <div className="mt-16">
                <LogoCloud />
              </div> */}

              {/*
                IOLTA Compliance Section
                ----------------------
                This section surfaces key IOLTA compliance content for legal professionals, adapted from our documentation. It is placed below the LogoCloud and above pricing to highlight Blawby's trust account compliance and fee handling advantages.
              */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                  IOLTA Compliance: Simplified for Modern Legal Practices
                </h2>
                <p className="mt-6 text-lg leading-8 body-text text-gray-700 dark:text-gray-300">
                  Trust accounts are fundamental to legal ethics. Whether you're
                  holding client retainers, court filing fees, or settlement
                  funds, the rules are clear: those funds must be handled with
                  care and kept separate from operating funds. Mistakes, even
                  honest ones, can carry serious consequences.
                </p>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  Blawby is designed to make this easier. Our platform routes
                  100% of every client payment to your connected trust account.
                  We never deduct fees from those funds. Instead, processing and
                  platform fees are charged separately to a card tied to your
                  firm's operating account. No complex setup. No risk of
                  accidental non-compliance.
                </p>
                <h3 className="mt-10 text-xl font-semibold text-gray-950 dark:text-white">
                  How Blawby Helps
                </h3>
                <ol className="mt-4 space-y-2 body-text list-decimal list-inside text-gray-700 dark:text-gray-300">
                  <li>
                    The entire payment amount is deposited into your connected
                    trust account.
                  </li>
                  <li>Processing fees are not deducted from that payment.</li>
                  <li>
                    Instead, those fees are billed to a credit or debit card
                    linked to your firm's operating account.
                  </li>
                </ol>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  This flow ensures that client funds remain whole, and
                  compliance isn't left to manual tracking or trust in the wrong
                  software configuration.
                </p>
                <h3 className="mt-10 text-xl font-semibold text-gray-950 dark:text-white">
                  Why Firms Use Blawby
                </h3>
                <ul className="mt-4 space-y-2 body-text list-disc list-inside text-gray-700 dark:text-gray-300">
                  <li>No fees deducted from trust</li>
                  <li>No complex multi-account setup</li>
                  <li>
                    Simple configuration for trust payouts and operating account
                    billing
                  </li>
                  <li>Transparent monthly billing structure</li>
                </ul>
                <p className="mt-4 text-base body-text text-gray-700 dark:text-gray-300">
                  We're not reinventing legal payments—we're refining the flow
                  so it aligns with compliance.
                </p>
              </div>

              <div className="mt-16">
                <h2 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                  Simple no-tricks pricing
                </h2>
                <p className="mt-6 text-lg leading-8 body-text text-gray-700 dark:text-gray-300">
                  Access a complete payments platform with simple, pay-as-you-go
                  pricing. No setup fees, or hidden fees.
                </p>
              </div>

              <Pricing price={40} />

              {/* Introduction to docs/lessons content */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                  Explore Blawby Documentation & Lessons
                </h2>
                <p className="mt-4 text-lg body-text max-w-2xl mb-10 text-gray-700 dark:text-gray-300">
                  Dive into our comprehensive guides and video lessons to master
                  compliant payments, client management, and more. Whether
                  you're just getting started or looking to deepen your
                  expertise, you'll find step-by-step modules and practical
                  resources below.
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
                      <h2 className="text-2xl/7 font-medium tracking-tight text-pretty text-gray-950 dark:text-white">
                        {module.title}
                      </h2>
                      <p className="mt-4 text-base/7 text-gray-700 sm:text-sm/7 dark:text-gray-300">
                        {module.description}
                      </p>

                      <ol className="mt-6 space-y-4">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <ContentLink
                              title={lesson.title}
                              description={lesson.description}
                              href={`/${lesson.id}`}
                              type={lesson.video ? "video" : "article"}
                              duration={
                                lesson.video?.duration ??
                                getLessonReadingDuration(lesson.id)
                              }
                            />
                          </li>
                        ))}
                      </ol>
                    </div>
                  </PageSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CTASection
        title="Ready to get started?"
        description="Blawby makes compliant credit card payments easy for legal professionals. Start your journey to secure, streamlined, and ABA-compliant payments today."
        buttonText="Register for Blawby"
        buttonHref="https://app.blawby.com/register"
      />
    </SidebarLayoutContent>
  );
}
