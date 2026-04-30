import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const defaultSeoImage = {
  url: siteConfig.defaultImage,
  width: 1200,
  height: 630,
  alt: "Blawby - Compliant Credit Card Payments for Legal Practices",
};

export function absoluteUrl(path = "") {
  if (/^https?:\/\//.test(path)) return path;

  if (!path || path === "/") return siteConfig.url;

  return new URL(path.startsWith("/") ? path : `/${path}`, siteConfig.url)
    .toString()
    .replace(/\/$/, "");
}

export function getPageMetadata({
  title,
  description,
  path,
  image = siteConfig.defaultImage,
  imageAlt = defaultSeoImage.alt,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: imageUrl,
          width: defaultSeoImage.width,
          height: defaultSeoImage.height,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.twitterHandle,
      images: [imageUrl],
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: siteConfig.defaultImage,
    },
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    publisher: getOrganizationSchema(),
  };
}

export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description: siteConfig.description,
    url: siteConfig.url,
    image: absoluteUrl("/favicon.ico"),
    offers: {
      "@type": "Offer",
      price: "40",
      priceCurrency: "USD",
    },
  };
}

export function getWebPageSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
    provider: getOrganizationSchema(),
  };
}

export function getVideoSchema({
  name,
  description,
  thumbnailUrl,
  duration,
  contentUrl,
  uploadDate,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  contentUrl: string;
  uploadDate?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl,
    ...(uploadDate ? { uploadDate } : {}),
    duration: `PT${Math.floor(duration / 60)}M${duration % 60}S`,
    contentUrl,
    embedUrl: contentUrl,
    publisher: getOrganizationSchema(),
  };
}

export function getLearningResourceSchema({
  name,
  description,
  video,
}: {
  name: string;
  description: string;
  video?: {
    thumbnail: string;
    duration: number;
    url: string;
  } | null;
}) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "LearningResource" as const,
    name,
    description,
    provider: getOrganizationSchema(),
    learningResourceType: "Lesson",
    educationalLevel: "Beginner",
    audience: {
      "@type": "Audience",
      audienceType: "General public",
    },
  };

  if (!video) return baseData;

  return {
    ...baseData,
    "@type": ["LearningResource", "VideoObject"],
    thumbnailUrl: video.thumbnail,
    duration: `PT${Math.floor(video.duration / 60)}M${video.duration % 60}S`,
    contentUrl: video.url,
    embedUrl: video.url,
  };
}
