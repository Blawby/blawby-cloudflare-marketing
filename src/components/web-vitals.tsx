"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP } from "web-vitals";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function WebVitals() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!gaId) return;

    const report = ({ name, value, delta, id }: any) => {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, {
          value: Math.round(name === "CLS" ? value * 1000 : value),
          event_category: "Web Vitals",
          event_label: id,
          non_interaction: true,
        });
      }
    };

    onCLS(report);
    onINP(report);
    onLCP(report);
  }, []);

  return null;
}
