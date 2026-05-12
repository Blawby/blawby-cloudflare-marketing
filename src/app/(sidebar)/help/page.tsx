import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import { siteConfig } from "@/config/site";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { absoluteUrl, getPageMetadata, getWebPageSchema } from "@/utils/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    title: "Blawby Help & Support | Legal Practice Assistance",
    description: siteConfig.description,
    path: "/help",
  });
}

const helpStructuredData = getWebPageSchema({
  name: "Blawby Help & Support | Legal Practice Assistance",
  description: siteConfig.description,
  path: "/help",
});

const breadcrumbItems = [
  { name: "Home", url: absoluteUrl() },
  { name: "Help & Support", url: absoluteUrl("/help") },
];
const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

export default function HelpPage() {
  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb>Help & Support</Breadcrumb>
        </Breadcrumbs>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(helpStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Help &amp; Support
        </h1>
        <p className="mt-6 text-lg leading-8 text-ink-2">
          Have a question about pricing, IOLTA compliance, or getting set up?
          Send us a note and we'll reply by email.
        </p>

        <h2 className="mt-12 text-xl font-semibold text-ink">
          Other ways to reach us
        </h2>
        <ul className="mt-4 space-y-2 text-base text-ink-2">
          <li>
            Read the{" "}
            <a className="text-accent underline hover:no-underline" href="/docs">
              documentation
            </a>{" "}
            for step-by-step setup guides.
          </li>
          <li>
            Review{" "}
            <a
              className="text-accent underline hover:no-underline"
              href="/pricing"
            >
              pricing
            </a>{" "}
            and nonprofit discount details.
          </li>
          <li>
            Join us on{" "}
            <a
              className="text-accent underline hover:no-underline"
              href="https://discord.gg/rPmzknKv"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>{" "}
            for community support.
          </li>
        </ul>

        <ContactForm />
      </div>
    </SidebarLayoutContent>
  );
}
