"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    // Check if consent was already given (this depends on how vanilla-cookieconsent stores it)
    const checkConsent = () => {
      const consent = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cc_cookie="));
      if (consent) {
        try {
          const cookieData = JSON.parse(decodeURIComponent(consent.split("=")[1]));
          if (cookieData.categories.includes("analytics")) {
            setConsentGiven(true);
            if (window.gtag) {
              window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
              });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    };

    checkConsent();

    window.initAnalytics = () => {
      setConsentGiven(true);
      if (window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
        // Also ensure config is run if it was delayed
        window.gtag('config', gaId as string);
      }
    };

    window.disableAnalytics = () => {
      setConsentGiven(false);
      if (window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      }
    };
  }, [gaId]);

  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Set default consent to 'denied' immediately
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'personalization_storage': 'denied',
              'functionality_storage': 'granted',
              'security_storage': 'granted'
            });

            gtag('js', new Date());
            
            // Only run config if consent was already found during SSR/initial load
            // Otherwise initAnalytics will run it
            if (document.cookie.includes('analytics')) {
              gtag('config', '${gaId}');
              gtag('consent', 'update', {
                'analytics_storage': 'granted'
              });
            }
          `,
        }}
      />
    </>
  );
}
