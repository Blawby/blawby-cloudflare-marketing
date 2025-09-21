import { Button } from "@/components/button";
import { Logo } from "@/components/logo";
import {
  BusinessModel,
  CompetitiveLandscape,
  Financials,
  GoToMarket,
  InvestmentAsk,
  MarketOpportunity,
  Problem,
  ProductFeatures,
  Solution,
  Team,
  Traction,
  WhyBlawby,
} from "@/components/pitch-deck";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import TableOfContents from "@/components/table-of-contents";
import { BookIcon } from "@/icons/book-icon";
import { ClockIcon } from "@/icons/clock-icon";
import { LessonsIcon } from "@/icons/lessons-icon";
import { PlayIcon } from "@/icons/play-icon";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blawby Investor Pitch",
  description: "Unified Platform for Legal Payments & AI‑Driven Client Intake",
  alternates: { canonical: "https://blawby.com/pitch-deck" },
};

export default function PitchDeckPage() {
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: "Blawby Investor Pitch", url: "https://blawby.com/pitch-deck" },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <SidebarLayoutContent breadcrumbs={null}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
              <h1 className="mt-7 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl dark:text-white">
                Investor Pitch Deck
              </h1>
              <p className="mt-4 max-w-2xl text-lg/7 text-pretty text-gray-700 dark:text-gray-300">
                Unified Platform for Legal Payments & AI‑Driven Client Intake
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm/7 font-semibold text-gray-950 sm:gap-3 dark:text-white">
                <div className="flex items-center gap-1.5">
                  <BookIcon className="stroke-gray-950/40 dark:stroke-white/40" />
                  Pre-seed Investment Opportunity
                </div>
                <span className="hidden text-gray-950/25 sm:inline dark:text-white/25">
                  &middot;
                </span>
                <div className="flex items-center gap-1.5">
                  <LessonsIcon className="stroke-gray-950/40 dark:stroke-white/40" />
                  $200k Funding Round
                </div>
                <span className="hidden text-gray-950/25 sm:inline dark:text-white/25">
                  &middot;
                </span>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="stroke-gray-950/40 dark:stroke-white/40" />
                  Legal Tech Innovation
                </div>
              </div>
              <div className="mt-10">
                <Button
                  href="/help"
                  className="inline-flex items-center gap-x-2"
                >
                  <PlayIcon className="fill-gray-900" />
                  Get Investment Information
                </Button>
              </div>

              <div className="mt-16">
                <div className="flex gap-x-10">
                  <div className="w-full flex-1">
                    <div id="content" className="prose max-w-none">
                      <Problem />
                      <Solution />
                      <ProductFeatures />
                      <MarketOpportunity />
                      <BusinessModel />
                      <Traction />
                      <Team />
                      <CompetitiveLandscape />
                      <GoToMarket />
                      <Financials />
                      <InvestmentAsk />
                      <WhyBlawby />
                    </div>
                  </div>
                  <div className="hidden w-66 lg:block">
                    <TableOfContents contentId="content" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayoutContent>
  );
}
