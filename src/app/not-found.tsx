import {
  Breadcrumb,
  BreadcrumbHome,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "@/components/breadcrumbs";
import { Button } from "@/components/button";
import { SidebarLayoutContent } from "@/components/sidebar-layout";
import { getBreadcrumbSchema } from "@/utils/breadcrumb-schema";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
  description:
    "Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back to the homepage.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  const breadcrumbItems = [
    { name: "Home", url: "https://blawby.com" },
    { name: "404 - Page Not Found", url: "https://blawby.com/404" },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  // Additional WebPage schema for the 404 page
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "404 – Page Not Found",
    description: "Sorry, we couldn't find the page you're looking for.",
    url: "https://blawby.com/404",
    breadcrumb: breadcrumbSchema,
  };

  return (
    <SidebarLayoutContent
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbHome />
          <BreadcrumbSeparator />
          <Breadcrumb>404 - Page Not Found</Breadcrumb>
        </Breadcrumbs>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 sm:py-24">
        <p className="text-base font-semibold text-gray-950 dark:text-white">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-center text-base text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for. Please check the
          URL or navigate back to the homepage.
        </p>
        <div className="mt-8">
          <Button href="/">Back to homepage</Button>
        </div>
      </div>
    </SidebarLayoutContent>
  );
}
