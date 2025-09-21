"use client";

import { useEffect, useRef, useState } from "react";

interface LineChartProps {
  series: Array<{
    name: string;
    data: number[];
    color: string;
  }>;
  categories: string[];
  height?: number;
  id: string;
}

export function LineChart({
  series,
  categories,
  height = 400,
  id,
}: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [isDark, setIsDark] = useState(() => {
    // Initialize with actual dark mode state to prevent double render
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof document === "undefined") return;
      const dark =
        document.documentElement?.classList?.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(dark);
    };

    // Remove initial checkDarkMode() call to prevent double render

    if (typeof document !== "undefined") {
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", checkDarkMode);

      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener("change", checkDarkMode);
      };
    }
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const loadApexCharts = async () => {
      // Clean up existing chart instance before creating new one
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      const ApexCharts = (await import("apexcharts")).default;

      const textColor = isDark ? "#ffffff" : "#111827";
      const strokeColor = isDark ? "#374151" : "#e5e7eb";

      const options = {
        series,
        chart: {
          type: "area" as const,
          width: "100%",
          height,
          background: "transparent",
          fontFamily: "Inter, sans-serif",
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800,
          },
        },
        theme: { mode: isDark ? "dark" : "light" },
        stroke: {
          width: 3,
          curve: "smooth" as const,
          colors: series.map((s) => s.color),
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 0.7,
            opacityFrom: 0.4,
            opacityTo: 0,
            stops: [0, 100],
          },
        },
        markers: { size: 0 }, // no dots
        legend: {
          show: true,
          position: "bottom" as const, // always below
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          labels: { colors: textColor },
        },
        dataLabels: { enabled: false },
        tooltip: {
          shared: true,
          intersect: false,
          theme: isDark ? "dark" : "light",
          style: { fontFamily: "Inter, sans-serif" },
          y: { formatter: (val: number) => `${val}%` },
        },
        xaxis: {
          categories,
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              colors: textColor,
              fontSize: "16px",
            },
          },
          axisTicks: { show: false },
          axisBorder: { show: false },
        },
        yaxis: {
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              colors: textColor,
              fontSize: "16px",
            },
            formatter: (val: number) => `${val}%`,
          },
        },
        grid: {
          show: true,
          strokeDashArray: 4,
          borderColor: strokeColor,
          padding: { left: 2, right: 2, top: -20 },
        },
        responsive: [
          {
            breakpoint: 1024, // tablet
            options: {
              chart: { height: 350 },
              legend: { position: "bottom" },
              xaxis: { labels: { style: { fontSize: "14px" } } },
              yaxis: { labels: { style: { fontSize: "14px" } } },
            },
          },
          {
            breakpoint: 768, // large mobile
            options: {
              chart: { height: 300 },
              legend: { position: "bottom" },
              xaxis: { labels: { rotate: -30, style: { fontSize: "13px" } } },
              yaxis: { labels: { style: { fontSize: "13px" } } },
            },
          },
          {
            breakpoint: 480, // small mobile
            options: {
              chart: { height: 250 },
              legend: { position: "bottom" },
              xaxis: { labels: { rotate: -45, style: { fontSize: "12px" } } },
              yaxis: { labels: { style: { fontSize: "12px" } } },
              stroke: { width: 2 },
            },
          },
        ],
      };

      chartInstanceRef.current = new ApexCharts(chartRef.current, options);
      chartInstanceRef.current.render();
    };

    loadApexCharts();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [series, categories, height, isDark]);

  return <div ref={chartRef} id={id} className="w-full" />;
}
