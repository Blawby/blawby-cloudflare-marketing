"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

declare global {
  interface Window {
    initAnalytics?: () => void;
    disableAnalytics?: () => void;
  }
}

export default function CookieConsentComponent() {
  useEffect(() => {
    (CookieConsent.run as any)({
      // Root element
      root: "body",

      // Auto show the popup
      autoShow: true,

      // Disable the popup on mobile
      disablePageInteraction: false,

      // Cookie consent categories
      categories: {
        necessary: {
          enabled: true, // Necessary cookies are always enabled
          readOnly: true, // Can't be disabled
        },
        analytics: {
          enabled: true,
          readOnly: false,
        },
      },

      // GUI options
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom right",
          equalWeightButtons: true,
          flipButtons: false,
        },
        preferencesModal: {
          layout: "box",
          position: "right",
          equalWeightButtons: true,
          flipButtons: false,
        },
      },

      // Language
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookie settings",
              description:
                "We use cookies to ensure you get the best experience on our website.",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
              footer: '<a href="/privacy-policy">Privacy Policy</a>',
            },
            preferencesModal: {
              title: "Cookie preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              savePreferencesBtn: "Save preferences",
              closeIconLabel: "Close modal",
              sections: [
                {
                  title: "Necessary cookies",
                  description:
                    "These cookies are required for the website to function properly.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics cookies",
                  description:
                    "These cookies help us understand how visitors interact with our website.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
      callbacks: {
        onFirstConsent: ({ cookie }: any) => {
          if (cookie.categories.includes("analytics")) {
            window.initAnalytics?.();
          }
        },
        onConsent: ({ cookie }: any) => {
          if (cookie.categories.includes("analytics")) {
            window.initAnalytics?.();
          } else {
            window.disableAnalytics?.();
          }
        },
      },
    } as any);

    return () => {
      // Cleanup if needed
      // CookieConsent.destroy() is not available in this version
    };
  }, []);

  return null;
}
