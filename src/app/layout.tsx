import { clsx } from "clsx";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import type React from "react";
import { Metadata } from "next";
import "./globals.css";

const InterVariable = localFont({
  variable: "--font-inter",
  src: [
    { path: "./InterVariable.woff2", style: "normal" },
    { path: "./InterVariable-Italic.woff2", style: "italic" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://compass.example.com'),
  title: {
    template: '%s - Compass',
    default: 'Compass - The Ultimate Guide to Navigating Uncertainty',
  },
  description: 'Compliant credit card payments for legal practices',
  keywords: ['uncertainty', 'decision making', 'personal development', 'mindfulness', 'determinism'],
  authors: [{ name: 'Tom Harris' }],
  creator: 'Tom Harris',
  publisher: 'Compass',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://compass.example.com',
    siteName: 'Compass',
    title: 'Compass - The Ultimate Guide to Navigating Uncertainty',
    description: 'Compliant credit card payments for legal practices',
    images: [{
      url: 'https://compass.example.com/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Compass - Navigate Uncertainty'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compass - The Ultimate Guide to Navigating Uncertainty',
    description: 'Compliant credit card payments for legal practices',
    creator: '@compass',
    images: ['https://compass.example.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://compass.example.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/site.webmanifest',
};

// Add JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Compass',
  description: 'Compliant credit card payments for legal practices',
  url: 'https://compass.example.com',
  publisher: {
    '@type': 'Organization',
    name: 'Compass',
    logo: {
      '@type': 'ImageObject',
      url: 'https://compass.example.com/logo.png'
    }
  }
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
      </head>
      <body>
        <div className="isolate">{children}</div>
      </body>
    </html>
  );
}
