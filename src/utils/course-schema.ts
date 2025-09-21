// Generate Course schema.org JSON-LD for a single lesson
export function getCourseSchema({
  name,
  description,
  url,
  provider = { name: "Blawby", url: "https://blawby.com" },
}: {
  name: string;
  description: string;
  url: string;
  provider?: { name: string; url: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider.name,
      sameAs: provider.url,
    },
    url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "free",
    },
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "online",
        instructor: {
          "@type": "Organization",
          name: provider.name,
        },
        url,
        courseWorkload: "PT30M",
      },
    ],
  };
}

// Generate Course schema.org JSON-LD for a curriculum/overview with hasPart
export function getCoursePathwaySchema({
  name,
  description,
  lessons,
  provider = { name: "Blawby", url: "https://blawby.com" },
}: {
  name: string;
  description: string;
  lessons: { name: string; description: string; url: string }[];
  provider?: { name: string; url: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider.name,
      sameAs: provider.url,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "free",
    },
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "online",
        instructor: {
          "@type": "Organization",
          name: provider.name,
        },
        url: provider.url,
        courseWorkload: "PT30M",
      },
    ],
    hasPart: lessons.map((lesson) => ({
      "@type": "Course",
      name: lesson.name,
      description: lesson.description,
      url: lesson.url,
    })),
  };
}
