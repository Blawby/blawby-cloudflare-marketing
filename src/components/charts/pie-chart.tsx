"use client";

import { useEffect, useRef, useState } from "react";

interface PieChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
  height?: number;
  id: string;
}

export function PieChart({
  data,
  labels,
  colors = [
    "var(--chart-primary)",    // Brand gold
    "var(--chart-secondary)",  // Blue
    "var(--chart-success)",    // Green
    "var(--chart-info)",       // Cyan
    "var(--chart-purple)",     // Purple
    "var(--chart-orange)",     // Orange
  ],
  height = 420,
  id,
}: PieChartProps) {
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

  // Monitor dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(dark);
    };

    // Remove initial checkDarkMode() call to prevent double render

    // Watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Watch for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
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
      const strokeColor = isDark ? "#1f2937" : "#ffffff";

      const options = {
        series: data,
        colors,
        chart: {
          type: "pie" as const,
          height,
          width: "100%",
          background: "transparent",
          fontFamily: "Inter, sans-serif",
          dropShadow: {
            enabled: false,
          },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800,
          },
        },
        theme: {
          mode: isDark ? "dark" : "light",
        },
        stroke: {
          colors: [strokeColor],
          lineCap: "round",
        },
        labels,
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -20,
            },
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            fontFamily: "Inter, sans-serif",
            colors: ["#111827"], // Always use dark text for readability on gold backgrounds
            fontSize: "16px",
            fontWeight: "600",
          },
          dropShadow: {
            enabled: false,
          },
          formatter: function (val: number) {
            return val.toFixed(1) + "%";
          },
        },
        legend: {
          position: "right" as const,
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          labels: {
            colors: textColor,
          },
          offsetY: 0,
          offsetX: 20,
          markers: {
            strokeWidth: 0,
          },
        },
        tooltip: {
          enabled: true,
          theme: isDark ? "dark" : "light",
          style: {
            fontFamily: "Inter, sans-serif",
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 350,
              },
              legend: {
                position: "bottom",
              },
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
  }, [data, labels, colors, height, isDark]);

  return <div ref={chartRef} id={id} className="w-full" />;
}
