import CookieConsentComponent from "@/components/cookie-consent";
import { Footer } from "@/components/footer";
import { clsx } from "clsx";
import { GeistMono } from "geist/font/mono";
import { Metadata } from "next";
import localFont from "next/font/local";
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
  metadataBase: new URL("https://blawby.com"),
  title: {
    template: "%s | Blawby",
    default: "Blawby - Compliant Credit Card Payments for Legal Practices",
  },
  description:
    "Blawby is the all-in-one, ABA and IOLTA-compliant credit card payment solution for law firms and legal professionals. Accept payments securely, streamline billing, and ensure full trust account compliance with industry-leading security and ease of use.",
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
  authors: [{ name: "Paul Chris Luke" }],
  creator: "Paul Chris Luke",
  publisher: "Blawby",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://blawby.com",
    siteName: "Blawby",
    title: "Blawby - Compliant Credit Card Payments for Legal Practices",
    description:
      "Blawby is the all-in-one, ABA and IOLTA-compliant credit card payment solution for law firms and legal professionals. Accept payments securely, streamline billing, and ensure full trust account compliance with industry-leading security and ease of use.",
    images: [
      {
        url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
        width: 1200,
        height: 630,
        alt: "Blawby - Compliant Credit Card Payments for Legal Practices",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blawby - Compliant Credit Card Payments for Legal Practices",
    description:
      "Blawby is the all-in-one, ABA and IOLTA-compliant credit card payment solution for law firms and legal professionals. Accept payments securely, streamline billing, and ensure full trust account compliance with industry-leading security and ease of use.",
    creator: "@blawby",
    images: [
      "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
    ],
  },
  alternates: {
    canonical: "https://blawby.com",
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
  verification: {
    google: "your-google-verification-code",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
};

// Add JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Blawby",
  description:
    "Blawby is the all-in-one, ABA and IOLTA-compliant credit card payment solution for law firms and legal professionals. Accept payments securely, streamline billing, and ensure full trust account compliance with industry-leading security and ease of use.",
  url: "https://blawby.com",
  publisher: {
    "@type": "Organization",
    name: "Blawby",
    logo: {
      "@type": "ImageObject",
      url: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/527f8451-2748-4f04-ea0f-805a4214cd00/public",
    },
  },
};

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
        <link rel="manifest" href="/site.webmanifest" />
        {/* Google Analytics gtag.js */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-LXBVNX707M"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LXBVNX707M');
            `,
          }}
        />
      </head>
      <body>
        <div className="isolate">{children}</div>
        <Footer />
        <CookieConsentComponent />
      </body>
    </html>
  );
}
