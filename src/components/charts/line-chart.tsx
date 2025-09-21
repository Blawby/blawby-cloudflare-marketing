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
  const [isDark, setIsDark] = useState(false);

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof document === "undefined") return;
      const dark =
        document.documentElement?.classList?.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(dark);
    };

    checkDarkMode();

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

    let chart: any;

    const loadApexCharts = async () => {
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
            style: { fontFamily: "Inter, sans-serif", colors: textColor },
          },
          axisTicks: { show: false },
          axisBorder: { show: false },
        },
        yaxis: {
          labels: {
            show: true,
            style: { fontFamily: "Inter, sans-serif", colors: textColor },
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
              xaxis: { labels: { style: { fontSize: "12px" } } },
              yaxis: { labels: { style: { fontSize: "12px" } } },
            },
          },
          {
            breakpoint: 768, // large mobile
            options: {
              chart: { height: 300 },
              legend: { position: "bottom" },
              xaxis: { labels: { rotate: -30, style: { fontSize: "11px" } } },
              yaxis: { labels: { style: { fontSize: "11px" } } },
            },
          },
          {
            breakpoint: 480, // small mobile
            options: {
              chart: { height: 250 },
              legend: { position: "bottom" },
              xaxis: { labels: { rotate: -45, style: { fontSize: "10px" } } },
              yaxis: { labels: { style: { fontSize: "10px" } } },
              stroke: { width: 2 },
            },
          },
        ],
      };

      chart = new ApexCharts(chartRef.current, options);
      chart.render();
    };

    loadApexCharts();

    return () => {
      if (chart) chart.destroy();
    };
  }, [series, categories, height, isDark]);

  return <div ref={chartRef} id={id} className="w-full" />;
}
