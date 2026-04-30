"use client";

import { useEffect, useRef } from "react";
import { onCLS, onINP, onLCP } from "web-vitals";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function WebVitals() {
  const metricsQueue = useRef<any[]>([]);
  const gaLoaded = useRef(false);

  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!gaId) return;

    const flushQueue = () => {
      if (typeof window.gtag === "function") {
        metricsQueue.current.forEach((metric) => {
          sendMetric(metric);
        });
        metricsQueue.current = [];
        gaLoaded.current = true;
      }
    };

    const sendMetric = ({ name, value, delta, id }: any) => {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, {
          value: Math.round(name === "CLS" ? value * 1000 : value),
          event_category: "Web Vitals",
          event_label: id,
          non_interaction: true,
        });
      }
    };

    const report = (metric: any) => {
      if (typeof window.gtag === "function") {
        sendMetric(metric);
      } else {
        metricsQueue.current.push(metric);
      }
    };

    onCLS(report);
    onINP(report);
    onLCP(report);

    // Poll for gtag readiness if not loaded
    const interval = setInterval(() => {
      if (typeof window.gtag === "function") {
        flushQueue();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return null;
}
