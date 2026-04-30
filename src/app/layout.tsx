import CookieConsentComponent from "@/components/cookie-consent";
import { Footer } from "@/components/footer";
import { WebVitals } from "@/components/web-vitals";
import { siteConfig } from "@/config/site";
import { defaultSeoImage, getWebsiteSchema } from "@/utils/seo";
import { clsx } from "clsx";
import { GeistMono } from "geist/font/mono";
import { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import type React from "react";
import "./globals.css";

const InterVariable = localFont({
  variable: "--font-inter",
  src: [
    { path: "./InterVariable.woff2", style: "normal" },
    { path: "./InterVariable-Italic.woff2", style: "italic" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    template: "%s | Blawby",
    default: "Blawby - Compliant Credit Card Payments for Legal Practices",
  },
  description: siteConfig.description,
  keywords: [
    "legal payment processing",
    "credit card payments for lawyers",
    "IOLTA compliance",
    "ABA compliant payments",
    "law firm billing",
    "legal practice management",
    "trust account compliance",
    "legal payment gateway",
    "attorney payment processing",
    "legal billing software",
    "law firm credit card processing",
    "legal payment solutions",
    "compliance software",
    "legal technology",
    "payment security for law firms",
  ],
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Blawby - Compliant Credit Card Payments for Legal Practices",
    description: siteConfig.description,
    images: [defaultSeoImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blawby - Compliant Credit Card Payments for Legal Practices",
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    images: [siteConfig.defaultImage],
  },
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

const jsonLd = getWebsiteSchema();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={clsx(
        GeistMono.variable,
        InterVariable.variable,
        "scroll-pt-16 font-sans antialiased dark:bg-gray-950",
      )}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Manifest is handled by metadata.manifest, no need for manual <link> */}
      </head>
      <body className="dark:bg-gray-950">
        <WebVitals />
        <div className="isolate">{children}</div>
        <Footer />
        <CookieConsentComponent />
        {/* Google Analytics gtag.js */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                // Define initAnalytics but don't call config yet
                window.initAnalytics = function() {
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                };
                window.disableAnalytics = function() {
                  gtag('consent', 'update', {
                    'analytics_storage': 'denied'
                  });
                };
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
