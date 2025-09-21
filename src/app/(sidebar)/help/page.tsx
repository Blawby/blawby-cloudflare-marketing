import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Help & Support",
    description:
      "Need assistance with Blawby? Start a live chat with our AI assistant for instant answers about payments, invoicing, compliance, and more. For complex issues, you can create a support case and our team will follow up promptly.",
    openGraph: {
      title: "Help & Support",
      description:
        "Need assistance with Blawby? Start a live chat with our AI assistant for instant answers about payments, invoicing, compliance, and more. For complex issues, you can create a support case and our team will follow up promptly.",
      type: "website",
      images: [],
    },
    twitter: {
      card: "summary",
      title: "Help & Support",
      description:
        "Need assistance with Blawby? Start a live chat with our AI assistant for instant answers about payments, invoicing, compliance, and more. For complex issues, you can create a support case and our team will follow up promptly.",
    },
    alternates: {
      canonical: "https://blawby.com/help",
    },
  };
}

const helpStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Help & Support",
  description:
    "Need assistance with Blawby? Start a live chat with our AI assistant for instant answers about payments, invoicing, compliance, and more. For complex issues, you can create a support case and our team will follow up promptly.",
  provider: {
    "@type": "Organization",
    name: "Blawby",
    logo: {
      "@type": "ImageObject",
      url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
    },
  },
};

const breadcrumbItems = [
  { name: "Home", url: "https://blawby.com" },
  { name: "Help & Support", url: "https://blawby.com/help" },
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
      <div className="relative mx-auto max-w-7xl">
        <div className="absolute -inset-x-2 top-0 -z-10 h-80 overflow-hidden rounded-t-2xl mask-b-from-60% sm:h-88 md:h-112 lg:-inset-x-4 lg:h-128">
          <img
            alt=""
            src="https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/26a43a4d-6e82-4078-ea9c-2c11b3d77600/public"
            className="absolute inset-0 h-full w-full mask-l-from-60% object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 rounded-t-2xl outline-1 -outline-offset-1 outline-gray-950/10 dark:outline-white/10" />
        </div>
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <div className="px-4 pt-48 pb-12 lg:py-24">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
                Help & Support
              </h1>
              <p className="body-text mt-7 max-w-lg text-base/7 text-pretty text-gray-700 dark:text-gray-300">
                Need assistance with Blawby? Start a live chat with our AI
                assistant for instant answers about payments, invoicing,
                compliance, and more. For complex issues, you can create a
                support case and our team will follow up promptly.
              </p>
            </div>
            <div className="py-12">
              <iframe
                src="https://chat.blawby.com/?position=inline"
                title="Blawby Support Chat"
                style={{
                  border: "none",
                  width: "100%",
                  height: "600px",
                  background: "transparent",
                }}
                className="w-full rounded-2xl bg-transparent shadow-lg"
                allow="clipboard-write; microphone; camera"
              />
              <div className="flex justify-center">
                <p className="body-text mt-4 max-w-lg text-center text-xs text-pretty text-gray-700 dark:text-gray-300">
                  Blawby AI can make mistakes. Check important info.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayoutContent>
  );
}
